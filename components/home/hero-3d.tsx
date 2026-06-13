"use client";

/* eslint-disable @next/next/no-img-element */

import { useRef, useState } from "react";
import { CalendarDays, Clock, Instagram, MapPin } from "lucide-react";
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
  foregroundUrl: string;
  /** Classi tipografiche dal CMS (vincolate alla scala Tailwind) */
  eventNameClass: string;
  dateClass: string;
  /** Override di inquadratura manuale dal CMS */
  bgPosition?: string;
  bgScale?: number;
  fgPosition?: string;
  fgScale?: number;
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
  foregroundUrl,
  eventNameClass,
  dateClass,
  bgPosition = "center",
  bgScale = 100,
  fgPosition = "center bottom",
  fgScale = 100,
  interactive = true,
}: Hero3DProps) {
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
      className="relative isolate overflow-hidden rounded-b-[2.5rem] border-b border-border/50"
    >
      {/* LIVELLO 1 — sfondo */}
      <div
        className="absolute inset-0 -z-10 transition-transform duration-300 ease-out"
        style={{
          transform: `translate3d(${p.x * -18}px, ${p.y * -18}px, 0) scale(${Math.max(1.1, bgScale / 100)})`,
        }}
      >
        {backgroundUrl ? (
          <img
            src={backgroundUrl}
            alt=""
            style={{ objectPosition: bgPosition }}
            className="h-full w-full object-cover"
          />
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
        style={{ transform: `translate3d(${p.x * -10}px, ${p.y * -10}px, 0)` }}
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

      {/* LIVELLO 3 — rider scontornato.
          • Mobile: full-bleed dietro al testo, RITAGLIATO come lo sfondo
            (object-cover) → resta della stessa dimensione, non si rimpicciolisce.
          • Desktop (sm+): esce sulla destra e si sovrappone al testo (z-20),
            mostrato per intero (object-contain), ancorato in basso-destra.
          Posizione e zoom sono pilotati dagli slider del CMS. */}
      {foregroundUrl && (
        <>
          <div
            aria-hidden
            className="pointer-events-none absolute bottom-0 right-0 top-0 z-[15] w-full transition-transform duration-300 ease-out sm:z-20 sm:w-[60%] lg:w-[54%]"
            style={{
              transform: `translate3d(${p.x * 42}px, ${p.y * 26}px, 0) scale(${fgScale / 100})`,
              transformOrigin: "bottom right",
            }}
          >
            <img
              src={foregroundUrl}
              alt=""
              style={{ objectPosition: fgPosition }}
              className="h-full w-full object-cover drop-shadow-[0_35px_65px_rgba(0,0,0,0.7)] sm:object-contain"
            />
          </div>
          {/* Velo solo-mobile: scurisce il rider per tenere il testo leggibile */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 z-[16] bg-gradient-to-t from-background via-background/75 to-background/35 sm:hidden"
          />
        </>
      )}

      {/* LIVELLO 2 — contenuto. Su mobile sta SOPRA al rider velato (z-20),
          su desktop torna sotto (z-10) così il rider gli esce davanti. */}
      <div className="container relative z-20 py-14 sm:z-10 sm:py-20 lg:py-24">
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
            {badge}
          </span>

          <h1
            className={cn(
              "mt-5 font-semibold uppercase leading-[0.95] tracking-tight",
              eventNameClass
            )}
          >
            {eventName}
          </h1>

          {/* Data + ora in grande, stile locandina evento */}
          <div className="mt-6 flex flex-wrap items-end gap-x-6 gap-y-2">
            <span
              className={cn(
                "font-semibold tabular-nums tracking-tight text-primary",
                dateClass
              )}
            >
              {eventDate}
            </span>
            {eventTime && (
              <span className="inline-flex items-center gap-1.5 pb-1 text-lg font-medium text-foreground/90">
                <Clock className="h-4 w-4" />
                {eventTime}
              </span>
            )}
          </div>

          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-muted-foreground">
            {eventLocation && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-primary" />
                {eventLocation}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4 text-primary" />
              Copertura Lifeshot
            </span>
          </div>

          <p className="mt-4 max-w-lg text-balance text-base text-muted-foreground sm:text-lg">
            {subtitle}
          </p>

          {/* Ricerca istantanea GRANDE — subito sotto i dettagli evento,
              prominente e above-the-fold (nome pilota O numero di gara) */}
          <div className="mt-7">
            <HeroSearch placeholder={searchPlaceholder} large />
          </div>

          {/* CTA primaria — prenotazione contenuti via DM Instagram */}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <a
              href={site.instagramDmUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:scale-[1.03] hover:shadow-primary/40 active:scale-95"
            >
              <Instagram className="h-4 w-4 transition-transform group-hover:rotate-[8deg]" />
              Prenota ora i tuoi contenuti
            </a>
            <span className="text-xs text-muted-foreground">
              Rispondiamo in DM, di solito in giornata.
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
