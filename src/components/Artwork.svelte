<script lang="ts">
  import type { Track } from '../lib/types';

  interface Props {
    track: Track;
    playing: boolean;
  }
  const { track, playing }: Props = $props();

  const fauxBgStyle = $derived.by(() => {
    const { palette } = track;
    return `background-image:` +
      ` radial-gradient(120% 80% at 30% 20%, rgb(${palette.accent.join(' ')} / .85), transparent 60%),` +
      ` radial-gradient(80% 100% at 80% 90%, rgb(${palette.bg.join(' ')}), rgb(${palette.bg2.join(' ')}));`;
  });

  // Use the real artwork URL when available; fall back to procedural faux-art.
  // The reflect (blurred under-glow) and the actual artwork both consume the URL.
  const artBgStyle = $derived(
    track.artworkUrl
      ? `background-image: url("${track.artworkUrl.replace(/"/g, '\\"')}");`
      : fauxBgStyle,
  );
  const reflectBgStyle = $derived(
    track.artworkUrl
      ? `background-image: url("${track.artworkUrl.replace(/"/g, '\\"')}");`
      : fauxBgStyle,
  );
</script>

<div class="art-stack">
  <div class="art-reflect" style={reflectBgStyle}></div>
  <div class="art" class:playing-pulse={playing} style={artBgStyle}>
    {#if !track.artworkUrl}
      <div class="faux-art" style={fauxBgStyle}>
        <div class="glyph">{track.glyph}</div>
      </div>
    {/if}
  </div>
  <div class="art-frame"></div>
</div>
