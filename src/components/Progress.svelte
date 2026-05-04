<script lang="ts">
  import { fmtTime } from '../lib/format';

  interface Props {
    position: number;
    duration: number;
    onSeek: (s: number) => void;
  }
  const { position, duration, onSeek }: Props = $props();

  const pct = $derived(Math.min(100, (position / Math.max(1, duration)) * 100));

  let trackEl: HTMLDivElement | undefined = $state();

  function handleClick(e: MouseEvent) {
    if (!trackEl) return;
    const r = trackEl.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    onSeek(Math.max(0, Math.min(1, x)) * duration);
  }
</script>

<div class="progress">
  <div class="scrub" bind:this={trackEl} onclick={handleClick}
       onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleClick(e as unknown as MouseEvent); }}
       role="slider" tabindex="0"
       aria-valuemin={0} aria-valuemax={duration} aria-valuenow={position}>
    <div class="scrub-track">
      <div class="scrub-buf" style="width: {Math.min(100, pct + 8)}%"></div>
      <div class="scrub-fill" style="width: {pct}%"></div>
    </div>
    <div class="scrub-thumb" style="left: {pct}%"></div>
  </div>
  <div class="timestamps">
    <span>{fmtTime(position)}</span>
    <span>−{fmtTime(Math.max(0, duration - position))}</span>
  </div>
</div>
