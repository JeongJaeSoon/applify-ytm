<script lang="ts">
  import Stage from './Stage.svelte';
  import NowPlaying from './NowPlaying.svelte';
  import MiniPlayer from './MiniPlayer.svelte';
  import QueueStrip from './QueueStrip.svelte';
  import Toast from './Toast.svelte';
  import { playerState, flashToast } from '../lib/stores.svelte';
  import { SAMPLE_TRACKS } from '../dev/sample-tracks';
  import type { Track } from '../lib/types';

  interface PlayerActions {
    togglePlay: () => void;
    prev: () => void;
    next: () => void;
    seek: (s: number) => void;
    setVolume: (v: number) => void;
    toggleShuffle: () => void;
    toggleRepeat: () => void;
    toggleLike: () => void;
  }

  interface Props {
    /** When true, run a local demo loop with sample tracks. Used by preview harness. */
    demoMode?: boolean;
    /** When provided, route playback actions through this adapter (e.g. YTM bridge). */
    actions?: PlayerActions;
    /** Called when the user clicks the Applify on/off pill. */
    onToggleApplify?: () => void;
  }
  const { demoMode = false, actions, onToggleApplify }: Props = $props();

  // Phase 1: drive sample tracks locally. Phase 2 will overwrite playerState.track from sync.ts.
  let trackIdx = $state(0);

  $effect(() => {
    if (!demoMode) return;
    playerState.track = SAMPLE_TRACKS[trackIdx];
  });

  // Local playback ticker for demo mode.
  $effect(() => {
    if (!demoMode || !playerState.playing || !playerState.track) return;
    let last = performance.now();
    let raf = 0;
    const loop = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      const t = playerState.track;
      if (!t) return;
      const next = playerState.position + dt;
      if (next >= t.duration) {
        trackIdx = (trackIdx + 1) % SAMPLE_TRACKS.length;
        playerState.position = 0;
      } else {
        playerState.position = next;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  });

  // Reset position on track change in demo mode.
  let prevTrackId = $state<string | null>(null);
  $effect(() => {
    if (!playerState.track) return;
    if (prevTrackId !== null && prevTrackId !== playerState.track.id) {
      playerState.position = 0;
    }
    prevTrackId = playerState.track.id;
  });

  // Apply current track's palette to CSS custom properties on the host element.
  // The shadow-host element receives the variables so :host selector picks them up.
  $effect(() => {
    const t = playerState.track;
    if (!t) return;
    const host = document.querySelector('applify-shadow-host') as HTMLElement | null;
    const target = host ?? document.documentElement;
    target.style.setProperty('--bg-r',     String(t.palette.bg[0]));
    target.style.setProperty('--bg-g',     String(t.palette.bg[1]));
    target.style.setProperty('--bg-b',     String(t.palette.bg[2]));
    target.style.setProperty('--bg-r2',    String(t.palette.bg2[0]));
    target.style.setProperty('--bg-g2',    String(t.palette.bg2[1]));
    target.style.setProperty('--bg-b2',    String(t.palette.bg2[2]));
    target.style.setProperty('--accent-r', String(t.palette.accent[0]));
    target.style.setProperty('--accent-g', String(t.palette.accent[1]));
    target.style.setProperty('--accent-b', String(t.palette.accent[2]));
  });

  // Action handlers — when `actions` is provided (YTM mode), delegate to the adapter.
  // Otherwise (demo mode), mutate local state directly.
  function onPlay() {
    if (actions) actions.togglePlay();
    else playerState.playing = !playerState.playing;
  }
  function onPrev() {
    if (actions) { actions.prev(); return; }
    if (!demoMode) return;
    if (playerState.position > 3) playerState.position = 0;
    else trackIdx = (trackIdx - 1 + SAMPLE_TRACKS.length) % SAMPLE_TRACKS.length;
  }
  function onNext() {
    if (actions) { actions.next(); return; }
    if (!demoMode) return;
    trackIdx = (trackIdx + 1) % SAMPLE_TRACKS.length;
  }
  function onSeek(s: number) {
    const t = playerState.track;
    if (!t) return;
    if (actions) { actions.seek(s); return; }
    playerState.position = Math.max(0, Math.min(t.duration, s));
  }
  function onVolume(v: number) {
    if (actions) { actions.setVolume(v); return; }
    playerState.volume = v;
  }
  function onLike() {
    if (actions) { actions.toggleLike(); return; }
    playerState.liked = !playerState.liked;
  }
  function onShuffle() {
    if (actions) { actions.toggleShuffle(); return; }
    playerState.shuffle = !playerState.shuffle;
  }
  function onRepeat() {
    if (actions) { actions.toggleRepeat(); return; }
    playerState.repeat = !playerState.repeat;
  }
  function onLyricsToggle() { playerState.showLyrics = !playerState.showLyrics; }
  function onQueue() { flashToast('Queue'); }
  function onAirplay() { flashToast('Cast'); }

  const nextTrack = $derived.by<Track | null>(() => {
    if (!demoMode) return null;
    return SAMPLE_TRACKS[(trackIdx + 1) % SAMPLE_TRACKS.length];
  });
</script>

<button
  class="applify-toggle"
  data-on={playerState.applifyOn ? 1 : 0}
  onclick={() => {
    if (onToggleApplify) onToggleApplify();
    else playerState.applifyOn = !playerState.applifyOn;
  }}
  aria-label="Toggle Applify overlay"
>
  <span class="sw"></span>
  <span>Applify</span>
</button>

{#if !playerState.track}
  <div class="applify-content" class:is-off={!playerState.applifyOn}>
    <div class="bg-canvas"></div>
    <div class="bg-grain"></div>
    <div class="bg-vignette"></div>
    <div class="loading-state">
      <div class="loading-pulse"></div>
      <div class="loading-text">Press play on YouTube Music</div>
      <div class="loading-hint">Applify will take over once a track is playing</div>
    </div>
  </div>
{:else}
  <div class="applify-content" class:is-off={!playerState.applifyOn}>
  <Stage>
    <NowPlaying
      track={playerState.track}
      playing={playerState.playing}
      position={playerState.position}
      volume={playerState.volume}
      liked={playerState.liked}
      shuffle={playerState.shuffle}
      repeat={playerState.repeat}
      repeatMode={playerState.repeatMode}
      showLyrics={playerState.showLyrics}
      {onPlay}
      {onPrev}
      {onNext}
      {onShuffle}
      {onRepeat}
      {onSeek}
      {onVolume}
      {onLike}
      {onLyricsToggle}
      {onQueue}
      {onAirplay}
    />

    <MiniPlayer
      track={playerState.track}
      playing={playerState.playing}
      position={playerState.position}
      hidden={playerState.miniHidden}
      onPlay={(e) => { e?.stopPropagation?.(); onPlay(); }}
      onNext={(e) => { e?.stopPropagation?.(); onNext(); }}
      onClick={() => flashToast('Now Playing')}
    />

    {#if nextTrack}
      <QueueStrip nextTitle={nextTrack.title} nextArtist={nextTrack.artist} />
    {/if}

    <Toast message={playerState.toast} />
  </Stage>
  </div>
{/if}
