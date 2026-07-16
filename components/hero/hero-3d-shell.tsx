"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useRef, useState } from "react";
import { EditableImage } from "@/components/cms/editable-image";
import type { HeroAssets, PageSlug } from "@/lib/content";
import { cn } from "@/lib/utils";

/**
 * GUSCIO HERO 3D — la scenografia condivisa delle hero cinematografiche
 * (Motorsport, Ristorazione, Business).
 *
 * Profondità a 3 livelli con parallax al mouse:
 *   1. sfondo (paesaggio/ambiente)      → si muove poco
 *   2. contenuto (children)             → fermo, sopra il velo
 *   3. soggetto scontornato (PNG)       → si muove di più → effetto 3D
 *
 * Ogni pagina porta i suoi asset (sfondo + overlay per Computer, Tablet
 * verticale/orizzontale e Mobile, con zoom e inquadratura dal CMS) e il
 * proprio contenuto testuale come children.
 */
export function Hero3DShell({
  page,
  assets,
  overlayLabel = "Overlay 3D",
  interactive = true,
  children,
}: {
  /** Pagina CMS a cui appartengono gli asset (chip upload in edit mode) */
  page: PageSlug;
  assets: HeroAssets;
  /** Etichetta del chip upload dell'overlay (es. "Rider") */
  overlayLabel?: string;
  /** In preview disattiviamo il parallax legato al mouse */
  interactive?: boolean;
  children: React.ReactNode;
}) {
  const {
    background: bg,
    backgroundTablet: bgT,
    backgroundTabletLandscape: bgTL,
    backgroundMobile: bgM,
    foreground: fg,
    foregroundTablet: fgT,
    foregroundTabletLandscape: fgTL,
    foregroundMobile: fgM,
  } = assets;

  // Sfondi per viewport: usano quello dedicato se caricato, altrimenti a
  // cascata (tablet orizzontale → verticale → desktop)
  const tabletBg = bgT.url ? bgT : { ...bg, url: bg.url };
  const tabletLandBg = bgTL.url ? bgTL : bgT.url ? bgT : bg;
  const mobileBg = bgM.url ? bgM : bg;
  // Overlay tablet orizzontale: dedicato, altrimenti quello verticale
  const tabletLandFg = fgTL.url ? fgTL : fgT;

  const ref = useRef<HTMLDivElement>(null);
  const [p, setP] = useState({ x: 0, y: 0 });
  // Niente parallax 3D su touch o schermi piccoli: solo puntatore fine + desktop
  const [coarse, setCoarse] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(pointer: coarse), (max-width: 1023px)");
    const update = () => setCoarse(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  /**
   * VIDEO DI SFONDO — un solo file, scelto dopo il mount in base
   * all'orientamento: verticale su telefono e tablet verticale, orizzontale
   * su tablet orizzontale e computer. Sceglierlo lato client (invece di
   * mettere entrambi nel DOM) evita che il telefono si scarichi anche il
   * video orizzontale. Se ne è caricato uno solo, vale per tutti.
   * Con prefers-reduced-motion resta la foto.
   */
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  useEffect(() => {
    if (!assets.videoLandscape && !assets.videoPortrait) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const portraitMq = window.matchMedia("(orientation: portrait)");
    const desktopMq = window.matchMedia("(min-width: 1024px) and (pointer: fine)");
    const pick = () => {
      const wantsPortrait = portraitMq.matches && !desktopMq.matches;
      const src = wantsPortrait
        ? assets.videoPortrait || assets.videoLandscape
        : assets.videoLandscape || assets.videoPortrait;
      setVideoSrc(src || null);
    };
    pick();
    portraitMq.addEventListener("change", pick);
    desktopMq.addEventListener("change", pick);
    return () => {
      portraitMq.removeEventListener("change", pick);
      desktopMq.removeEventListener("change", pick);
    };
  }, [assets.videoLandscape, assets.videoPortrait]);

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!interactive || coarse) return;
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    setP({
      x: (e.clientX - rect.left) / rect.width - 0.5,
      y: (e.clientY - rect.top) / rect.height - 0.5,
    });
  }

  return (
    <section
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={() => setP({ x: 0, y: 0 })}
      className="relative isolate flex flex-col overflow-hidden rounded-b-[2.5rem] lg:min-h-[100svh]"
    >
      {/* Chip cambio immagini in-place (solo admin in edit mode).
          Sotto la navbar fluttuante e z alto così restano sempre visibili. */}
      <div className="pointer-events-none absolute right-4 top-24 z-[60] flex flex-wrap justify-end gap-2 sm:top-28">
        <EditableImage page={page} k="hero.background" label="Sfondo" />
        <EditableImage page={page} k="hero.foreground" label={overlayLabel} />
      </div>

      {/* LIVELLO 1 — sfondo (swap responsive desktop / tablet / mobile).
          scale(1.06) di sicurezza: overscan che assorbe la traslazione del
          parallasse → nessun bordo nero ai limiti del movimento del mouse. */}
      <div
        className="absolute inset-0 -z-10 transition-transform duration-300 ease-out"
        style={{
          transform: `translate3d(${p.x * -18}px, ${p.y * -18}px, 0) scale(1.06)`,
        }}
      >
        {bg.url || bgT.url || bgTL.url || bgM.url ? (
          <>
            {/* Desktop (≥1024px con mouse/trackpad) */}
            <img
              src={bg.url || tabletBg.url}
              alt=""
              style={{
                objectPosition: bg.position,
                transform: `scale(${Math.max(1.1, bg.scale / 100)})`,
              }}
              className="hero-asset-desktop h-full w-full object-cover"
            />
            {/* Tablet VERTICALE (≥768px, orientamento portrait) */}
            <img
              src={tabletBg.url}
              alt=""
              style={{
                objectPosition: tabletBg.position,
                transform: `scale(${Math.max(1.1, tabletBg.scale / 100)})`,
              }}
              className="hero-asset-tablet-portrait h-full w-full object-cover"
            />
            {/* Tablet ORIZZONTALE (≥768px landscape touch — iPad landscape) */}
            <img
              src={tabletLandBg.url}
              alt=""
              style={{
                objectPosition: tabletLandBg.position,
                transform: `scale(${Math.max(1.1, tabletLandBg.scale / 100)})`,
              }}
              className="hero-asset-tablet-landscape h-full w-full object-cover"
            />
            {/* Mobile (<768px) */}
            <img
              src={mobileBg.url}
              alt=""
              style={{
                objectPosition: mobileBg.position,
                transform: `scale(${Math.max(1.1, mobileBg.scale / 100)})`,
              }}
              className="hero-asset-mobile h-full w-full object-cover"
            />
          </>
        ) : (
          <div className="h-full w-full bg-gradient-to-b from-secondary to-background" />
        )}

        {/* Video di sfondo: copre la foto quando c'è. La foto sotto resta
            visibile finché il video non parte (e se non parte affatto). */}
        {videoSrc && (
          <video
            key={videoSrc}
            src={videoSrc}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            aria-hidden
            className="absolute inset-0 h-full w-full object-cover"
            style={{ transform: "scale(1.1)" }}
          />
        )}

        {/* Velo per leggibilità + tinta cinematografica */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/30" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-transparent to-transparent" />
      </div>

      {/* OVERLAY 3D GENERATO — griglia prospettica + mesh, anche senza foto:
          dà profondità "out-of-the-box" prima ancora di caricare gli asset */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-[8] overflow-hidden opacity-[0.5]"
        style={{ transform: `translate3d(${p.x * -10}px, ${p.y * -10}px, 0) scale(1.05)` }}
      >
        <svg className="h-full w-full" preserveAspectRatio="xMidYMax slice" viewBox="0 0 1200 600">
          <defs>
            <linearGradient id="hero-grid" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0" />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.5" />
            </linearGradient>
            <radialGradient id="hero-mesh" cx="70%" cy="35%" r="55%">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.22" />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="1200" height="600" fill="url(#hero-mesh)" />
          {/* Linee orizzontali in prospettiva (pavimento che fugge) */}
          {Array.from({ length: 9 }).map((_, i) => {
            const y = 320 + Math.pow(i / 8, 2) * 280;
            return (
              <line
                key={`h${i}`}
                x1="0"
                x2="1200"
                y1={y}
                y2={y}
                stroke="url(#hero-grid)"
                strokeWidth="1"
              />
            );
          })}
          {/* Linee verticali convergenti verso il punto di fuga */}
          {Array.from({ length: 17 }).map((_, i) => {
            const x = (i / 16) * 1200;
            return (
              <line
                key={`v${i}`}
                x1={x}
                y1="600"
                x2={600 + (x - 600) * 0.15}
                y2="320"
                stroke="hsl(var(--primary))"
                strokeOpacity="0.14"
                strokeWidth="1"
              />
            );
          })}
        </svg>
      </div>

      {/* LIVELLO 3 — soggetto scontornato, per viewport. Su tablet/mobile
          compare SOLO se è stato caricato un PNG dedicato per quel dispositivo
          (altrimenti niente overlay → sfondo pulito). Posizione/zoom dal CMS. */}
      {[
        { asset: fg, vis: "hero-asset-desktop" },
        { asset: fgT, vis: "hero-asset-tablet-portrait" },
        { asset: tabletLandFg, vis: "hero-asset-tablet-landscape" },
        { asset: fgM, vis: "hero-asset-mobile" },
      ].map(({ asset, vis }, i) =>
        asset.url ? (
          <div
            key={i}
            aria-hidden
            className={cn(
              "pointer-events-none absolute inset-y-0 right-0 z-20 w-[58%] transition-transform duration-300 ease-out",
              vis
            )}
            style={{
              transform: `translate3d(${p.x * 38}px, ${p.y * 24}px, 0) scale(${asset.scale / 100})`,
              transformOrigin: "bottom right",
            }}
          >
            <img
              src={asset.url}
              alt=""
              style={{ objectPosition: asset.position }}
              className="relative z-20 h-full w-full object-contain drop-shadow-[0_35px_65px_rgba(0,0,0,0.7)]"
            />
          </div>
        ) : null
      )}

      {/* LIVELLO 2 — contenuto in colonna SINISTRA. Centro/destra liberi per
          valorizzare il soggetto in overlay. Spazio ampio per più "respiro". */}
      <div className="container flex flex-1 flex-col justify-center py-24 sm:py-32 lg:py-40">
        {children}
      </div>

      {/* Sfumatura inferiore: dissolve la hero nel background sottostante,
          evitando lo stacco netto verso la sezione successiva. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] h-40 bg-gradient-to-b from-transparent to-background"
      />
    </section>
  );
}
