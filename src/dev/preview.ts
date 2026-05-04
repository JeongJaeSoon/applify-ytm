// Standalone preview harness — mounts the Svelte App in regular DOM (no Shadow DOM)
// so we can visually verify the UI without installing the extension. Imports the same
// CSS the content script uses.

import { mount } from 'svelte';
import App from '../components/App.svelte';
import '../styles/app.css';

const root = document.getElementById('preview-root');
if (!root) throw new Error('preview-root missing');
mount(App, { target: root, props: { demoMode: true } });

console.log('[Applify preview] mounted');
