<script lang="ts">
  import type { Snippet } from 'svelte';
  interface Props { children: Snippet; }
  const { children }: Props = $props();
</script>

<div class="bg-canvas"></div>
<div class="bg-grain"></div>
<div class="bg-vignette"></div>

<div class="topbar">
  <div class="brand">
    <div class="brand-mark"></div>
    <span>Applify</span>
    <span class="tm">™</span>
  </div>
</div>

{@render children()}
