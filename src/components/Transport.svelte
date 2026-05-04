<script lang="ts">
  import Icon from './icons/Icon.svelte';

  interface Props {
    playing: boolean;
    shuffle: boolean;
    repeat: boolean;
    repeatMode?: 'NONE' | 'ALL' | 'ONE';
    onPlay: () => void;
    onPrev: () => void;
    onNext: () => void;
    onShuffle: () => void;
    onRepeat: () => void;
  }
  const { playing, shuffle, repeat, repeatMode = 'NONE', onPlay, onPrev, onNext, onShuffle, onRepeat }: Props = $props();
  // Distinct visual for "Repeat one": small "1" badge sits on top-right of the repeat icon.
  const repeatLabel = $derived(
    repeatMode === 'ONE' ? 'Repeat one' :
    repeatMode === 'ALL' ? 'Repeat all' : 'Repeat off',
  );
</script>

<div class="transport">
  <button class="tbtn small shuffle-btn" data-on={shuffle ? 1 : 0} onclick={onShuffle}
          aria-label={shuffle ? 'Shuffle on' : 'Shuffle off'} aria-pressed={shuffle}>
    <Icon name="shuffle" />
    {#if shuffle}<span class="repeat-active-dot" aria-hidden="true"></span>{/if}
  </button>
  <button class="tbtn" onclick={onPrev} aria-label="Previous"><Icon name="prev" /></button>
  <button class="tbtn play" onclick={onPlay} aria-label={playing ? 'Pause' : 'Play'}>
    <Icon name={playing ? 'pause' : 'play'} />
  </button>
  <button class="tbtn" onclick={onNext} aria-label="Next"><Icon name="next" /></button>
  <button class="tbtn small repeat-btn"
          data-on={repeat ? 1 : 0}
          data-mode={repeatMode}
          onclick={onRepeat}
          aria-label={repeatLabel}>
    <Icon name="repeat" />
    {#if repeatMode === 'ALL'}<span class="repeat-active-dot" aria-hidden="true"></span>{/if}
    {#if repeatMode === 'ONE'}<span class="repeat-one-badge">1</span>{/if}
  </button>
</div>
