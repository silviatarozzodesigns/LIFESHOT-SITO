"use client";

/* eslint-disable @next/next/no-img-element */

import { useRef, useState } from "react";
import { ArrowRight, CalendarDays, Clock, MapPin, Search } from "lucide-react";
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
        className="absolute inset-0 -z-10 scale-110 transition-transform duration-300 ease-out"
        style={{ transform: `translate3d(${p.x * -18}px, ${p.y * -18}px, 0) scale(1.1)` }}
      >
        {backgroundUrl ? (
          <img
            src={backgroundUrl}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-b from-secondary to-background" />
        )}
        {/* Velo per leggibilità + tinta cinematografica */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/30" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-transparent to-transparent" />
      </div>

      {/* LIVELLO 3 — rider scontornato (più reattivo = più vicino) */}
      {foregroundUrl && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 -z-[5] hidden w-1/2 transition-transform duration-300 ease-out sm:block"
          style={{ transform: `translate3d(${p.x * 36}px, ${p.y * 24}px, 0)` }}
        >
          <img
            src={foregroundUrl}
            alt=""
            className="h-full w-full object-contain object-bottom drop-shadow-[0_30px_60px_rgba(0,0,0,0.6)]"
          />
        </div>
      )}

      {/* LIVELLO 2 — contenuto */}
      <div className="container relative z-10 py-20 sm:py-28 lg:py-36">
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

          <p className="mt-6 max-w-lg text-balance text-base text-muted-foreground sm:text-lg">
            {subtitle}
          </p>

          {/* Ricerca diretta → galleria col numero di gara */}
          <form
            action="/galleria"
            className="mt-8 flex max-w-md items-center gap-3 rounded-full border bg-card/80 px-5 py-2 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.6)] backdrop-blur-md transition-colors focus-within:border-primary/60 hover:border-primary/40"
          >
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              name="numero"
              inputMode="numeric"
              placeholder={searchPlaceholder}
              aria-label="Cerca per numero di gara"
              className="h-10 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            <button
              type="submit"
              aria-label="Cerca"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-all hover:scale-105 hover:shadow-[0_0_24px_-4px_hsl(var(--primary)/0.6)] active:scale-95"
            >
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
