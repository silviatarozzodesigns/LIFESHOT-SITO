"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { Constellation } from "@/components/agency/constellation";
import { ContactCta } from "@/components/agency/contact-cta";
import { EditableText } from "@/components/cms/editable-text";
import { EditableImage } from "@/components/cms/editable-image";
import type { TextStyle } from "@/lib/content";
import { cn } from "@/lib/utils";

export interface HeroSlide {
  key: string;
  url: string;
  position: string;
  scale: number;
}

/**
 * HERO AGENZIA — slogan + CTA su hero "ibrida":
 *
 * - senza slide CMS → hero tipografica: fondale scuro, bagliore, la
 *   costellazione dei servizi si disegna attorno allo slogan;
 * - con slide CMS → le immagini si alternano in dissolvenza lenta dietro
 *   lo slogan (la costellazione si attenua fin quasi a sparire).
 *
 * Tutto il contenuto (slogan, bottone, slide) è modificabile dal CMS.
 */
export function AgencyHero({
  sloganLine1,
  sloganLine2,
  ctaLabel,
  sloganClass,
  slides,
  textStyles = {},
}: {
  sloganLine1: string;
  sloganLine2: string;
  ctaLabel: string;
  sloganClass: string;
  slides: HeroSlide[];
  textStyles?: Record<string, TextStyle>;
}) {
  const [idx, setIdx] = useState(0);
  const hasSlides = slides.length > 0;

  // Rotazione lenta delle slide (solo se ce n'è più di una)
  useEffect(() => {
    if (slides.length < 2) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % slides.length), 5200);
    return () => clearInterval(t);
  }, [slides.length]);

  return (
    <section className="relative isolate flex min-h-[100svh] flex-col items-center justify-center overflow-hidden rounded-b-[2.5rem] px-8 py-28 text-center">
      {/* Chip admin per caricare le slide (solo in edit mode) */}
      <div className="pointer-events-none absolute right-4 top-24 z-[60] flex flex-wrap justify-end gap-2 sm:top-28">
        {(["hero.slide1", "hero.slide2", "hero.slide3", "hero.slide4"] as const).map(
          (k, n) => (
            <EditableImage key={k} page="agenzia" k={k} label={`Slide ${n + 1}`} />
          )
        )}
      </div>

      {/* SFONDO — slide in dissolvenza oppure fondale tipografico */}
      <div className="absolute inset-0 -z-10">
        {hasSlides ? (
          <>
            {slides.map((s, i) => (
              <img
                key={s.key}
                src={s.url}
                alt=""
                style={{
                  objectPosition: s.position,
                  transform: `scale(${Math.max(1, s.scale / 100)})`,
                  transitionDuration: "1600ms",
                }}
                className={cn(
                  "absolute inset-0 h-full w-full object-cover transition-opacity ease-out",
                  i === idx ? "opacity-100" : "opacity-0"
                )}
              />
            ))}
            {/* Veli per la leggibilità dello slogan */}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/30" />
            <div className="absolute inset-0 bg-gradient-to-r from-background/60 via-transparent to-transparent" />
          </>
        ) : (
          <>
            <div className="absolute inset-0 bg-gradient-to-b from-secondary/50 via-background to-background" />
            <div className="glow-primary absolute left-1/2 top-1/3 h-[30rem] w-[54rem] -translate-x-1/2 -translate-y-1/2" />
          </>
        )}
      </div>

      {/* Costellazione dei servizi: protagonista senza slide, sussurro con */}
      <Constellation dim={hasSlides} />

      {/* SLOGAN + CTA — la zona che la linea non tocca mai */}
      <div className="relative z-10 max-w-4xl">
        <h1
          className={cn(
            "text-balance font-semibold leading-[1.05] tracking-tight",
            sloganClass
          )}
        >
          <EditableText
            page="agenzia"
            k="hero.sloganLine1"
            value={sloganLine1}
            maxLength={60}
            style={textStyles["hero.sloganLine1"]}
          />
          <br />
          <span className="text-muted-foreground">
            <EditableText
              page="agenzia"
              k="hero.sloganLine2"
              value={sloganLine2}
              maxLength={60}
              style={textStyles["hero.sloganLine2"]}
            />
          </span>
        </h1>

        <div className="mt-9 flex justify-center">
          <ContactCta>
            <EditableText
              page="agenzia"
              k="hero.ctaLabel"
              value={ctaLabel}
              maxLength={40}
              style={textStyles["hero.ctaLabel"]}
            />
          </ContactCta>
        </div>
      </div>

      {/* Dissolve verso la sezione successiva + invito allo scroll */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] h-32 bg-gradient-to-b from-transparent to-background"
      />
      <ChevronDown
        aria-hidden
        className="absolute bottom-6 z-10 h-5 w-5 animate-bounce text-muted-foreground/70"
      />
    </section>
  );
}
