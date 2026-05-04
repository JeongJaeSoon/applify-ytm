// Two-tier lyrics resolution.
//   Tier 1 — YTM scrape: fast (local DOM, no network), but no per-line timestamps.
//            Used as the *immediate* placeholder so the user sees lyrics within ~500ms.
//   Tier 2 — lrclib.net: slower (network) but returns real synced timings when available.
//            Upgrades the UI to active-line tracking once it arrives.
// sync.ts orchestrates both: tier 1 result lands first with synced=false; tier 2 overwrites
// with synced=true. Once synced=true, neither tier is allowed to downgrade.

import type { LyricLine } from '../lib/types';
import { getVideo } from './ytm-controls';
import { fetchSyncedLyrics } from './lrclib';

export interface ScrapeContext {
  artist?: string;
  title?: string;
  album?: string;
  duration?: number;
}

export interface LyricsResult {
  lines: LyricLine[];
  synced: boolean;
}

/** Tier 1: YTM lyrics shelf scrape. Fast, untimed.
 *  Returns null if YTM has no lyrics for this track. */
export async function scrapeLyricsFromYTM(): Promise<LyricsResult | null> {
  await ensurePlayerExpanded();
  const found = await ensureLyricsTabActive();
  if (!found) return null;

  for (let i = 0; i < 18; i++) {
    const lines = collectLyricLines();
    if (lines.length > 0) return { lines: synthesizeTimings(lines), synced: false };
    await sleep(250);
  }
  return null;
}

/** Tier 2: lrclib.net synced LRC. Slower (network), real per-line timestamps when available. */
export async function scrapeLyricsFromLrclib(ctx: ScrapeContext): Promise<LyricsResult | null> {
  if (!ctx.artist || !ctx.title) return null;
  try {
    const remote = await fetchSyncedLyrics(ctx.artist, ctx.title, ctx.album, ctx.duration);
    if (!remote || remote.length === 0) return null;

    const hasRealTimings = remote.some((l) => l.t > 0);
    if (hasRealTimings) return { lines: remote, synced: true };

    // Plain lyrics returned (t === -1 sentinel) — distribute evenly, mark un-synced.
    const plainTexts = remote.map((l) => l.text || '').filter(Boolean);
    if (plainTexts.length > 0) return { lines: synthesizeTimings(plainTexts), synced: false };
  } catch {
    // Network or parse error — caller should fall back gracefully.
  }
  return null;
}

/** Expand YTM's full-page player if it's collapsed. The expand button
 *  is `.toggle-player-page-button` on the player bar. */
async function ensurePlayerExpanded(): Promise<void> {
  const playerPage = document.querySelector('ytmusic-player-page');
  const attr = playerPage?.getAttribute('player-page-open');
  const isExpanded = attr !== null && attr !== undefined && attr !== 'false';
  if (isExpanded) return;

  const expandBtn = document.querySelector<HTMLElement>(
    '.toggle-player-page-button, .toggle-player-page-button-icon, ytmusic-player-bar [aria-label="Show player"]',
  );
  if (expandBtn) {
    expandBtn.click();
    await sleep(400);
  }
}

/** Click YTM's "Lyrics" tab if it exists and isn't already selected. */
async function ensureLyricsTabActive(): Promise<boolean> {
  // YTM 's tabs are inside the expanded player page.
  const tabs = document.querySelectorAll<HTMLElement>(
    'ytmusic-player-page tp-yt-paper-tab, tp-yt-paper-tab[role="tab"], ytmusic-tabs tp-yt-paper-tab',
  );
  for (const tab of Array.from(tabs)) {
    const label = (tab.textContent || '').trim().toLowerCase();
    if (label.includes('lyrics') || label.includes('가사') || label.includes('歌詞') || label.includes('letras')) {
      if (tab.getAttribute('aria-selected') !== 'true') {
        tab.click();
        await sleep(700);
      }
      return true;
    }
  }
  return false;
}

function collectLyricLines(): string[] {
  // YTM's lyrics shelf has multiple yt-formatted-strings (strapline, header, description, footer).
  // The strapline appears earliest in document order — querySelector with a comma-list returns it
  // first and shadows the lyrics body. Iterate and pick the longest non-empty description instead.
  const shelves = document.querySelectorAll('ytmusic-description-shelf-renderer');
  for (const shelf of Array.from(shelves)) {
    // Only trust shelves explicitly marked as lyrics — credits/about pages reuse this renderer.
    if (shelf.hasAttribute('is-track-lyrics-page') === false &&
        shelf.getAttribute('page-type') !== 'MUSIC_PAGE_TYPE_TRACK_LYRICS') continue;

    const candidates: string[] = [];
    // Most reliable: the explicit description class.
    const desc = shelf.querySelector('yt-formatted-string.description, .description.ytmusic-description-shelf-renderer');
    if (desc) candidates.push((desc.textContent || '').trim());
    // Fallback: longest non-empty yt-formatted-string in the shelf.
    const fs = shelf.querySelectorAll('yt-formatted-string:not([is-empty])');
    for (const el of Array.from(fs)) {
      const t = (el.textContent || '').trim();
      if (t && !/^(source|출처)\s*:/i.test(t)) candidates.push(t);
    }

    // Pick the longest candidate; very short strings are likely strapline/header noise.
    candidates.sort((a, b) => b.length - a.length);
    for (const text of candidates) {
      if (text.length < 20) continue;
      const lines = text
        .split(/[\r\n]+/)
        .map((l) => l.trim())
        .filter(Boolean)
        .filter((l) => !/^(source|출처)\s*:/i.test(l));
      if (lines.length > 0) return lines;
    }
  }
  return [];
}

function synthesizeTimings(lines: string[]): LyricLine[] {
  const v = getVideo();
  const totalMs = v?.duration && isFinite(v.duration) ? v.duration * 1000 : 180_000;
  const intro = totalMs * 0.05;
  const span = totalMs * 0.9;

  const out: LyricLine[] = [{ t: 0, instrumental: true }];
  for (let i = 0; i < lines.length; i++) {
    out.push({
      t: Math.round(intro + (span * i) / lines.length),
      text: lines[i],
    });
  }
  out.push({ t: Math.round(intro + span + 1000), instrumental: true });
  return out;
}

function sleep(ms: number) { return new Promise<void>((r) => setTimeout(r, ms)); }
