// Deriv's AI Coach - Enable side panel only on Deriv trading pages

const DERIV_ORIGINS = [
  'https://app.deriv.com',
  'https://staging-app.deriv.com',
  'https://app.deriv.app'
];

function isDerivPage(url) {
  if (!url) return false;
  try {
    const origin = new URL(url).origin;
    return DERIV_ORIGINS.some(o => origin === o || origin.endsWith('.deriv.com'));
  } catch {
    return false;
  }
}

// Enable/disable side panel based on tab URL
chrome.tabs.onUpdated.addListener(async (tabId, info, tab) => {
  if (!tab?.url) return;
  try {
    if (isDerivPage(tab.url)) {
      await chrome.sidePanel.setOptions({ tabId, path: 'sidepanel.html', enabled: true });
    } else {
      await chrome.sidePanel.setOptions({ tabId, enabled: false });
    }
  } catch (e) {
    // Tab may have been closed
  }
});

// Handle new tab activation (user switches tabs)
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    if (tab?.url && isDerivPage(tab.url)) {
      await chrome.sidePanel.setOptions({ tabId: activeInfo.tabId, path: 'sidepanel.html', enabled: true });
    } else {
      await chrome.sidePanel.setOptions({ tabId: activeInfo.tabId, enabled: false });
    }
  } catch (e) {}
});

// Open side panel when user clicks extension icon (on Deriv pages)
chrome.action.onClicked.addListener(async (tab) => {
  if (tab?.url && isDerivPage(tab.url)) {
    await chrome.sidePanel.open({ tabId: tab.id });
  }
});
