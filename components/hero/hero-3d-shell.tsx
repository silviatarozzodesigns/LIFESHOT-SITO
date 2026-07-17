"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useRef, useState } from "react";
import { HeroBackgroundVideo } from "@/components/hero/hero-background-video";
import { EditableImage } from "@/components/cms/editable-image";
import type { HeroAssets, PageSlug } from "@/lib/content";
import { cn } from "@/lib/utils";

/**
 * I quattro dispositivi, con le STESSE condizioni delle classi
 * `.hero-asset-*` in globals.css. Servono sia ai <source> di <picture> sia
 * alle regole di inquadratura: un solo posto da toccare se cambiano.
 */
const MQ = {
  desktop: "(min-width: 1024px) and (pointer: fine)",
  tabletLandscape: "(min-width: 768px) and (orientation: landscape)",
  tabletPortrait: "(min-width: 768px) and (orientation: portrait)",
} as const;

/**
 * GIF trasparente 1×1 come sorgente "vuota": il browser NON fa una
 * richiesta di rete per una data URI. Serve dove un dispositivo non ha il
 * suo overlay: con `src=""` il browser richiederebbe la pagina stessa.
 */
const PIXEL_VUOTO =
  "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";

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
  fullHeight = false,
  children,
}: {
  /** Pagina CMS a cui appartengono gli asset (chip upload in edit mode) */
  page: PageSlug;
  assets: HeroAssets;
  /** Etichetta del chip upload dell'overlay (es. "Rider") */
  overlayLabel?: string;
  /** In preview disattiviamo il parallax legato al mouse */
  interactive?: boolean;
  /**
   * Schermo pieno anche su telefono e tablet. Serve a chi ha poco contenuto
   * (le hero categoria) per distribuirlo in altezza invece di ammassarlo al
   * centro; motorsport non ne ha bisogno, la sua colonna è già lunga.
   */
  fullHeight?: boolean;
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

  /**
   * Inquadratura e zoom per dispositivo: prima erano stili inline su quattro
   * <img> diversi, ora l'immagine è una sola e i valori li sceglie il CSS
   * agli stessi breakpoint. L'ordine è la cascata: mobile come base, poi
   * tablet, desktop per ultimo così vince sui tablet (come in globals.css).
   * Lo zoom dell'overlay passa da una variabile perché il transform del suo
   * contenitore contiene anche il parallax, che è dinamico.
   */
  const inquadratura = `
    .ls-hero-bg{object-position:${mobileBg.position};transform:scale(${Math.max(1.1, mobileBg.scale / 100)})}
    .ls-hero-fg{--ls-fg-scale:${fgM.scale / 100}}
    .ls-hero-fg-img{object-position:${fgM.position}}
    @media ${MQ.tabletPortrait}{
      .ls-hero-bg{object-position:${tabletBg.position};transform:scale(${Math.max(1.1, tabletBg.scale / 100)})}
      .ls-hero-fg{--ls-fg-scale:${fgT.scale / 100}}
      .ls-hero-fg-img{object-position:${fgT.position}}
    }
    @media ${MQ.tabletLandscape}{
      .ls-hero-bg{object-position:${tabletLandBg.position};transform:scale(${Math.max(1.1, tabletLandBg.scale / 100)})}
      .ls-hero-fg{--ls-fg-scale:${tabletLandFg.scale / 100}}
      .ls-hero-fg-img{object-position:${tabletLandFg.position}}
    }
    @media ${MQ.desktop}{
      .ls-hero-bg{object-position:${bg.position};transform:scale(${Math.max(1.1, bg.scale / 100)})}
      .ls-hero-fg{--ls-fg-scale:${fg.scale / 100}}
      .ls-hero-fg-img{object-position:${fg.position}}
    }
  `;

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
      className={cn(
        "relative isolate flex flex-col overflow-hidden rounded-b-[2.5rem]",
        fullHeight ? "min-h-[100svh]" : "lg:min-h-[100svh]"
      )}
    >
      {/* Inquadratura e zoom per dispositivo (vedi `inquadratura`): non sono
          stili inline perché l'immagine ora è una sola per tutti gli schermi */}
      <style dangerouslySetInnerHTML={{ __html: inquadratura }} />

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
          /* UNA sola immagine scaricata: <picture> sceglie la variante del
             dispositivo PRIMA di chiedere il file. Prima erano quattro <img>
             nascosti via CSS, e il browser li scaricava tutti e quattro —
             misurato: un telefono si portava a casa anche lo sfondo del
             computer. L'ordine dei <source> conta: vince il primo che
             corrisponde, quindi desktop → tablet → (fallback) mobile. */
          <picture className="block h-full w-full">
            <source media={MQ.desktop} srcSet={bg.url || tabletBg.url} />
            <source media={MQ.tabletLandscape} srcSet={tabletLandBg.url} />
            <source media={MQ.tabletPortrait} srcSet={tabletBg.url} />
            <img
              src={mobileBg.url}
              alt=""
              className="ls-hero-bg h-full w-full object-cover"
            />
          </picture>
        ) : (
          <div className="h-full w-full bg-gradient-to-b from-secondary to-background" />
        )}

        {/* Video di sfondo: copre la foto quando c'è. La foto sotto resta
            visibile finché il video non parte (e se non parte affatto). */}
        <HeroBackgroundVideo
          landscape={assets.videoLandscape}
          portrait={assets.videoPortrait}
        />

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

      {/* LIVELLO 3 — soggetto scontornato. Come lo sfondo: un solo file
          scaricato, scelto da <picture>. Su tablet/mobile compare SOLO se è
          stato caricato un PNG dedicato per quel dispositivo; dove manca, la
          sorgente è un pixel trasparente (nessuna richiesta, niente da
          vedere) invece di ricadere sull'immagine di un altro schermo. */}
      {(fg.url || fgT.url || tabletLandFg.url || fgM.url) && (
        <div
          aria-hidden
          className="ls-hero-fg pointer-events-none absolute inset-y-0 right-0 z-20 w-[58%] transition-transform duration-300 ease-out"
          style={{
            transform: `translate3d(${p.x * 38}px, ${p.y * 24}px, 0) scale(var(--ls-fg-scale, 1))`,
            transformOrigin: "bottom right",
          }}
        >
          <picture className="block h-full w-full">
            <source media={MQ.desktop} srcSet={fg.url || PIXEL_VUOTO} />
            <source
              media={MQ.tabletLandscape}
              srcSet={tabletLandFg.url || PIXEL_VUOTO}
            />
            <source media={MQ.tabletPortrait} srcSet={fgT.url || PIXEL_VUOTO} />
            <img
              src={fgM.url || PIXEL_VUOTO}
              alt=""
              className="ls-hero-fg-img relative z-20 h-full w-full object-contain drop-shadow-[0_35px_65px_rgba(0,0,0,0.7)]"
            />
          </picture>
        </div>
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
