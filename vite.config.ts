import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { crx } from '@crxjs/vite-plugin';
import tailwindcss from '@tailwindcss/vite';
import manifest from './manifest.json' with { type: 'json' };

export default defineConfig({
  plugins: [
    svelte(),
    tailwindcss(),
    crx({ manifest }),
  ],
  build: {
    target: 'esnext',
    rollupOptions: {
      output: {
        // Stable filenames help CRXJS hot-reload work cleanly.
        chunkFileNames: 'assets/[name].js',
        entryFileNames: 'assets/[name].js',
      },
    },
  },
  server: {
    cors: { origin: 'https://music.youtube.com' },
    port: 5173,
    strictPort: true,
    hmr: { port: 5174 },
  },
});
