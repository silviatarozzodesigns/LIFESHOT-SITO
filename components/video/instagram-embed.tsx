"use client";

import { useEffect } from "react";
import { Instagram, Lock } from "lucide-react";
import { useConsent } from "@/components/legal/consent";

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
  const { consent, openSettings } = useConsent();
  const allowed = consent?.thirdParty === true;

  useEffect(() => {
    if (!allowed) return; // cookie di terze parti non consentiti → niente script
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
  }, [shortcode, allowed]);

  // Finché il consenso terze parti non è dato: placeholder, nessuna chiamata IG
  if (!allowed) {
    return (
      <div className="mx-auto flex w-full max-w-sm flex-col items-center gap-3 rounded-2xl border bg-card p-8 text-center shadow-[0_16px_50px_-20px_rgba(0,0,0,0.7)]">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-primary">
          <Instagram className="h-6 w-6" />
        </span>
        <p className="text-sm font-medium">Contenuto Instagram bloccato</p>
        <p className="text-xs text-muted-foreground">
          Per vedere questo reel attiva i cookie di terze parti.
        </p>
        <button
          type="button"
          onClick={openSettings}
          className="mt-1 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition-transform hover:scale-105"
        >
          <Lock className="h-3.5 w-3.5" />
          Gestisci cookie
        </button>
      </div>
    );
  }

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
