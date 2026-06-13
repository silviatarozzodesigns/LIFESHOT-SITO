"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";

interface SliderItem {
  id: string;
  raceNumber: string | null;
}

/**
 * Slider gallery ad alte prestazioni.
 *
 * - Scorrimento fluido con scroll-snap nativo (GPU, niente JS per frame)
 * - Mobile/tablet: swipe touch nativo (overflow-x + snap)
 * - Desktop: frecce eleganti che scorrono di una card, con hover state
 * - Card centrali in evidenza (peek dei vicini ai lati)
 */
export function PhotoSlider({ items }: { items: SliderItem[] }) {
  const scroller = useRef<HTMLDivElement>(null);

  if (items.length === 0) return null;

  function scrollByCards(dir: 1 | -1) {
    const el = scroller.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-card]");
    const amount = card ? card.offsetWidth + 16 : el.clientWidth * 0.8;
    el.scrollBy({ left: dir * amount, behavior: "smooth" });
  }

  return (
    <section aria-label="Galleria scatti" className="relative">
      <div className="container mb-6 flex items-end justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
            Gallery
          </p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
            Dietro l&apos;obiettivo
          </h2>
        </div>
        {/* Frecce — desktop */}
        <div className="hidden items-center gap-2 sm:flex">
          <button
            type="button"
            onClick={() => scrollByCards(-1)}
            aria-label="Scorri indietro"
            className="flex h-11 w-11 items-center justify-center rounded-full border bg-card text-foreground transition-all hover:border-primary/50 hover:bg-primary hover:text-primary-foreground active:scale-95"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => scrollByCards(1)}
            aria-label="Scorri avanti"
            className="flex h-11 w-11 items-center justify-center rounded-full border bg-card text-foreground transition-all hover:border-primary/50 hover:bg-primary hover:text-primary-foreground active:scale-95"
          >
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Binario scorrevole */}
      <div
        ref={scroller}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto px-[max(1.5rem,calc((100vw-72rem)/2))] pb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((item, i) => (
          <Link
            key={item.id}
            data-card
            href={`/foto/${item.id}`}
            className="group relative aspect-[3/4] w-64 shrink-0 snap-center overflow-hidden rounded-2xl bg-muted ring-1 ring-border transition-all duration-500 hover:ring-primary/50 sm:w-72"
          >
            <Image
              src={`/api/images/${item.id}`}
              alt={item.raceNumber ? `Scatto #${item.raceNumber}` : "Scatto Lifeshot"}
              fill
              sizes="(max-width: 640px) 16rem, 18rem"
              priority={i < 3}
              className="object-cover transition-transform duration-700 [transition-timing-function:cubic-bezier(0.22,0.61,0.36,1)] group-hover:scale-[1.05]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
            {item.raceNumber && (
              <span className="absolute bottom-3 left-3 rounded-full bg-black/55 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                #{item.raceNumber}
              </span>
            )}
          </Link>
        ))}
      </div>

      {/* Frecce — mobile (sotto, centrate) */}
      <div className="mt-2 flex items-center justify-center gap-3 sm:hidden">
        <button
          type="button"
          onClick={() => scrollByCards(-1)}
          aria-label="Scorri indietro"
          className="flex h-10 w-10 items-center justify-center rounded-full border bg-card active:scale-95"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => scrollByCards(1)}
          aria-label="Scorri avanti"
          className="flex h-10 w-10 items-center justify-center rounded-full border bg-card active:scale-95"
        >
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </section>
  );
}
