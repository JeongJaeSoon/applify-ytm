// Svelte 5 runes-based "stores" — module-scoped reactive state shared across components.
// Each call site that imports `playerState` reads the same reactive instance.

import type { Track } from './types';
import { NEUTRAL_PALETTE } from './types';

export const playerState = $state({
  // The currently displayed track. Phase 1 uses sample data; Phase 2+ writes here from YTM sync.
  track: null as Track | null,

  // Playback
  playing: false,
  position: 0,        // seconds
  volume: 0.7,

  // UI toggles
  liked: false,
  shuffle: false,
  // `repeat` is the boolean for "any repeat active" — used by Transport.svelte's data-on attr.
  // `repeatMode` carries the precise tri-state (NONE/ALL/ONE) so the icon can render distinctly.
  repeat: false,
  repeatMode: 'NONE' as 'NONE' | 'ALL' | 'ONE',
  showLyrics: true,
  miniHidden: false,
  applifyOn: true,

  // Toast
  toast: null as string | null,
});

export const palette = $state({
  current: NEUTRAL_PALETTE,
});

export function flashToast(msg: string, durationMs = 1600) {
  playerState.toast = msg;
  setTimeout(() => {
    if (playerState.toast === msg) playerState.toast = null;
  }, durationMs);
}
