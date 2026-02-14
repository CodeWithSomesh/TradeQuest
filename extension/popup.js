// Deriv's AI Coach - Extension popup logic
// Uses localhost:3000 when running DerivHub locally

const LOCAL_BASE = 'http://localhost:3000';

document.getElementById('open-dashboard').addEventListener('click', (e) => {
  e.preventDefault();
  chrome.tabs.create({ url: `${LOCAL_BASE}/dashboard` });
});

document.getElementById('open-coach').addEventListener('click', (e) => {
  e.preventDefault();
  chrome.tabs.create({ url: `${LOCAL_BASE}/dashboard/coach` });
});

document.getElementById('open-learn').addEventListener('click', (e) => {
  e.preventDefault();
  chrome.tabs.create({ url: `${LOCAL_BASE}/dashboard/learn` });
});
