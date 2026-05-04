export type RGB = readonly [number, number, number];

export interface Palette {
  bg: RGB;
  bg2: RGB;
  accent: RGB;
}

export interface LyricLine {
  t: number; // milliseconds
  text?: string;
  romaji?: string;
  translation?: string;
  instrumental?: boolean;
}

export interface Track {
  id: string;
  title: string;
  artist: string;
  album?: string;
  year?: number;
  duration: number; // seconds
  glyph: string;
  artworkUrl?: string;
  palette: Palette;
  lyrics: LyricLine[];
  /** True only when lyrics carry real per-line timestamps (lrclib synced).
   *  When false the lines are plain text or evenly-distributed estimates —
   *  the UI should not highlight an "active" line because tracking would lie. */
  lyricsSynced?: boolean;
}

export const NEUTRAL_PALETTE: Palette = {
  bg: [22, 22, 26],
  bg2: [44, 44, 52],
  accent: [200, 200, 210],
};
