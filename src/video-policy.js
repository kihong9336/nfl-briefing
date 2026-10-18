// New-publication policy only; historical editions and rendering are unchanged.
export function isDirectYouTubeVideo(value) {
  if (typeof value !== 'string' || !/^https:\/\//i.test(value) || /[\s\\]/.test(value)) return false;
  let url;
  try { url = new URL(value); } catch { return false; }
  if (url.protocol !== 'https:' || url.username || url.password || url.port) return false;
  const id = /^[A-Za-z0-9_-]{11}$/;
  if (url.hostname === 'youtu.be') return id.test(url.pathname.slice(1));
  if (!['youtube.com', 'www.youtube.com', 'm.youtube.com'].includes(url.hostname)) return false;
  if (url.pathname === '/watch') return url.searchParams.getAll('v').length === 1 && id.test(url.searchParams.get('v'));
  return /^\/shorts\/[A-Za-z0-9_-]{11}$/.test(url.pathname);
}

export function applyVideoPolicy(input) {
  const edition = structuredClone(input);
  const warnings = [];
  if (Array.isArray(edition.highlights)) {
    edition.highlights = edition.highlights.filter((video) => {
      if (isDirectYouTubeVideo(video?.url)) return true;
      warnings.push(`Video unavailable: omitted highlight ${JSON.stringify(video?.title ?? '(untitled)')}; a direct HTTPS YouTube video is required.`);
      return false;
    });
  }
  if (Array.isArray(edition.tactics)) {
    for (const tactic of edition.tactics) {
      if (tactic && tactic.video !== undefined && !isDirectYouTubeVideo(tactic.video?.url)) {
        warnings.push(`Video unavailable: omitted tactic video for ${JSON.stringify(tactic.title ?? '(untitled)')}; lesson retained.`);
        delete tactic.video;
      }
    }
  }
  return { edition, warnings };
}
