<script lang="ts">
  import type { Track } from '../lib/types';
  interface Props { track: Track; }
  const { track }: Props = $props();
</script>

<div class="meta" style="margin-bottom: 32px;">
  {#if track.album || track.year}
    <div class="meta-eyebrow">
      {#if track.album}<span>{track.album}</span>{/if}
      {#if track.album && track.year}<span class="sep">·</span>{/if}
      {#if track.year}<span>{track.year}</span>{/if}
    </div>
  {/if}
  <h1>{track.title}</h1>
  <div class="artist">{track.artist}</div>
</div>
