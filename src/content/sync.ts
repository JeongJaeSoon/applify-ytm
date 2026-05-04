// State Sync Engine — bidirectional bridge between YTM's <video> + player bar DOM
// and our reactive playerState store.

import { playerState, palette } from '../lib/stores.svelte';
import { extractPalette } from './palette';
import {
  clickNext, clickPlayPause, clickPrevious, getVideo,
  clickShuffle, clickRepeat, clickLike,
  getShuffleState, getRepeatMode, getLikeState, noteShuffleClicked,
} from './ytm-controls';
import { scrapeMetadata } from './metadata';
import { scrapeLyricsFromYTM, scrapeLyricsFromLrclib, type ScrapeContext } from './lyrics-scraper';
import type { Track } from '../lib/types';
import { NEUTRAL_PALETTE } from '../lib/types';

let video: HTMLVideoElement | null = null;
let playerBarObserver: MutationObserver | null = null;
let descShelfObserver: MutationObserver | null = null;
let lastTrackId: string | null = null;
let lastArtworkUrl: string | null = null;
let lyricsRetryTimer: number | null = null;
// Monotonic counter — each track change bumps it; in-flight fetches compare against
// the value captured at dispatch and discard their result if it has advanced.
let trackEpoch = 0;
// rAF handle for high-precision position updates while playing.
let positionRaf = 0;

export interface PlayerActions {
  togglePlay: () => void;
  prev: () => void;
  next: () => void;
  seek: (s: number) => void;
  setVolume: (v: number) => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  toggleLike: () => void;
}

export const ytmActions: PlayerActions = {
  togglePlay: () => {
    if (!video) { clickPlayPause(); return; }
    if (video.paused) void video.play();
    else video.pause();
  },
  prev: () => clickPrevious(),
  next: () => clickNext(),
  seek: (s: number) => { if (video) video.currentTime = s; },
  setVolume: (v: number) => { if (video) video.volume = v; },
  toggleShuffle: () => { noteShuffleClicked(); clickShuffle(); setTimeout(syncToggleStates, 80); },
  toggleRepeat: () => { clickRepeat(); setTimeout(syncToggleStates, 80); },
  toggleLike:    () => { clickLike();    setTimeout(syncToggleStates, 80); },
};

function syncToggleStates() {
  playerState.shuffle = getShuffleState();
  const mode = getRepeatMode();
  playerState.repeatMode = mode;
  playerState.repeat = mode !== 'NONE';
  playerState.liked = getLikeState() === 'LIKE';
}

export function startSync() {
  observeForVideo();
  observePlayerBar();
  observeDescShelf();
  // Re-bind on SPA route changes — YTM uses pushState heavily.
  window.addEventListener('yt-navigate-finish', () => {
    setTimeout(() => {
      reattachVideo();
      observePlayerBar();
      observeDescShelf();
    }, 250);
  });
}

function observeForVideo() {
  if (reattachVideo()) return;
  const observer = new MutationObserver(() => {
    if (reattachVideo()) observer.disconnect();
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

function reattachVideo(): boolean {
  const v = getVideo();
  if (!v) return false;
  if (video === v) return true;
  video = v;
  v.addEventListener('timeupdate', onTimeUpdate);
  v.addEventListener('play', onPlay);
  v.addEventListener('pause', onPause);
  v.addEventListener('volumechange', onVolume);
  v.addEventListener('durationchange', onDurationChange);
  // Sync initial state.
  playerState.position = v.currentTime || 0;
  playerState.playing = !v.paused;
  playerState.volume = v.volume;
  if (!v.paused) startPositionRaf();
  return true;
}

function onTimeUpdate() { if (video) playerState.position = video.currentTime; }
function onPlay() { playerState.playing = true; startPositionRaf(); }
function onPause() { playerState.playing = false; stopPositionRaf(); }

/** rAF-based high-precision position ticker. The native `timeupdate` event only fires
 *  every ~250ms, which is too coarse for synced-lyrics line activation. We supplement
 *  it with a 60fps poll of `video.currentTime` while playing. */
function startPositionRaf() {
  if (positionRaf || !video) return;
  const tick = () => {
    if (!video || video.paused) { positionRaf = 0; return; }
    playerState.position = video.currentTime;
    positionRaf = requestAnimationFrame(tick);
  };
  positionRaf = requestAnimationFrame(tick);
}
function stopPositionRaf() {
  if (positionRaf) { cancelAnimationFrame(positionRaf); positionRaf = 0; }
}
function onVolume() { if (video) playerState.volume = video.volume; }
function onDurationChange() {
  if (video && playerState.track && isFinite(video.duration)) {
    playerState.track = { ...playerState.track, duration: video.duration };
  }
}

function observePlayerBar() {
  const bar = document.querySelector('ytmusic-player-bar');
  if (!bar) {
    setTimeout(observePlayerBar, 500);
    return;
  }
  playerBarObserver?.disconnect();
  void updateTrackFromDom();
  syncToggleStates();
  playerBarObserver = new MutationObserver(() => {
    void updateTrackFromDom();
    syncToggleStates();
  });
  // Observe attribute changes too — shuffle/repeat/like change via attribute, not children.
  playerBarObserver.observe(bar, {
    childList: true, subtree: true, characterData: true,
    attributes: true, attributeFilter: ['title', 'label', 'aria-pressed', 'class', 'like-status'],
  });
}

async function updateTrackFromDom() {
  const meta = scrapeMetadata();
  if (!meta) return;
  if (meta.id === lastTrackId) {
    // Same track — just refresh duration if it's now known.
    if (playerState.track && meta.duration && playerState.track.duration !== meta.duration) {
      playerState.track = { ...playerState.track, duration: meta.duration };
    }
    return;
  }
  lastTrackId = meta.id;
  const epoch = ++trackEpoch;

  // 1. Update track *immediately* with empty lyrics so the UI clears any stale
  //    lines from the previous track instantly.
  const next: Track = {
    id: meta.id,
    title: meta.title,
    artist: meta.artist,
    album: meta.album,
    year: meta.year,
    duration: meta.duration || 1,
    artworkUrl: meta.artworkUrl,
    glyph: meta.glyph,
    palette: NEUTRAL_PALETTE,
    lyrics: [{ t: 0, instrumental: true }],
    lyricsSynced: false,
  };
  playerState.track = next;
  // Reset position so the auto-scroll doesn't briefly target a line from the old track.
  playerState.position = 0;

  // 2. Background — fetch palette. If artwork URL isn't ready yet (e.g. page just
  //    refreshed with collapsed player), poll metadata briefly until it appears.
  void resolveArtworkAndPalette(epoch, meta.artworkUrl);

  // 3. Two-tier lyrics flow:
  //    Tier 1 (YTM scrape) — fast placeholder, untimed → tracking off.
  //    Tier 2 (lrclib)     — synced lyrics in parallel → upgrade to tracking on.
  //    Once lyricsSynced=true, no later result is allowed to downgrade.
  const ctx: ScrapeContext = {
    artist: meta.artist, title: meta.title, album: meta.album, duration: meta.duration,
  };
  startLyricsResolution(epoch, ctx);
}

function startLyricsResolution(epoch: number, ctx: ScrapeContext) {
  // Tier 1 — YTM scrape lands fast as a placeholder.
  void scrapeLyricsFromYTM().then((res) => {
    if (epoch !== trackEpoch || !res) return;
    const cur = playerState.track;
    if (!cur || cur.id !== lastTrackId) return;
    if (cur.lyricsSynced) return; // Tier 2 already won — never downgrade.
    playerState.track = { ...cur, lyrics: res.lines, lyricsSynced: false };
  });

  // Tier 2 — lrclib retries. First call fires immediately, then every 700ms up to 10×.
  if (lyricsRetryTimer != null) clearInterval(lyricsRetryTimer);
  let attempts = 0;
  const tryLrclib = async () => {
    if (epoch !== trackEpoch) { stopRetry(); return; }
    if (playerState.track?.lyricsSynced) { stopRetry(); return; }
    if (attempts > 10) { stopRetry(); return; }
    attempts++;
    const v = getVideo();
    const liveDur = v?.duration && isFinite(v.duration) ? v.duration : ctx.duration;
    const res = await scrapeLyricsFromLrclib({ ...ctx, duration: liveDur });
    if (epoch !== trackEpoch) return;
    const cur = playerState.track;
    if (!cur || cur.id !== lastTrackId || !res) return;
    if (res.synced) {
      // Real upgrade — commit and stop retrying.
      playerState.track = { ...cur, lyrics: res.lines, lyricsSynced: true };
      stopRetry();
    } else if (!cur.lyricsSynced && cur.lyrics.length <= 1) {
      // YTM scrape was empty too — show plain lrclib as a tier-1.5 placeholder.
      playerState.track = { ...cur, lyrics: res.lines, lyricsSynced: false };
    }
  };
  void tryLrclib();
  lyricsRetryTimer = window.setInterval(() => void tryLrclib(), 700);
}

function stopRetry() {
  if (lyricsRetryTimer != null) { clearInterval(lyricsRetryTimer); lyricsRetryTimer = null; }
}

/** Poll metadata until we have a usable artwork URL, then extract the palette.
 *  Solves the "page reloaded with collapsed player + img.src empty" race. */
async function resolveArtworkAndPalette(epoch: number, initial: string | undefined): Promise<void> {
  let url = initial;
  for (let i = 0; i < 12 && !url; i++) {
    await sleep(150);
    if (epoch !== trackEpoch) return;
    url = scrapeMetadata()?.artworkUrl;
  }
  if (!url || epoch !== trackEpoch) return;
  if (url === lastArtworkUrl) return;
  lastArtworkUrl = url;
  // Patch the track immediately with the URL so Artwork.svelte can render it
  // even before the palette finishes computing.
  if (playerState.track && playerState.track.id === lastTrackId && !playerState.track.artworkUrl) {
    playerState.track = { ...playerState.track, artworkUrl: url };
  }
  const pal = await extractPalette(url);
  if (epoch !== trackEpoch) return;
  palette.current = pal;
  if (playerState.track && playerState.track.id === lastTrackId) {
    playerState.track = { ...playerState.track, palette: pal, artworkUrl: url };
  }
}

function sleep(ms: number) { return new Promise<void>((r) => setTimeout(r, ms)); }

/** Watch for the description shelf populating dynamically (YTM lazy-loads it). */
function observeDescShelf() {
  descShelfObserver?.disconnect();
  descShelfObserver = new MutationObserver(async () => {
    const cur = playerState.track;
    if (!cur || cur.lyricsSynced) return; // already synced — do not downgrade
    const epoch = trackEpoch;
    const res = await scrapeLyricsFromYTM();
    if (epoch !== trackEpoch || !res) return;
    const now = playerState.track;
    if (!now || now.id !== lastTrackId || now.lyricsSynced) return;
    playerState.track = { ...now, lyrics: res.lines, lyricsSynced: false };
  });
  // Narrow scope to player-page; body-wide subtree fires hundreds of times/sec on YTM.
  const target = document.querySelector('ytmusic-player-page') || document.body;
  descShelfObserver.observe(target, { childList: true, subtree: true, characterData: true });
}

export function isAdShowing(): boolean {
  return document.body.classList.contains('ad-showing') ||
         !!document.querySelector('ytmusic-player-bar [aria-label="Ad"]');
}
