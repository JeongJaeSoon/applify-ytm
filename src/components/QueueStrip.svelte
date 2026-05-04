<script lang="ts">
  interface Props {
    nextTitle: string;
    nextArtist: string;
  }
  const { nextTitle, nextArtist }: Props = $props();
</script>

<div class="queue glass">
  <span class="label">Up next</span>
  <span class="next">{nextTitle}</span>
  <span class="arrow">→</span>
  <span class="next">{nextArtist}</span>
</div>
