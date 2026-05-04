// Adapter that translates user actions into clicks on YTM's native player buttons.
// Selector chains include fallbacks because YTM rotates class names occasionally.

function clickByQueries(...queries: string[]): boolean {
  for (const q of queries) {
    const el = document.querySelector(q) as HTMLElement | null;
    if (el) {
      el.click();
      return true;
    }
  }
  return false;
}

export function clickPlayPause(): boolean {
  return clickByQueries(
    '#play-pause-button.ytmusic-player-bar',
    'tp-yt-paper-icon-button.play-pause-button',
    '.play-pause-button',
  );
}

export function clickNext(): boolean {
  return clickByQueries(
    '.next-button.ytmusic-player-bar',
    'tp-yt-paper-icon-button.next-button',
    '.next-button',
  );
}

export function clickPrevious(): boolean {
  return clickByQueries(
    '.previous-button.ytmusic-player-bar',
    'tp-yt-paper-icon-button.previous-button',
    '.previous-button',
  );
}

export function getVideo(): HTMLVideoElement | null {
  return document.querySelector('video.html5-main-video, video') as HTMLVideoElement | null;
}

export function clickShuffle(): boolean {
  return clickByQueries(
    'ytmusic-player-bar .shuffle',
    '.shuffle.ytmusic-player-bar',
    'ytmusic-player-bar [title*="셔플"]',
    'ytmusic-player-bar [title*="Shuffle" i]',
  );
}

export function clickRepeat(): boolean {
  return clickByQueries(
    'ytmusic-player-bar .repeat',
    '.repeat.ytmusic-player-bar',
    'ytmusic-player-bar [title*="반복"]',
    'ytmusic-player-bar [title*="Repeat" i]',
  );
}

export function clickLike(): boolean {
  // The like-button-renderer wraps an inner yt-button-shape — click the inner button.
  const likeRoot = document.querySelector('ytmusic-like-button-renderer');
  if (likeRoot) {
    const inner = likeRoot.querySelector<HTMLElement>(
      '#button-shape-like button, .like button, button[aria-label*="좋아요"], button[aria-label*="Like" i]',
    );
    if (inner) { inner.click(); return true; }
  }
  return clickByQueries(
    'ytmusic-player-bar button[aria-label*="좋아요"]',
    'ytmusic-player-bar button[aria-label*="Like" i]',
  );
}

/** YTM doesn't expose shuffle state via any DOM attribute (verified via live inspection —
 *  title/aria/class never change on click). We track it ourselves: every shuffle click
 *  flips a counter, so even-count = OFF, odd-count = ON. Initial state is read from
 *  ytmusic-app's internal queue if available; otherwise assume OFF.
 *  This is not perfectly accurate (e.g. user may toggle shuffle elsewhere), but
 *  it matches user-perceived behavior since the visual indicator follows their clicks. */
let shuffleClickCount = 0;
let shuffleInitialized = false;

function readShuffleFromAppQueue(): boolean | null {
  // ytmusic-app exposes its queue via a private property — best-effort, not part of any API.
  const app = document.querySelector('ytmusic-app') as unknown as { queue_?: { shuffleEnabled_?: boolean } } | null;
  const flag = app?.queue_?.shuffleEnabled_;
  return typeof flag === 'boolean' ? flag : null;
}

export function getShuffleState(): boolean {
  if (!shuffleInitialized) {
    const initial = readShuffleFromAppQueue();
    if (initial !== null) shuffleClickCount = initial ? 1 : 0;
    shuffleInitialized = true;
  }
  // Re-check internal state if available — keeps us in sync with shuffle toggled outside Applify.
  const live = readShuffleFromAppQueue();
  if (live !== null) return live;
  return (shuffleClickCount & 1) === 1;
}

export function noteShuffleClicked() {
  shuffleClickCount++;
  shuffleInitialized = true;
}

/** Read repeat state. YTM's title/label/aria-label all reflect the *current* mode directly,
 *  in the user's language. Live inspection confirmed:
 *    "반복 사용 안함" / "Repeat off"     → NONE
 *    "모두 반복"     / "Repeat all"     → ALL
 *    "1개 반복"      / "Repeat one"     → ONE
 *  Earlier "next action" interpretation was WRONG — fixed here. */
export function getRepeatMode(): 'NONE' | 'ALL' | 'ONE' {
  const el = document.querySelector('ytmusic-player-bar .repeat, .repeat.ytmusic-player-bar');
  if (!el) return 'NONE';
  const inner = el.querySelector('button');
  const text = (
    inner?.getAttribute('aria-label') ||
    el.getAttribute('title') ||
    el.getAttribute('label') ||
    inner?.getAttribute('title') ||
    ''
  );
  if (/사용\s*안\s*함|off|no\s*repeat/i.test(text)) return 'NONE';
  if (/1\s*개|한\s*곡|one|single/i.test(text)) return 'ONE';
  if (/모두|전체|all/i.test(text)) return 'ALL';
  return 'NONE';
}

export function getLikeState(): 'LIKE' | 'DISLIKE' | 'INDIFFERENT' {
  const el = document.querySelector('ytmusic-like-button-renderer');
  const status = el?.getAttribute('like-status');
  if (status === 'LIKE' || status === 'DISLIKE' || status === 'INDIFFERENT') return status;
  return 'INDIFFERENT';
}
