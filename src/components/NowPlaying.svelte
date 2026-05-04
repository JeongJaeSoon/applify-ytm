<script lang="ts">
  import Artwork from './Artwork.svelte';
  import Meta from './Meta.svelte';
  import Progress from './Progress.svelte';
  import Transport from './Transport.svelte';
  import ExtrasBar from './ExtrasBar.svelte';
  import Lyrics from './Lyrics.svelte';
  import type { Track } from '../lib/types';

  interface Props {
    track: Track;
    playing: boolean;
    position: number;
    volume: number;
    liked: boolean;
    shuffle: boolean;
    repeat: boolean;
    repeatMode?: 'NONE' | 'ALL' | 'ONE';
    showLyrics: boolean;
    onPlay: () => void;
    onPrev: () => void;
    onNext: () => void;
    onShuffle: () => void;
    onRepeat: () => void;
    onSeek: (s: number) => void;
    onVolume: (v: number) => void;
    onLike: () => void;
    onLyricsToggle: () => void;
    onQueue: () => void;
    onAirplay: () => void;
  }
  const p: Props = $props();

  let npEl: HTMLDivElement | undefined = $state();
  let leftEl: HTMLDivElement | undefined = $state();
  let artEl: HTMLDivElement | undefined = $state();
  let extrasEl: HTMLDivElement | undefined = $state();

  // Match the right column's lyrics-wrap height to the left column's cluster
  // (art top → extras bottom). The grid row height is fixed by the viewport, so
  // both columns are visually centered — but they only land on the same Y range
  // if they share the same content height. This effect publishes the cluster
  // height as a CSS var that lyrics-wrap consumes for its max-height.
  $effect(() => {
    if (!npEl || !leftEl || !artEl || !extrasEl) return;
    const update = () => {
      if (!artEl || !extrasEl || !npEl) return;
      const a = artEl.getBoundingClientRect();
      const e = extrasEl.getBoundingClientRect();
      const h = Math.max(0, Math.round(e.bottom - a.top));
      if (h > 0) npEl.style.setProperty('--applify-cluster-h', h + 'px');
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(leftEl);
    if (artEl) ro.observe(artEl);
    if (extrasEl) ro.observe(extrasEl);
    window.addEventListener('resize', update);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', update);
    };
  });
</script>

<div class="np" bind:this={npEl} data-lyrics-off={p.showLyrics ? '0' : '1'}>
  <!-- Left column: artwork → meta → controls.
       Wider gap below artwork (44px) compensates for its drop shadow,
       which visually invades the gap below it. -->
  <div class="np-left" bind:this={leftEl} style="display:flex; flex-direction:column; align-items:center; justify-content:center;
              width:100%; max-width:520px; max-height:100%; margin:0 auto;">
    <div bind:this={artEl} style="width:100%; display:flex; justify-content:center; margin-bottom:44px;">
      <Artwork track={p.track} playing={p.playing} />
    </div>

    <Meta track={p.track} />

    <div class="np-controls" bind:this={extrasEl} style="width:100%; display:flex; flex-direction:column; align-items:center;">
      <Progress position={p.position} duration={p.track.duration} onSeek={p.onSeek} />
      <Transport
        playing={p.playing}
        shuffle={p.shuffle}
        repeat={p.repeat}
        repeatMode={p.repeatMode}
        onPlay={p.onPlay}
        onPrev={p.onPrev}
        onNext={p.onNext}
        onShuffle={p.onShuffle}
        onRepeat={p.onRepeat}
      />
      <ExtrasBar
        volume={p.volume}
        liked={p.liked}
        onVolume={p.onVolume}
        onLike={p.onLike}
        onLyricsToggle={p.onLyricsToggle}
        onQueue={p.onQueue}
        onAirplay={p.onAirplay}
      />
    </div>
  </div>

  <!-- Right column: lyrics — animates width/opacity/translate so artwork glides to center. -->
  <div class="np-right" style="width:100%; display:flex; justify-content:center; align-items:center;
              transition: all .55s cubic-bezier(.4,0,.2,1);
              opacity: {p.showLyrics ? 1 : 0};
              transform: translateX({p.showLyrics ? 0 : 40}px);
              pointer-events: {p.showLyrics ? 'auto' : 'none'};">
    <Lyrics
      lines={p.track.lyrics}
      currentMs={p.position * 1000}
      synced={p.track.lyricsSynced ?? false}
      onSeek={p.onSeek}
    />
  </div>
</div>
