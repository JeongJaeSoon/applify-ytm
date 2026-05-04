// Upgrade YTM's tiny player-bar thumbnail URLs to a larger resolution.
// googleusercontent.com URLs use a `=w<n>-h<n>-...` suffix; bumping it gives a sharper image.
export function upscaleArtwork(url: string | undefined, size = 544): string | undefined {
  if (!url) return url;
  // Pattern: `=w60-h60-l90-rj` → `=w544-h544-l90-rj`
  if (/=w\d+-h\d+/.test(url)) {
    return url.replace(/=w\d+-h\d+/, `=w${size}-h${size}`);
  }
  // Some YTM URLs use `=s60` form
  if (/=s\d+/.test(url)) {
    return url.replace(/=s\d+/, `=s${size}`);
  }
  return url;
}
