/**
 * Parser dei link video del portfolio.
 * I video NON occupano spazio su R2: si incolla un link e il player
 * giusto viene scelto in base al provider.
 */

export type VideoProvider = "youtube" | "vimeo" | "instagram" | "file";

export interface ParsedVideo {
  provider: VideoProvider;
  /** ID YouTube/Vimeo, shortcode Instagram o URL del file */
  embedId: string;
}

export function parseVideoUrl(rawUrl: string): ParsedVideo | null {
  let url: URL;
  try {
    url = new URL(rawUrl.trim());
  } catch {
    return null;
  }
  const host = url.hostname.replace(/^www\./, "");

  // YouTube: watch?v=, youtu.be/, /shorts/, /embed/
  if (host === "youtube.com" || host === "m.youtube.com") {
    const v = url.searchParams.get("v");
    if (v) return { provider: "youtube", embedId: v };
    const match = url.pathname.match(/^\/(shorts|embed|live)\/([\w-]{6,})/);
    if (match) return { provider: "youtube", embedId: match[2] };
    return null;
  }
  if (host === "youtu.be") {
    const id = url.pathname.slice(1).split("/")[0];
    return id ? { provider: "youtube", embedId: id } : null;
  }

  // Vimeo: vimeo.com/<id>
  if (host === "vimeo.com" || host === "player.vimeo.com") {
    const match = url.pathname.match(/(\d{6,})/);
    return match ? { provider: "vimeo", embedId: match[1] } : null;
  }

  // Instagram: /reel/<code>, /p/<code>, /tv/<code>
  if (host === "instagram.com") {
    const match = url.pathname.match(/^\/(reel|reels|p|tv)\/([\w-]+)/);
    return match ? { provider: "instagram", embedId: match[2] } : null;
  }

  // Micro-clip locali (.webm/.mp4) per sfondi dinamici e anteprime
  if (/\.(webm|mp4)$/i.test(url.pathname)) {
    return { provider: "file", embedId: rawUrl.trim() };
  }

  return null;
}
