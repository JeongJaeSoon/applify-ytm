<script lang="ts">
  import { fmtTime } from '../lib/format';
  import type { LyricLine } from '../lib/types';

  interface Props {
    lines: LyricLine[];
    currentMs: number;
    onSeek: (s: number) => void;
    /** When false, the lines have no real per-line timestamps — disable active-line
     *  tracking and auto-scroll because they would lie about timing. */
    synced?: boolean;
  }
  const { lines, currentMs, onSeek, synced = true }: Props = $props();

  let containerEl: HTMLDivElement | undefined = $state();
  let innerEl: HTMLDivElement | undefined = $state();

  // Lookahead 200ms — lrclib data lags by 0.3–1.5s and the eye needs lead time to read.
  const LOOKAHEAD_MS = 200;
  const activeIdx = $derived.by(() => {
    if (!lines.length) return -1;
    if (!synced) return -1;       // tracking disabled → no active line
    const target = currentMs + LOOKAHEAD_MS;
    let lo = 0, hi = lines.length - 1, best = -1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (lines[mid].t <= target) { best = mid; lo = mid + 1; }
      else hi = mid - 1;
    }
    return best;
  });

  // Auto-scroll. Re-runs when activeIdx changes OR when the lines reference itself
  // changes (newly arrived lyrics → snap to the correct line based on current playback).
  // Query DOM directly via innerEl.children — avoids stale bind:this refs across track changes.
  $effect(() => {
    void lines;          // dependency: re-fire when lyrics arrive late
    void activeIdx;      // dependency: re-fire on line activation
    if (!containerEl || !innerEl) return;
    if (activeIdx < 0) {
      innerEl.style.transform = 'translateY(0)';
      return;
    }
    // Defer one frame so the keyed-each has rendered the new line nodes before we measure.
    requestAnimationFrame(() => {
      if (!containerEl || !innerEl) return;
      const el = innerEl.children[activeIdx] as HTMLElement | undefined;
      if (!el) return;
      const cR = containerEl.getBoundingClientRect();
      const eR = el.getBoundingClientRect();
      const innerR = innerEl.getBoundingClientRect();
      const elCenter = (eR.top - innerR.top) + eR.height / 2;
      const target = (cR.height / 2) - elCenter;
      innerEl.style.transform = `translateY(${target}px)`;
    });
  });
</script>

<div class="lyrics-wrap" class:is-untracked={!synced && lines.some((l) => l.text)}>
  {#if !synced && lines.some((l) => l.text)}
    <div class="lyrics-hint">
      <span class="lyrics-hint-dot"></span>
      <span class="lyrics-hint-text">From YouTube — syncing soon</span>
    </div>
  {/if}
  <div class="lyrics" bind:this={containerEl}>
  <div class="lyrics-inner" bind:this={innerEl}>
    {#each lines as line, i (line.t + '|' + (line.text ?? '∿') + '|' + i)}
      <div
        class="lyric-line"
        class:active={synced && i === activeIdx}
        class:passed={synced && i < activeIdx}
        class:untracked={!synced}
        onclick={() => synced && onSeek(line.t / 1000)}
        onkeydown={(e) => { if (e.key === 'Enter' && synced) onSeek(line.t / 1000); }}
        role="button"
        tabindex="0"
        title={synced ? fmtTime(line.t / 1000) : ''}
      >
        {#if line.instrumental}
          <span class="dot-row"><span></span><span></span><span></span></span>
        {:else}
          <span>{line.text}</span>
        {/if}
      </div>
    {/each}
  </div>
  </div>
</div>
