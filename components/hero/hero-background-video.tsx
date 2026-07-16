"use client";

import { useEffect, useState } from "react";

/**
 * VIDEO DI SFONDO DELLE HERO — condiviso fra la hero agenzia (slide) e le
 * hero 3D delle categorie (sfondo + overlay).
 *
 * Carica UN SOLO file, scelto dopo il mount in base all'orientamento:
 * verticale su telefono e tablet verticale, orizzontale su tablet
 * orizzontale e computer. Sceglierlo lato client — invece di mettere
 * entrambi nel DOM — evita che il telefono si scarichi anche la versione
 * orizzontale. Se ne è caricato uno solo, vale per tutti i dispositivi.
 *
 * Si sovrappone allo sfondo esistente (foto o slide), che resta visibile
 * finché il video non parte e fa da riserva se non parte affatto.
 * Con prefers-reduced-motion il video non viene proprio caricato.
 */
export function HeroBackgroundVideo({
  landscape,
  portrait,
}: {
  /** URL del video orizzontale (computer e tablet orizzontale) */
  landscape: string;
  /** URL del video verticale (telefono e tablet verticale) */
  portrait: string;
}) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    if (!landscape && !portrait) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const portraitMq = window.matchMedia("(orientation: portrait)");
    const desktopMq = window.matchMedia("(min-width: 1024px) and (pointer: fine)");
    const pick = () => {
      const wantsPortrait = portraitMq.matches && !desktopMq.matches;
      setSrc(
        (wantsPortrait
          ? portrait || landscape
          : landscape || portrait) || null
      );
    };
    pick();
    portraitMq.addEventListener("change", pick);
    desktopMq.addEventListener("change", pick);
    return () => {
      portraitMq.removeEventListener("change", pick);
      desktopMq.removeEventListener("change", pick);
    };
  }, [landscape, portrait]);

  if (!src) return null;

  return (
    <video
      key={src}
      src={src}
      autoPlay
      muted
      loop
      playsInline
      preload="metadata"
      aria-hidden
      className="absolute inset-0 h-full w-full object-cover"
      style={{ transform: "scale(1.1)" }}
    />
  );
}
