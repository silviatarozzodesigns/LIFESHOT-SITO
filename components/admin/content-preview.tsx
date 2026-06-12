"use client";

/* eslint-disable @next/next/no-img-element */

import { ArrowRight, Camera, Search } from "lucide-react";
import {
  HERO_SPACING,
  SECTION_SPACING,
  type SiteContentData,
} from "@/lib/content";
import { cn } from "@/lib/utils";

/**
 * LIVE PREVIEW del micro-CMS.
 *
 * Componente PURO: riceve lo stato dell'editor via prop e lo renderizza —
 * nessun fetch, nessuno stato interno. È la stessa identica `content` che
 * l'editor sta modificando, quindi ogni keystroke si riflette qui
 * istantaneamente, prima di qualsiasi salvataggio su database.
 *
 * Le classi di spaziatura applicate sono LE STESSE mappe usate dalla
 * homepage reale (HERO_SPACING / SECTION_SPACING): quello che vedi è
 * quello che verrà pubblicato.
 */
export function ContentPreview({ content }: { content: SiteContentData }) {
  return (
    <div className="overflow-hidden rounded-2xl border bg-background shadow-[0_16px_50px_-20px_rgba(0,0,0,0.7)]">
      {/* Barra "browser" con il Meta Title come titolo della scheda */}
      <div className="flex items-center gap-3 border-b bg-card px-4 py-2.5">
        <span className="flex gap-1.5" aria-hidden>
          <i className="h-2.5 w-2.5 rounded-full bg-destructive/70" />
          <i className="h-2.5 w-2.5 rounded-full bg-primary/70" />
          <i className="h-2.5 w-2.5 rounded-full bg-muted-foreground/40" />
        </span>
        <span className="min-w-0 flex-1 truncate rounded-md bg-background/60 px-3 py-1 text-center text-[11px] text-muted-foreground">
          {content.seo.metaTitle || "Meta Title…"}
        </span>
      </div>

      <div className="max-h-[65vh] overflow-y-auto">
        {/* HERO — spaziatura reale dal livello scelto */}
        <section
          className={cn(
            "px-6 text-center",
            HERO_SPACING[content.spacing.hero]
          )}
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-primary">
            {content.hero.eyebrow}
          </p>
          <h2 className="mt-2 text-balance text-2xl font-semibold tracking-tight">
            {content.hero.titleLine1}
            <br />
            <span className="text-muted-foreground">
              {content.hero.titleLine2}
            </span>
          </h2>
          <p className="mx-auto mt-3 max-w-xs text-balance text-xs text-muted-foreground">
            {content.hero.subtitle}
          </p>
          <div className="mx-auto mt-5 flex max-w-[240px] items-center gap-2 rounded-full border bg-card px-3.5 py-2 text-left">
            <Search className="h-3 w-3 shrink-0 text-muted-foreground" />
            <span className="flex-1 truncate text-[10px] text-muted-foreground">
              {content.hero.searchPlaceholder}
            </span>
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <ArrowRight className="h-2.5 w-2.5" />
            </span>
          </div>
        </section>

        {/* SEZIONE EVENTI — spaziatura reale dal livello scelto */}
        <section
          className={cn("px-6", SECTION_SPACING[content.spacing.sections])}
        >
          <h3 className="text-base font-semibold tracking-tight">
            {content.events.title}
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            {content.events.subtitle}
          </p>
          <div className="mt-4 grid grid-cols-3 gap-2.5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="overflow-hidden rounded-lg border bg-card"
              >
                <div className="flex aspect-[16/10] items-center justify-center bg-muted">
                  <Camera className="h-4 w-4 text-muted-foreground/40" />
                </div>
                <div className="space-y-1 p-2">
                  <div className="h-1.5 w-3/4 rounded bg-muted" />
                  <div className="h-1.5 w-1/2 rounded bg-muted/70" />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ANTEPRIMA SEO — risultato Google + immagine Open Graph */}
        <section className="border-t bg-card/60 px-6 py-5">
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Anteprima risultato Google
          </p>
          <p className="truncate text-sm text-[#99c3ff]">
            {content.seo.metaTitle || "Meta Title mancante"}
          </p>
          <p className="mt-0.5 text-[11px] text-emerald-400/80">
            lifeshot-sito-blond.vercel.app
          </p>
          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
            {content.seo.metaDescription || "Meta Description mancante"}
          </p>

          {content.seo.ogImage && (
            <div className="mt-4">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Immagine Open Graph (anteprima social)
              </p>
              <img
                src={content.seo.ogImage}
                alt="Anteprima Open Graph"
                className="h-28 w-full rounded-lg border object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
