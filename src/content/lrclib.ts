// Fetch synced LRC-format lyrics from lrclib.net (free public DB).
// API: https://lrclib.net/api/get?artist_name=&track_name=&album_name=&duration=
// Match priority: exact (with album+duration) → permissive (artist+track only).
// Returns parsed LyricLine[] with real timestamps if synced lyrics exist; otherwise null.

import type { LyricLine } from '../lib/types';

interface LrcLibResponse {
  id: number;
  trackName?: string;
  artistName?: string;
  albumName?: string;
  duration?: number;
  instrumental?: boolean;
  plainLyrics?: string | null;
  syncedLyrics?: string | null;
}

const cache = new Map<string, LyricLine[] | null>();

export async function fetchSyncedLyrics(
  artist: string,
  track: string,
  album?: string,
  durationSec?: number,
): Promise<LyricLine[] | null> {
  const key = `${artist}::${track}::${album || ''}::${Math.round(durationSec || 0)}`;
  if (cache.has(key)) return cache.get(key) ?? null;

  // Try the strict (album + duration) endpoint first; fall back to the search endpoint.
  const strict = await tryFetch(buildGetUrl(artist, track, album, durationSec));
  if (strict) {
    const lines = parseLrcLib(strict);
    cache.set(key, lines);
    return lines;
  }

  const loose = await tryFetchSearch(artist, track);
  if (loose) {
    const lines = parseLrcLib(loose);
    cache.set(key, lines);
    return lines;
  }

  cache.set(key, null);
  return null;
}

function buildGetUrl(artist: string, track: string, album?: string, dur?: number): string {
  const params = new URLSearchParams({ artist_name: artist, track_name: track });
  if (album) params.set('album_name', album);
  if (dur && isFinite(dur)) params.set('duration', String(Math.round(dur)));
  return `https://lrclib.net/api/get?${params.toString()}`;
}

async function tryFetch(url: string): Promise<LrcLibResponse | null> {
  try {
    const res = await fetch(url, { method: 'GET', credentials: 'omit' });
    if (!res.ok) return null;
    return (await res.json()) as LrcLibResponse;
  } catch {
    return null;
  }
}

async function tryFetchSearch(artist: string, track: string): Promise<LrcLibResponse | null> {
  const url = `https://lrclib.net/api/search?${new URLSearchParams({ artist_name: artist, track_name: track }).toString()}`;
  try {
    const res = await fetch(url, { method: 'GET', credentials: 'omit' });
    if (!res.ok) return null;
    const list = (await res.json()) as LrcLibResponse[];
    // Prefer entries with synced lyrics, otherwise the first plain.
    return list.find((r) => r.syncedLyrics) || list[0] || null;
  } catch {
    return null;
  }
}

/** Parse lrclib's response into our LyricLine[]. Prefers synced; falls back to plain. */
function parseLrcLib(r: LrcLibResponse): LyricLine[] | null {
  if (r.instrumental) return [{ t: 0, instrumental: true }];
  if (r.syncedLyrics) {
    const parsed = parseLrc(r.syncedLyrics);
    if (parsed.length > 0) return parsed;
  }
  if (r.plainLyrics) {
    // Plain lyrics: no timestamps. Return raw lines without `t` so the caller can
    // either even-distribute (current behavior) or fall back to the YTM scrape.
    const lines = r.plainLyrics
      .split(/\r?\n+/)
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length === 0) return null;
    // We return text-only lines with `t: -1` to signal "needs distribution".
    return lines.map((text) => ({ t: -1, text }));
  }
  return null;
}

/** Parse LRC body. Each line: `[mm:ss.xx]Text` (or `[mm:ss]Text`).
 *  A single line may have multiple timestamps for repeats. We emit one entry per timestamp. */
function parseLrc(body: string): LyricLine[] {
  const out: LyricLine[] = [];
  const lineRe = /\[(\d+):(\d+(?:\.\d+)?)\]/g;

  for (const raw of body.split(/\r?\n/)) {
    const stamps: number[] = [];
    let m: RegExpExecArray | null;
    let lastIdx = 0;
    lineRe.lastIndex = 0;
    while ((m = lineRe.exec(raw)) != null) {
      const min = parseInt(m[1], 10);
      const sec = parseFloat(m[2]);
      stamps.push(Math.round((min * 60 + sec) * 1000));
      lastIdx = m.index + m[0].length;
    }
    if (stamps.length === 0) continue;
    const text = raw.slice(lastIdx).trim();
    for (const t of stamps) {
      if (text) out.push({ t, text });
      else out.push({ t, instrumental: true });
    }
  }

  out.sort((a, b) => a.t - b.t);
  if (out.length === 0) return out;

  // Add a leading instrumental marker if the first line isn't at 0.
  if (out[0].t > 1500 && !out[0].instrumental) {
    out.unshift({ t: 0, instrumental: true });
  }
  return out;
}
