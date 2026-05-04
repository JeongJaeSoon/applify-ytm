<script lang="ts">
  import Icon from './icons/Icon.svelte';
  import type { Track } from '../lib/types';

  interface Props {
    track: Track;
    playing: boolean;
    position: number;
    hidden: boolean;
    onPlay: (e: MouseEvent) => void;
    onNext: (e: MouseEvent) => void;
    onClick: () => void;
  }
  const { track, playing, position, hidden, onPlay, onNext, onClick }: Props = $props();

  const pct = $derived(Math.min(100, (position / Math.max(1, track.duration)) * 100));

  const fauxArtStyle = $derived.by(() => {
    const { palette } = track;
    return `background:` +
      ` radial-gradient(120% 80% at 30% 20%, rgb(${palette.accent.join(' ')} / .85), transparent 60%),` +
      ` radial-gradient(80% 100% at 80% 90%, rgb(${palette.bg.join(' ')}), rgb(${palette.bg2.join(' ')}));`;
  });
  const artStyle = $derived(
    track.artworkUrl
      ? `background-image: url("${track.artworkUrl.replace(/"/g, '\\"')}"); background-size: cover; background-position: center;`
      : fauxArtStyle,
  );

  function handleControlsClick(e: MouseEvent) { e.stopPropagation(); }
</script>

<div class="mini glass" class:hidden onclick={onClick}
     role="button" tabindex="0"
     onkeydown={(e) => { if (e.key === 'Enter') onClick(); }}>
  <div class="mini-art" style={artStyle}>
    {#if !track.artworkUrl}
      <div class="glyph">{track.glyph}</div>
    {/if}
  </div>
  <div class="mini-info">
    <div class="mini-title">{track.title}</div>
    <div class="mini-artist">{track.artist}</div>
  </div>
  <div class="mini-controls" onclick={handleControlsClick}
       onkeydown={(e) => { if (e.key === 'Enter') e.stopPropagation(); }}
       role="toolbar" tabindex="-1">
    <button class="ibtn" onclick={onPlay} aria-label={playing ? 'Pause' : 'Play'}>
      <Icon name={playing ? 'pause' : 'play'} size={14} />
    </button>
    <button class="ibtn" onclick={onNext} aria-label="Next">
      <Icon name="next" size={14} />
    </button>
  </div>
  <div class="mini-progress"><div class="mini-progress-fill" style="width: {pct}%"></div></div>
</div>
