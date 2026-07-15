"use client";

import { Clock, Instagram, MapPin } from "lucide-react";
import { Hero3DShell } from "@/components/hero/hero-3d-shell";
import { HeroSearch } from "@/components/home/hero-search";
import { EditableText } from "@/components/cms/editable-text";
import type { HeroAssets, TextStyle } from "@/lib/content";
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
  /** Sfondi e rider per i 4 dispositivi, con inquadrature dal CMS */
  assets: HeroAssets;
  /** Classi tipografiche dal CMS (vincolate alla scala Tailwind) */
  eventNameClass: string;
  dateClass: string;
  /** In preview disattiviamo il parallax legato al mouse */
  interactive?: boolean;
  /** Stili per-testo (allineamento/dimensione) modificabili in-place */
  textStyles?: Record<string, TextStyle>;
}

/**
 * HERO 3D MOTORSPORT — vetrina del prossimo evento coperto da Lifeshot.
 * La scenografia (sfondo + rider + parallax) vive in Hero3DShell, condivisa
 * con le hero di Ristorazione e Business; qui c'è il contenuto: badge,
 * nome evento, data, CTA e ricerca per numero di gara. Tutto dal CMS.
 */
export function Hero3D({
  badge,
  eventName,
  eventDate,
  eventTime,
  eventLocation,
  subtitle,
  searchPlaceholder,
  assets,
  eventNameClass,
  dateClass,
  interactive = true,
  textStyles = {},
}: Hero3DProps) {
  return (
    <Hero3DShell
      page="home"
      assets={assets}
      overlayLabel="Rider"
      interactive={interactive}
    >
      <div className="max-w-xl">
        <span className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
          </span>
          <EditableText page="home" k="hero.badge" value={badge} maxLength={40} style={textStyles["hero.badge"]} />
        </span>

        <h1
          className={cn(
            "mt-6 font-semibold uppercase leading-[0.95] tracking-tight lg:whitespace-nowrap",
            eventNameClass
          )}
        >
          <EditableText
            page="home"
            k="hero.eventName"
            value={eventName}
            maxLength={80}
            style={textStyles["hero.eventName"]}
          />
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
            <EditableText
              page="home"
              k="hero.eventDate"
              value={eventDate}
              maxLength={40}
              style={textStyles["hero.eventDate"]}
            />
          </span>
          {eventTime && (
            <span className="inline-flex items-center gap-1.5 text-lg font-medium text-foreground pb-0 md:pb-1">
              <Clock className="h-4 w-4 text-white/80" />
              <EditableText
                page="home"
                k="hero.eventTime"
                value={eventTime}
                maxLength={20}
                style={textStyles["hero.eventTime"]}
              />
            </span>
          )}
        </div>

        {/* Luogo (rimossa la riga "Copertura Lifeshot") */}
        {eventLocation && (
          <p className="mt-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground sm:text-base">
            <MapPin className="h-4 w-4 text-primary" />
            <EditableText
              page="home"
              k="hero.eventLocation"
              value={eventLocation}
              maxLength={100}
              style={textStyles["hero.eventLocation"]}
            />
          </p>
        )}

        {/* CTA principale — grande e prioritaria (unico bottone d'azione).
            Centrata SOLO su telefono (<768px); da tablet in su in riga,
            allineata a sinistra con le intestazioni. */}
        <div className="mt-8 flex flex-col items-center gap-2.5 text-center md:flex-row md:items-center md:gap-4 md:text-left">
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

        {/* Blocco RICERCA — separato e arioso. Centrato SOLO su telefono;
            da tablet in su allineato a sinistra con le intestazioni. */}
        <div className="mx-auto mt-7 pt-12 sm:mt-12 sm:pt-20 max-w-md border-t border-border/40 text-center md:mx-0 md:text-left">
          <p className="text-balance text-sm text-muted-foreground sm:text-base">
            <EditableText
              page="home"
              k="hero.subtitle"
              value={subtitle}
              as="span"
              maxLength={200}
              style={textStyles["hero.subtitle"]}
            />
          </p>
          <div className="mt-4">
            <HeroSearch placeholder={searchPlaceholder} large />
          </div>
        </div>
      </div>
    </Hero3DShell>
  );
}
