// Applify content script entry. Mounts a custom-element host with attached Shadow DOM,
// injects compiled CSS, starts the YTM sync engine, and renders the Svelte App inside.

import { mount } from 'svelte';
import App from '../components/App.svelte';
import css from '../styles/app.css?inline';
import { startSync, ytmActions, isAdShowing } from './sync';
import { flashToast, playerState } from '../lib/stores.svelte';

const HOST_TAG = 'applify-shadow-host';
const STORAGE_KEY = 'applifyOn';

/** True when the extension's MV3 runtime is still alive. After the user reloads/updates
 *  the extension, the previously-injected content script keeps running but loses access
 *  to chrome.runtime — calls then throw "Extension context invalidated". */
function isExtensionAlive(): boolean {
  try { return !!chrome?.runtime?.id; } catch { return false; }
}

function ensureHost(): HTMLElement {
  let host = document.querySelector(HOST_TAG) as HTMLElement | null;
  if (host) return host;
  host = document.createElement(HOST_TAG);
  document.documentElement.appendChild(host);
  return host;
}

async function bootstrap() {
  if (document.querySelector(HOST_TAG)) return;

  const host = ensureHost();
  const shadow = host.attachShadow({ mode: 'open' });

  // Inject compiled CSS into the shadow root for full isolation from YTM.
  const style = document.createElement('style');
  style.textContent = css;
  shadow.appendChild(style);

  // Mount-point inside shadow.
  const mountPoint = document.createElement('div');
  mountPoint.id = 'applify-root';
  shadow.appendChild(mountPoint);

  // Read on/off state from chrome.storage; default ON.
  let stored: Record<string, unknown> = {};
  if (isExtensionAlive()) {
    stored = await chrome.storage.local.get(STORAGE_KEY).catch(() => ({} as Record<string, unknown>));
  }
  playerState.applifyOn = stored[STORAGE_KEY] !== false;

  // React to background-driven (toolbar action) toggles. Wrapped in alive-check so a
  // stale content script (lingering after extension reload) doesn't crash on dispatch.
  if (isExtensionAlive()) {
    try {
      chrome.storage.onChanged.addListener((changes, area) => {
        if (!isExtensionAlive() || area !== 'local') return;
        const change = changes[STORAGE_KEY];
        if (change) playerState.applifyOn = change.newValue !== false;
      });
    } catch { /* extension context died between checks — ignore */ }
  }

  // The pill click goes through storage when the extension is alive; if storage is
  // unreachable (post-reload zombie state), fall back to local-only toggling so the
  // UI still responds. The user can fully recover by refreshing the YTM tab.
  const onToggleApplify = () => {
    if (!isExtensionAlive()) {
      playerState.applifyOn = !playerState.applifyOn;
      return;
    }
    try {
      void chrome.storage.local.set({ [STORAGE_KEY]: !playerState.applifyOn })
        .catch(() => { playerState.applifyOn = !playerState.applifyOn; });
    } catch {
      playerState.applifyOn = !playerState.applifyOn;
    }
  };

  // Start the bidirectional YTM ⇄ store bridge.
  startSync();

  // Ad detection — show a toast when a YTM ad is playing.
  let lastAd = false;
  setInterval(() => {
    const ad = isAdShowing();
    if (ad && !lastAd) flashToast('Ad playing');
    lastAd = ad;
  }, 1000);

  // Expose for verification scripts (read-only).
  Object.defineProperty(window, '__applify', { value: { playerState }, configurable: true });

  mount(App, {
    target: mountPoint,
    props: {
      demoMode: false,
      actions: ytmActions,
      onToggleApplify,
    },
  });

  console.log('[Applify] mounted');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap, { once: true });
} else {
  bootstrap();
}
