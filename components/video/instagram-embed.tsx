"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    instgrm?: { Embeds: { process: () => void } };
  }
}

const EMBED_SCRIPT = "https://www.instagram.com/embed.js";

/**
 * Embed nativo di un Reel Instagram: blockquote ufficiale + embed.js,
 * che lo trasforma nel widget interattivo completo (video, like, profilo).
 * Avvolto in una card scura coerente col layout, con skeleton shimmer
 * mentre Instagram carica il contenuto.
 */
export function InstagramEmbed({
  shortcode,
  title,
}: {
  shortcode: string;
  title: string;
}) {
  useEffect(() => {
    const process = () => window.instgrm?.Embeds.process();

    if (window.instgrm) {
      process();
      return;
    }
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${EMBED_SCRIPT}"]`
    );
    if (existing) {
      existing.addEventListener("load", process);
      return () => existing.removeEventListener("load", process);
    }
    const script = document.createElement("script");
    script.src = EMBED_SCRIPT;
    script.async = true;
    script.onload = process;
    document.body.appendChild(script);
  }, [shortcode]);

  return (
    <div className="mx-auto w-full max-w-sm overflow-hidden rounded-2xl border bg-card shadow-[0_16px_50px_-20px_rgba(0,0,0,0.7)]">
      <blockquote
        className="instagram-media skeleton !m-0 !min-h-[480px] !w-full !min-w-0 !max-w-full !rounded-2xl !border-0 !bg-card !p-0 !shadow-none"
        data-instgrm-permalink={`https://www.instagram.com/reel/${shortcode}/`}
        data-instgrm-version="14"
        aria-label={`Reel Instagram: ${title}`}
      />
    </div>
  );
}
