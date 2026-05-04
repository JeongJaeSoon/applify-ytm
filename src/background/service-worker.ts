// Background service worker — toolbar action toggles the Applify on/off state in chrome.storage.local.
// Phase 2 will also handle artwork CORS-bypass fetches here.

const STORAGE_KEY = 'applifyOn';

chrome.action.onClicked.addListener(async () => {
  const { [STORAGE_KEY]: current = true } = await chrome.storage.local.get(STORAGE_KEY);
  await chrome.storage.local.set({ [STORAGE_KEY]: !current });
});

chrome.runtime.onInstalled.addListener(async () => {
  const { [STORAGE_KEY]: existing } = await chrome.storage.local.get(STORAGE_KEY);
  if (existing === undefined) {
    await chrome.storage.local.set({ [STORAGE_KEY]: true });
  }
});
