// Scrape currently-playing track info from YTM's player bar DOM.
import { getVideo } from './ytm-controls';
import { upscaleArtwork } from './artwork-url';

export interface ScrapedMeta {
  id: string;
  title: string;
  artist: string;
  album?: string;
  year?: number;
  duration: number;
  artworkUrl?: string;
  glyph: string;
}

function findFirst(...queries: string[]): Element | null {
  for (const q of queries) {
    const el = document.querySelector(q);
    if (el) return el;
  }
  return null;
}

export function scrapeMetadata(): ScrapedMeta | null {
  const titleEl = findFirst(
    '.title.ytmusic-player-bar',
    '.middle-controls .title',
  );
  const bylineEl = findFirst(
    '.byline.ytmusic-player-bar',
    '.subtitle.ytmusic-player-bar',
    '.middle-controls .subtitle',
  );
  // Walk multiple thumbnail surfaces in order — the *first one with a real src* wins.
  // Player-bar img loads on every page state (collapsed or expanded); fullbleed only
  // exists when the page is expanded. We can always upscale the URL afterwards.
  const imgCandidates = [
    'ytmusic-player-bar .image.ytmusic-player-bar img',
    'ytmusic-player-bar img.ytmusic-player-bar',
    'ytmusic-player-bar #song-image img',
    'ytmusic-player-page ytmusic-fullbleed-thumbnail-renderer img',
    'ytmusic-fullbleed-thumbnail-renderer img',
    'ytmusic-player-bar img',
  ];
  let imgEl: HTMLImageElement | null = null;
  for (const sel of imgCandidates) {
    const el = document.querySelector(sel) as HTMLImageElement | null;
    if (el && el.src && !/^data:|^$/.test(el.src)) { imgEl = el; break; }
  }

  const title = titleEl?.textContent?.trim();
  if (!title) return null;

  // YTM byline format: "Artist · Album · Year" (separator may be · or • or , • ,)
  const byline = bylineEl?.textContent?.trim() || '';
  const parts = byline.split(/\s*[·•]\s*/).map((s) => s.trim()).filter(Boolean);
  const artist = parts[0] || 'Unknown Artist';
  const album = parts[1];
  const year = parts.length > 0 ? parseYear(parts[parts.length - 1]) : undefined;

  const artworkUrl = upscaleArtwork(imgEl?.src);
  const v = getVideo();
  const duration = v?.duration && isFinite(v.duration) ? v.duration : 0;

  return {
    id: `${title}::${artist}`,
    title,
    artist,
    album: album && !isYear(album) ? album : undefined,
    year,
    duration,
    artworkUrl,
    glyph: title.charAt(0).toUpperCase(),
  };
}

function isYear(s: string): boolean { return /^\d{4}$/.test(s); }
function parseYear(s: string): number | undefined {
  const m = s.match(/\b(19|20)\d{2}\b/);
  return m ? parseInt(m[0], 10) : undefined;
}
