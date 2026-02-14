/**
 * Deriv's AI Coach - Side panel logic
 * Connects to Deriv WebSocket API, subscribes to TRANSACTIONS (not just balance),
 * tracks actual trade outcomes (buy→sell pairs), and provides AI-powered coaching.
 *
 * KEY FIX: Uses `transaction` subscription to distinguish purchases from settlements.
 * A single trade = 1 buy (balance decreases) + 1 sell (balance changes).
 * Only the SELL determines win/loss: profit = sell_amount - buy_amount.
 *
 * IMPORTANT: The AI Coach NEVER provides buy/sell signals or trading predictions.
 */

const DERIV_WS = 'wss://ws.derivws.com/websockets/v3';
const APP_ID = 1089;
const API_BASE = 'http://localhost:3000';

const LOSS_WARNING_THRESHOLD = 0.05;
const LOSS_ALERT_THRESHOLD = 0.10;
const STOP_COUNTDOWN_SECONDS = 5;

const WARNING_ICON = '<svg class="message-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>';
const WIN_ICON = '<svg class="message-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>';
const AI_ICON = '<svg class="message-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l2 2"/><path d="M8 12h0"/><path d="M16 12h0"/></svg>';

let socket = null;
let pingInterval = null;
let awaitingSubscriptions = 0;
let stopCountdownInterval = null;

const REVENGE_TRADING_WINDOW_MS = 3 * 60 * 1000; // 3 min

/**
 * Open contracts map: tracks purchases waiting for settlement.
 * Key: contract_id, Value: { buyAmount, instrument, time }
 */
let openContracts = {};

let state = {
  balance: null,
  currency: 'USD',
  sessionStartBalance: null,
  wins: 0,
  losses: 0,
  streak: 0,
  sessionId: null,
  lastLossTime: null,
};

function generateSessionId() {
  return 'ext-' + Date.now() + '-' + Math.random().toString(36).slice(2, 11);
}

function syncToApi(eventType, payload) {
  const sessionId = state.sessionId || generateSessionId();
  if (!state.sessionId) state.sessionId = sessionId;
  const body = {
    session_id: sessionId,
    event_type: eventType,
    ...payload,
  };
  fetch(`${API_BASE}/api/trading`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).catch(() => {});
}

/**
 * Request an AI-generated coaching message from the backend (Gemini-powered).
 * Falls back to null if the API is unavailable.
 */
async function getAICoachMessage(tradeContext) {
  try {
    const res = await fetch(`${API_BASE}/api/coach/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tradeContext),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.message || null;
  } catch {
    return null;
  }
}

const setupSection = document.getElementById('setup-section');
const connectedSection = document.getElementById('connected-section');
const settingsSection = document.getElementById('settings-section');
const apiTokenInput = document.getElementById('api-token');
const connectBtn = document.getElementById('connect-btn');
const disconnectBtn = document.getElementById('disconnect-btn');
const balanceValue = document.getElementById('balance-value');
const balanceCurrency = document.getElementById('balance-currency');
const winsCount = document.getElementById('wins-count');
const lossesCount = document.getElementById('losses-count');
const streakValue = document.getElementById('streak-value');
const coachMessages = document.getElementById('coach-messages');
const placeholderMsg = document.getElementById('placeholder-msg');
const statusBar = document.getElementById('status-bar');
const statusDot = document.getElementById('status-dot');
const statusText = document.getElementById('status-text');
const stopOverlay = document.getElementById('stop-overlay');
const stopCountEl = document.getElementById('stop-count');
const stopActions = document.getElementById('stop-actions');
const stopStayBtn = document.getElementById('stop-stay-btn');
const harshModeToggle = document.getElementById('harsh-mode');
const settingsBtn = document.getElementById('settings-btn');
const settingsBackBtn = document.getElementById('settings-back-btn');

// Load saved settings
chrome.storage.local.get(['apiToken', 'harshMode'], (r) => {
  if (r.apiToken) apiTokenInput.value = r.apiToken;
  if (r.harshMode !== undefined) harshModeToggle.checked = r.harshMode;
});

function setStatus(connected, text) {
  statusBar.classList.remove('hidden');
  statusDot.className = 'status-dot' + (connected === true ? ' connected' : connected === false ? ' error' : '');
  statusText.textContent = text;
}

function addCoachMessage(text, type = 'neutral') {
  placeholderMsg?.classList.add('hidden');
  const el = document.createElement('div');
  el.className = `message ${type}`;
  const icon = type === 'loss' ? WARNING_ICON : type === 'win' ? WIN_ICON : type === 'ai' ? AI_ICON : '';
  el.innerHTML = `
    ${icon}
    <div class="message-body">
      <span>${text}</span>
      <div class="message-time">${new Date().toLocaleTimeString()}</div>
    </div>
  `;
  coachMessages.insertBefore(el, coachMessages.firstChild);
  while (coachMessages.children.length > 10) {
    coachMessages.removeChild(coachMessages.lastChild);
  }
}

function addThinkingIndicator() {
  const el = document.createElement('div');
  el.className = 'message ai thinking-msg';
  el.id = 'ai-thinking';
  el.innerHTML = `
    ${AI_ICON}
    <div class="message-body">
      <span class="thinking-dots">AI Coach is thinking<span class="dots">...</span></span>
      <div class="message-time">${new Date().toLocaleTimeString()}</div>
    </div>
  `;
  coachMessages.insertBefore(el, coachMessages.firstChild);
  return el;
}

function removeThinkingIndicator() {
  const el = document.getElementById('ai-thinking');
  if (el) el.remove();
}

function showConnected() {
  setupSection.classList.add('hidden');
  connectedSection.classList.remove('hidden');
  settingsSection.classList.add('hidden');
}

function showSetup() {
  setupSection.classList.remove('hidden');
  connectedSection.classList.add('hidden');
  settingsSection.classList.add('hidden');
  state = { balance: null, currency: 'USD', sessionStartBalance: null, wins: 0, losses: 0, streak: 0, sessionId: null, lastLossTime: null };
  openContracts = {};
  updateUI();
}

function updateUI() {
  balanceValue.textContent = state.balance != null ? formatBalance(state.balance) : '--';
  balanceCurrency.textContent = state.currency || 'USD';
  winsCount.textContent = state.wins;
  winsCount.parentElement.classList.toggle('positive', state.wins > 0);
  lossesCount.textContent = state.losses;
  lossesCount.parentElement.classList.toggle('negative', state.losses > 0);
  streakValue.textContent = state.streak;
  streakValue.parentElement.classList.toggle('positive', state.streak > 0);
  streakValue.parentElement.classList.toggle('negative', state.streak < 0);
}

function formatBalance(bal) {
  return Number(bal).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function send(msg) {
  if (socket?.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(msg));
  }
}

function closeDerivTab() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs[0];
    if (tab?.id && /deriv\.com/.test(tab.url || '')) {
      chrome.tabs.remove(tab.id);
    } else {
      chrome.tabs.query({ url: '*://*.deriv.com/*' }, (derivTabs) => {
        if (derivTabs[0]?.id) chrome.tabs.remove(derivTabs[0].id);
      });
    }
  });
}

function showStopOverlay() {
  stopOverlay.classList.remove('hidden');
  stopActions.classList.toggle('hidden', harshModeToggle.checked);
  let count = STOP_COUNTDOWN_SECONDS;
  stopCountEl.textContent = count;

  stopCountdownInterval = setInterval(() => {
    count--;
    stopCountEl.textContent = count;
    if (count <= 0) {
      clearInterval(stopCountdownInterval);
      stopCountdownInterval = null;
      stopOverlay.classList.add('hidden');
      closeDerivTab();
    }
  }, 1000);
}

function hideStopOverlay() {
  if (stopCountdownInterval) {
    clearInterval(stopCountdownInterval);
    stopCountdownInterval = null;
  }
  stopOverlay.classList.add('hidden');
}

connectBtn.addEventListener('click', connect);
disconnectBtn.addEventListener('click', disconnect);

settingsBtn?.addEventListener('click', () => {
  if (!setupSection.classList.contains('hidden')) setupSection.classList.add('hidden');
  if (!connectedSection.classList.contains('hidden')) connectedSection.classList.add('hidden');
  settingsSection.classList.remove('hidden');
});

settingsBackBtn?.addEventListener('click', () => {
  settingsSection.classList.add('hidden');
  if (state.balance != null) {
    connectedSection.classList.remove('hidden');
  } else {
    setupSection.classList.remove('hidden');
  }
});

stopStayBtn?.addEventListener('click', hideStopOverlay);

harshModeToggle?.addEventListener('change', (e) => {
  chrome.storage.local.set({ harshMode: e.target.checked });
});

function connect() {
  const token = apiTokenInput.value?.trim();
  if (!token) {
    addCoachMessage('Please enter your Deriv API token.', 'warning');
    return;
  }

  connectBtn.disabled = true;
  setStatus(null, 'Connecting...');

  const url = `${DERIV_WS}?app_id=${APP_ID}`;
  socket = new WebSocket(url);

  socket.onopen = () => {
    setStatus(null, 'Authorizing...');
    send({ authorize: token });
  };

  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (typeof window !== 'undefined' && window.DEBUG) {
        console.log('[Deriv WS]', data.msg_type || 'unknown', data);
      }

      if (data.error) {
        setStatus(false, 'Error: ' + (data.error.message || 'Unknown'));
        addCoachMessage('Connection failed: ' + (data.error.message || 'Check your API token.'), 'loss');
        connectBtn.disabled = false;
        return;
      }

      switch (data.msg_type) {
        case 'authorize':
          onAuthorized(data);
          break;

        case 'balance':
          // Balance subscription: ONLY update display, NO win/loss logic
          onBalanceUpdate(data);
          break;

        case 'transaction':
          // Transaction subscription: the CORRECT place for win/loss tracking
          onTransaction(data.transaction);
          break;

        default:
          break;
      }
    } catch (e) {
      console.error('[Deriv AI Coach] Parse error:', e);
    }
  };

  socket.onclose = () => {
    setStatus(false, 'Disconnected');
    connectBtn.disabled = false;
    stopPing();
  };

  socket.onerror = () => {
    setStatus(false, 'Connection error');
    connectBtn.disabled = false;
  };
}

/**
 * Handle successful authorization.
 * Subscribe to both `balance` (for display) and `transaction` (for trade tracking).
 */
function onAuthorized(data) {
  const authData = data.authorize;
  state.balance = parseFloat(authData?.balance) || 0;
  state.currency = authData?.currency || 'USD';
  state.sessionStartBalance = state.balance;
  state.sessionId = state.sessionId || generateSessionId();

  chrome.storage.local.set({ apiToken: apiTokenInput.value?.trim() });

  setStatus(null, 'Subscribing...');

  // Subscribe to balance updates (for real-time balance display)
  send({ balance: 1, subscribe: 1 });
  // Subscribe to transaction events (for accurate trade tracking)
  send({ transaction: 1, subscribe: 1 });

  // Give subscriptions a moment, then mark connected
  awaitingSubscriptions = 2;
  setTimeout(() => {
    if (awaitingSubscriptions > 0) {
      awaitingSubscriptions = 0;
      markConnected();
    }
  }, 3000);
}

function markConnected() {
  syncToApi('connect', {
    initial_balance: state.sessionStartBalance,
    balance: state.balance,
    currency: state.currency,
  });
  setStatus(true, 'Connected');
  showConnected();
  connectBtn.disabled = false;
  startPing();
  addCoachMessage("You're connected! I'll analyze your trades and coach you in real-time using AI. Good luck!", 'win');
  updateUI();
}

/**
 * Balance subscription handler — ONLY updates the display.
 * Does NOT trigger win/loss logic (that's handled by onTransaction).
 */
function onBalanceUpdate(data) {
  const bal = data.balance?.balance ?? data.balance;
  if (typeof bal === 'number' || typeof bal === 'string') {
    state.balance = parseFloat(bal);
    updateUI();
  }
  // Count down subscriptions
  if (awaitingSubscriptions > 0) {
    awaitingSubscriptions--;
    if (awaitingSubscriptions === 0) markConnected();
  }
}

/**
 * Transaction subscription handler — the CORRECT place for trade tracking.
 *
 * Deriv sends:
 *   action="buy"  → you purchased a contract (balance decreases, NOT a loss)
 *   action="sell"  → contract settled (balance changes by payout amount)
 *
 * Profit = sell.amount - |buy.amount|
 *   Win:  profit > 0
 *   Loss: profit <= 0
 */
async function onTransaction(txn) {
  if (!txn || !txn.action) return;

  // Update balance from transaction
  if (txn.balance != null) {
    state.balance = parseFloat(txn.balance);
    updateUI();
  }

  // Count down subscriptions
  if (awaitingSubscriptions > 0) {
    awaitingSubscriptions--;
    if (awaitingSubscriptions === 0) markConnected();
  }

  // ===== BUY: Store purchase, do NOT count as win/loss =====
  if (txn.action === 'buy') {
    const buyAmount = Math.abs(Number(txn.amount)) || 0;
    openContracts[txn.contract_id] = {
      buyAmount,
      instrument: txn.display_name || 'Unknown',
      shortcode: txn.shortcode || '',
      purchaseTime: txn.transaction_time,
    };
    if (window.DEBUG) {
      console.log('[AI Coach] Purchase tracked:', txn.contract_id, buyAmount, txn.display_name);
    }
    return;
  }

  // ===== SELL: Calculate actual P&L =====
  if (txn.action === 'sell') {
    const sellAmount = Number(txn.amount) || 0;
    const purchase = openContracts[txn.contract_id];
    const buyAmount = purchase?.buyAmount || 0;

    // Clean up
    delete openContracts[txn.contract_id];

    // Calculate actual profit/loss
    let profit;
    if (purchase) {
      // Normal case: we have the buy, calculate net P&L
      profit = sellAmount - buyAmount;
    } else {
      // Edge case: missed the buy (connected mid-trade)
      // If there's a payout, assume it's a win; if 0 payout, assume total loss
      profit = sellAmount > 0 ? sellAmount * 0.5 : -1; // rough estimate
    }

    const instrument = purchase?.instrument || txn.display_name || 'Unknown';
    const absPnl = Math.abs(profit);

    if (window.DEBUG) {
      console.log('[AI Coach] Trade settled:', txn.contract_id, { sellAmount, buyAmount, profit, instrument });
    }

    if (profit > 0) {
      // ===== WIN =====
      state.wins++;
      state.streak = state.streak >= 0 ? state.streak + 1 : 1;

      addCoachMessage(`Win: +${formatBalance(profit)} ${state.currency} on ${instrument}`, 'win');

      // Request AI coaching
      addThinkingIndicator();
      const aiMsg = await getAICoachMessage({
        event_type: 'win',
        amount: profit,
        balance: state.balance,
        currency: state.currency,
        wins: state.wins,
        losses: state.losses,
        streak: state.streak,
        session_start_balance: state.sessionStartBalance,
        total_session_trades: state.wins + state.losses,
      });
      removeThinkingIndicator();

      if (aiMsg) {
        addCoachMessage(aiMsg, 'ai');
      } else {
        const fallback = state.streak > 1
          ? `That's ${state.streak} wins in a row! Stay disciplined — don't let confidence turn into overconfidence.`
          : 'Good trade. Review what worked so you can repeat it.';
        addCoachMessage(fallback, 'win');
      }

      syncToApi('win', { amount: profit, balance: state.balance, message: aiMsg || `Win +${absPnl.toFixed(2)}` });

    } else if (profit < 0) {
      // ===== LOSS =====
      state.losses++;
      state.streak = state.streak <= 0 ? state.streak - 1 : -1;

      const now = Date.now();
      const isRevengeTrading = state.lastLossTime && (now - state.lastLossTime) < REVENGE_TRADING_WINDOW_MS;
      state.lastLossTime = now;

      const sessionStart = parseFloat(state.sessionStartBalance) || 1;
      const lossPct = sessionStart > 0 ? absPnl / sessionStart : 0;

      addCoachMessage(`Loss: -${formatBalance(absPnl)} ${state.currency} on ${instrument}`, 'loss');

      // Request AI coaching
      addThinkingIndicator();
      const aiMsg = await getAICoachMessage({
        event_type: 'loss',
        amount: -absPnl,
        balance: state.balance,
        currency: state.currency,
        wins: state.wins,
        losses: state.losses,
        streak: state.streak,
        session_start_balance: state.sessionStartBalance,
        is_revenge_trading: isRevengeTrading,
        loss_percent: lossPct * 100,
        total_session_trades: state.wins + state.losses,
      });
      removeThinkingIndicator();

      if (aiMsg) {
        addCoachMessage(aiMsg, isRevengeTrading ? 'loss' : 'ai');
      } else {
        // Fallback rule-based messages
        if (isRevengeTrading) {
          addCoachMessage('Pattern detected: Trading shortly after a loss. Consider taking a short break.', 'loss');
        } else if (lossPct >= LOSS_ALERT_THRESHOLD) {
          addCoachMessage(`Down ${(lossPct * 100).toFixed(1)}% from session start. Take a break to reassess.`, 'loss');
        } else if (lossPct >= LOSS_WARNING_THRESHOLD) {
          addCoachMessage('Capital is dropping. Check your risk per trade and stay disciplined.', 'warning');
        } else {
          addCoachMessage('Small loss — part of the process. Stick to your plan.', 'warning');
        }
      }

      syncToApi('loss', { amount: -absPnl, balance: state.balance, message: aiMsg || `Loss -${absPnl.toFixed(2)}`, loss_percent: lossPct * 100 });

      if (isRevengeTrading) {
        syncToApi('pattern_alert', { message: aiMsg || 'Possible revenge trading detected.', pattern_type: 'revenge_trading_risk' });
      }

      if (lossPct >= LOSS_ALERT_THRESHOLD) {
        showStopOverlay();
      }

    } else {
      // Break even (profit === 0) — rare, just note it
      addCoachMessage(`Break even on ${instrument}. No loss, no gain.`, 'neutral');
    }

    updateUI();
  }
}

function startPing() {
  pingInterval = setInterval(() => {
    send({ ping: 1 });
  }, 30000);
}

function stopPing() {
  if (pingInterval) {
    clearInterval(pingInterval);
    pingInterval = null;
  }
}

function disconnect() {
  if (socket) {
    socket.close();
    socket = null;
  }
  stopPing();
  hideStopOverlay();
  showSetup();
  setStatus(false, 'Disconnected');
  placeholderMsg?.classList.remove('hidden');
}

document.getElementById('debug-toggle')?.addEventListener('click', () => {
  window.DEBUG = !window.DEBUG;
  console.log('[Deriv AI Coach] Debug logging', window.DEBUG ? 'ON' : 'OFF');
  alert('Debug ' + (window.DEBUG ? 'ON' : 'OFF') + '. Right-click panel → Inspect → Console to see WebSocket messages.');
});
