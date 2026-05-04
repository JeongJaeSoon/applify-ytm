<script lang="ts">
  interface Props {
    name: string;
    size?: number;
  }
  const { name, size = 18 }: Props = $props();
</script>

{#if name === 'play'}
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="M7 5.5c0-.9 1-1.4 1.7-.9l11 6.5c.7.4.7 1.4 0 1.8l-11 6.5c-.7.5-1.7 0-1.7-.9V5.5z"/></svg>
{:else if name === 'pause'}
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><rect x="6.5" y="5" width="4" height="14" rx="1.2"/><rect x="13.5" y="5" width="4" height="14" rx="1.2"/></svg>
{:else if name === 'next'}
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 5l9 7-9 7zM18 5v14"/></svg>
{:else if name === 'prev'}
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M19 5l-9 7 9 7zM6 5v14"/></svg>
{:else if name === 'shuffle'}
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h5v5M21 4l-7 7M3 6l5 0c2 0 3 1 4 3l3 6c1 2 2 3 4 3l2 0M16 20h5v-5M21 20l-5-5M3 18l5 0c1 0 2-.3 3-1"/></svg>
{:else if name === 'repeat'}
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M17 2l4 4-4 4M3 11V8a3 3 0 013-3h15M7 22l-4-4 4-4M21 13v3a3 3 0 01-3 3H3"/></svg>
{:else if name === 'heart'}
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 1 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
{:else if name === 'heart-filled'}
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 1 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
{:else if name === 'queue'}
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h13M3 12h13M3 18h9M19 8v10M16 16l3 2 3-2"/></svg>
{:else if name === 'lyrics'}
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13M9 18a3 3 0 11-6 0 3 3 0 016 0zM21 16a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
{:else if name === 'volume'}
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5L6 9H2v6h4l5 4V5zM15.5 8.5a5 5 0 010 7M19 5a9 9 0 010 14"/></svg>
{:else if name === 'volume-low'}
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5L6 9H2v6h4l5 4V5zM15.5 8.5a5 5 0 010 7"/></svg>
{:else if name === 'volume-off'}
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5L6 9H2v6h4l5 4V5zM23 9l-6 6M17 9l6 6"/></svg>
{:else if name === 'cast'}
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M2 8V6a2 2 0 012-2h16a2 2 0 012 2v12a2 2 0 01-2 2h-7M2 12a8 8 0 018 8M2 16a4 4 0 014 4M2 20h.01"/></svg>
{:else}
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="9"/></svg>
{/if}
