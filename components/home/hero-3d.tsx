"use client";

/* eslint-disable @next/next/no-img-element */

import { useRef, useState } from "react";
import { Clock, Instagram, MapPin } from "lucide-react";
import { HeroSearch } from "@/components/home/hero-search";
import { site } from "@/lib/site";
import { cn } from "@/lib/utils";

export interface Hero3DProps {
  badge: string;
  eventName: string;
  eventDate: string;
  eventTime: string;
  eventLocation: string;
  subtitle: string;
  searchPlaceholder: string;
  backgroundUrl: string;
  /** Sfondi dedicati per viewport (opzionali): se vuoti usano il desktop */
  backgroundTabletUrl?: string;
  backgroundMobileUrl?: string;
  /** Rider PNG per viewport. Su tablet/mobile compare SOLO se caricato qui. */
  foregroundUrl: string;
  foregroundTabletUrl?: string;
  foregroundMobileUrl?: string;
  /** Classi tipografiche dal CMS (vincolate alla scala Tailwind) */
  eventNameClass: string;
  dateClass: string;
  /** Override di inquadratura manuale dal CMS */
  bgPosition?: string;
  bgScale?: number;
  bgTabletPosition?: string;
  bgTabletScale?: number;
  bgMobilePosition?: string;
  bgMobileScale?: number;
  fgPosition?: string;
  fgScale?: number;
  fgTabletPosition?: string;
  fgTabletScale?: number;
  fgMobilePosition?: string;
  fgMobileScale?: number;
  /** In preview disattiviamo il parallax legato al mouse */
  interactive?: boolean;
}

/**
 * HERO 3D — vetrina del prossimo evento coperto da Lifeshot.
 *
 * Profondità a 3 livelli con parallax al mouse:
 *   1. sfondo (pista/paesaggio)  → si muove poco
 *   2. testi/badge               → fermi, sopra il velo
 *   3. rider scontornato (PNG)   → si muove di più → effetto 3D
 *
 * Tutto il contenuto (testi, immagini, tipografia) arriva dal CMS.
 */
export function Hero3D({
  badge,
  eventName,
  eventDate,
  eventTime,
  eventLocation,
  subtitle,
  searchPlaceholder,
  backgroundUrl,
  backgroundTabletUrl = "",
  backgroundMobileUrl = "",
  foregroundUrl,
  foregroundTabletUrl = "",
  foregroundMobileUrl = "",
  eventNameClass,
  dateClass,
  bgPosition = "center",
  bgScale = 100,
  bgTabletPosition = "center",
  bgTabletScale = 100,
  bgMobilePosition = "center",
  bgMobileScale = 100,
  fgPosition = "center bottom",
  fgScale = 100,
  fgTabletPosition = "center bottom",
  fgTabletScale = 100,
  fgMobilePosition = "center bottom",
  fgMobileScale = 100,
  interactive = true,
}: Hero3DProps) {
  // Sfondi per viewport: usano quello dedicato se caricato, altrimenti il desktop
  const tabletBgUrl = backgroundTabletUrl || backgroundUrl;
  const tabletBgPosition = backgroundTabletUrl ? bgTabletPosition : bgPosition;
  const tabletBgScale = backgroundTabletUrl ? bgTabletScale : bgScale;
  const mobileBgUrl = backgroundMobileUrl || backgroundUrl;
  const mobileBgPosition = backgroundMobileUrl ? bgMobilePosition : bgPosition;
  const mobileBgScale = backgroundMobileUrl ? bgMobileScale : bgScale;
  const ref = useRef<HTMLDivElement>(null);
  const [p, setP] = useState({ x: 0, y: 0 });

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!interactive) return;
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
      {/* LIVELLO 1 — sfondo (swap responsive desktop / mobile-tablet).
          scale(1.06) di sicurezza: overscan che assorbe la traslazione del
          parallasse → nessun bordo nero ai limiti del movimento del mouse. */}
      <div
        className="absolute inset-0 -z-10 transition-transform duration-300 ease-out"
        style={{
          transform: `translate3d(${p.x * -18}px, ${p.y * -18}px, 0) scale(1.06)`,
        }}
      >
        {backgroundUrl || backgroundTabletUrl || backgroundMobileUrl ? (
          <>
            {/* Desktop (≥1024px) */}
            <img
              src={backgroundUrl || tabletBgUrl}
              alt=""
              style={{
                objectPosition: bgPosition,
                transform: `scale(${Math.max(1.1, bgScale / 100)})`,
              }}
              className="hidden h-full w-full object-cover lg:block"
            />
            {/* Tablet (768–1023px) */}
            <img
              src={tabletBgUrl}
              alt=""
              style={{
                objectPosition: tabletBgPosition,
                transform: `scale(${Math.max(1.1, tabletBgScale / 100)})`,
              }}
              className="hidden h-full w-full object-cover md:block lg:hidden"
            />
            {/* Mobile (<768px) */}
            <img
              src={mobileBgUrl}
              alt=""
              style={{
                objectPosition: mobileBgPosition,
                transform: `scale(${Math.max(1.1, mobileBgScale / 100)})`,
              }}
              className="h-full w-full object-cover md:hidden"
            />
          </>
        ) : (
          <div className="h-full w-full bg-gradient-to-b from-secondary to-background" />
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

      {/* LIVELLO 3 — rider scontornato, per viewport. Su tablet/mobile compare
          SOLO se è stato caricato un PNG dedicato per quel dispositivo
          (altrimenti niente rider → sfondo pulito). Posizione/zoom dal CMS. */}
      {[
        {
          url: foregroundUrl,
          position: fgPosition,
          scale: fgScale,
          vis: "hidden lg:block",
        },
        {
          url: foregroundTabletUrl,
          position: fgTabletPosition,
          scale: fgTabletScale,
          vis: "hidden md:block lg:hidden",
        },
        {
          url: foregroundMobileUrl,
          position: fgMobilePosition,
          scale: fgMobileScale,
          vis: "block md:hidden",
        },
      ].map((rider, i) =>
        rider.url ? (
          <div
            key={i}
            aria-hidden
            className={cn(
              "pointer-events-none absolute inset-y-0 right-0 z-20 w-[58%] transition-transform duration-300 ease-out",
              rider.vis
            )}
            style={{
              transform: `translate3d(${p.x * 38}px, ${p.y * 24}px, 0) scale(${rider.scale / 100})`,
              transformOrigin: "bottom right",
            }}
          >
            <img
              src={rider.url}
              alt=""
              style={{ objectPosition: rider.position }}
              className="relative z-20 h-full w-full object-contain drop-shadow-[0_35px_65px_rgba(0,0,0,0.7)]"
            />
          </div>
        ) : null
      )}

      {/* LIVELLO 2 — contenuto in colonna SINISTRA. Centro/destra liberi per
          valorizzare lo scatto del pilota. Spazio ampio per più "respiro". */}
      <div className="container flex flex-1 flex-col justify-center py-24 sm:py-32 lg:py-40">
        <div className="max-w-xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
            {badge}
          </span>

          <h1
            className={cn(
              "mt-6 font-semibold uppercase leading-[0.95] tracking-tight lg:whitespace-nowrap",
              eventNameClass
            )}
          >
            {eventName}
          </h1>

          {/* Data + ora in grande, stile locandina evento */}
          <div className="mt-6 flex flex-col md:flex-row md:items-center gap-x-6 gap-y-2">
          {/* Data grande con "whitespace-nowrap" per obbligarla a stare su una riga sola */}
            <span
              className={cn(
                "font-semibold tabular-nums tracking-tight text-primary whitespace-nowrap",
                dateClass
              )}
            >
              {eventDate}
            </span>
            {eventTime && (
              <span className="inline-flex items-center gap-1.5 text-lg font-medium text-foreground pb-0 md:pb-1">
                <Clock className="h-4 w-4 text-white/80" />
                {eventTime}
              </span>
            )}
          </div>

          {/* Luogo (rimossa la riga "Copertura Lifeshot") */}
          {eventLocation && (
            <p className="mt-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground sm:text-base">
              <MapPin className="h-4 w-4 text-primary" />
              {eventLocation}
            </p>
          )}

          {/* CTA principale — grande e prioritaria (unico bottone d'azione).
              Centrata su mobile/tablet (<1024px), in riga a sinistra su desktop. */}
          <div className="mt-8 flex flex-col items-center gap-2.5 text-center lg:flex-row lg:items-center lg:gap-4 lg:text-left">
            <a
              href={site.instagramDmUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center justify-center gap-2.5 whitespace-nowrap rounded-full bg-primary px-8 py-4 text-base font-semibold text-primary-foreground shadow-xl shadow-primary/30 transition-all hover:scale-[1.03] hover:shadow-primary/50 active:scale-95"
            >
              <Instagram className="h-6 w-6 transition-transform group-hover:rotate-[8deg]" />
              Prenota ora i tuoi contenuti
            </a>
            <span className="text-xs text-muted-foreground sm:text-sm">
              Rispondiamo in DM, di solito in giornata.
            </span>
          </div>

          {/* Blocco RICERCA — separato e arioso. Centrato su mobile/tablet,
              allineato a sinistra su desktop. */}
          <div className="mx-auto mt-24 max-w-md border-t border-border/40 pt-5 text-center lg:mx-0 lg:text-left">
            <p className="text-balance text-sm text-muted-foreground sm:text-base">
              {subtitle}
            </p>
            <div className="mt-4">
              <HeroSearch placeholder={searchPlaceholder} large />
            </div>
          </div>
        </div>
      </div>

      {/* Sfumatura inferiore: dissolve la hero nel background sottostante,
          evitando lo stacco netto verso la sezione "Dietro l'obiettivo". */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] h-40 bg-gradient-to-b from-transparent to-background"
      />
    </section>
  );
}
