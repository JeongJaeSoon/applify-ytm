<script lang="ts">
  import Icon from './icons/Icon.svelte';

  interface Props {
    volume: number;
    liked: boolean;
    onVolume: (v: number) => void;
    onLike: () => void;
    onLyricsToggle: () => void;
    onQueue: () => void;
    onAirplay: () => void;
  }
  const { volume, liked, onVolume, onLike, onLyricsToggle, onQueue, onAirplay }: Props = $props();

  const volIcon = $derived(volume === 0 ? 'volume-off' : volume < 0.4 ? 'volume-low' : 'volume');

  let volTrackEl: HTMLDivElement | undefined = $state();

  function setFromClientX(cx: number) {
    if (!volTrackEl) return;
    const r = volTrackEl.getBoundingClientRect();
    onVolume(Math.max(0, Math.min(1, (cx - r.left) / r.width)));
  }

  function onPointerDown(e: PointerEvent) {
    e.preventDefault();
    setFromClientX(e.clientX);
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
    const move = (ev: PointerEvent) => setFromClientX(ev.clientX);
    const up = (ev: PointerEvent) => {
      (e.currentTarget as Element)?.releasePointerCapture?.(ev.pointerId);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  }

  function onKey(e: KeyboardEvent) {
    if (e.key === 'ArrowRight') onVolume(Math.min(1, volume + 0.05));
    else if (e.key === 'ArrowLeft') onVolume(Math.max(0, volume - 0.05));
  }
</script>

<div class="extras">
  <div class="vol">
    <Icon name={volIcon} size={14} />
    <div class="vol-bar-hit"
         onpointerdown={onPointerDown}
         onkeydown={onKey}
         role="slider" tabindex="0"
         aria-valuemin={0} aria-valuemax={1} aria-valuenow={volume}>
      <div class="vol-bar" bind:this={volTrackEl}>
        <div class="vol-fill" style="width: {volume * 100}%"></div>
      </div>
    </div>
  </div>
  <div class="extra-actions">
    <button class="ibtn" data-on={liked ? 1 : 0} onclick={onLike} aria-label="Like">
      <Icon name={liked ? 'heart-filled' : 'heart'} />
    </button>
    <button class="ibtn" onclick={onLyricsToggle} aria-label="Toggle lyrics"><Icon name="lyrics" /></button>
    <button class="ibtn" onclick={onQueue} aria-label="Queue"><Icon name="queue" /></button>
    <button class="ibtn" onclick={onAirplay} aria-label="Cast"><Icon name="cast" /></button>
  </div>
</div>
