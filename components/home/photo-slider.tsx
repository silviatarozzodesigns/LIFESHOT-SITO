"use client";

import { useCallback, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { photoLoader, photoSrc } from "@/lib/utils";

interface SliderItem {
  id: string;
  raceNumber: string | null;
}

/**
 * Galleria "diario visivo" — card 3D scroll-driven.
 *
 * - Card laterali INCLINATE (rotateY) e rimpicciolite → senso di profondità
 * - Card al centro PIATTA, dritta e più GRANDE → messa a fuoco
 * - L'effetto si aggiorna allo scorrimento (scroll/swipe/frecce) in rAF,
 *   muovendo solo `transform` → animazione fluida sulla GPU
 * - scroll-snap nativo: su mobile è swipe puro, su desktop le frecce
 */
export function PhotoSlider({
  items,
  eyebrow = "Gallery",
  title,
  returnPath = "/",
  navCtx,
}: {
  items: SliderItem[];
  /** Occhiello sopra il titolo della sezione */
  eyebrow?: string;
  /** Titolo sezione (default: "Dietro l'obiettivo") */
  title?: React.ReactNode;
  /** Path di ritorno dal dettaglio foto (link "torna indietro") */
  returnPath?: string;
  /** Contesto di navigazione per le frecce nel dettaglio (es. "f:motorsport") */
  navCtx?: string;
}) {
  const scroller = useRef<HTMLDivElement>(null);
  const cards = useRef<Array<HTMLElement | null>>([]);
  const raf = useRef<number | null>(null);

  /** Calcola e applica le trasformazioni 3D in base alla distanza dal centro. */
  const update = useCallback(() => {
    const el = scroller.current;
    if (!el) return;

    // Solo desktop con puntatore fine: il 3D scroll-driven per-frame su touch
    // (tablet/mobile) causa microscatti. Lì lasciamo lo swipe nativo piatto.
    // Forziamo l'abilitazione del 3D su tutti i dispositivi
    const is3d = true;
    if (!is3d) {
      for (const card of cards.current) {
        if (!card) continue;
        card.style.transform = "";
        card.style.zIndex = "";
        card.style.opacity = "";
      }
      return;
    }

    const viewportCenter = el.scrollLeft + el.clientWidth / 2;
    const reach = el.clientWidth / 2 || 1;

    for (const card of cards.current) {
      if (!card) continue;
      const cardCenter = card.offsetLeft + card.offsetWidth / 2;
      // t ∈ [-1, 1]: 0 = perfettamente centrata
      const t = Math.max(-1, Math.min(1, (cardCenter - viewportCenter) / reach));
      const abs = Math.abs(t);
      const rotateY = t * -24; // inclinazione: segue il lato
      const scale = 1.08 - abs * 0.26; // centro più grande, lati più piccoli
      const lift = abs * 26; // i lati scendono → la centrale "emerge"
      card.style.transform = `perspective(1400px) rotateY(${rotateY}deg) scale(${scale}) translateY(${lift}px)`;
      card.style.zIndex = String(100 - Math.round(abs * 100));
      card.style.opacity = String(1 - abs * 0.25);
    }
  }, []);

  const onScroll = useCallback(() => {
    if (raf.current != null) return;
    raf.current = requestAnimationFrame(() => {
      raf.current = null;
      update();
    });
  }, [update]);

  useEffect(() => {
    update();
    const ro = new ResizeObserver(update);
    const el = scroller.current;
    if (el) ro.observe(el);
    return () => ro.disconnect();
  }, [update]);

  const scrollByCards = useCallback((dir: 1 | -1) => {
    const el = scroller.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-card]");
    const amount = card ? card.offsetWidth + 24 : el.clientWidth * 0.8;
    el.scrollBy({ left: dir * amount, behavior: "smooth" });
  }, []);

  if (items.length === 0) return null;

  return (
    <section aria-label="Galleria scatti" className="relative">
      <div className="container mb-8 flex items-end justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
            {eyebrow}
          </p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
            {title ?? <>Dietro l&apos;obiettivo</>}
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

      {/* Binario scorrevole con prospettiva 3D */}
      <div
        ref={scroller}
        onScroll={onScroll}
        className="flex snap-x snap-mandatory gap-6 overflow-x-auto px-[max(1.5rem,calc((100vw-72rem)/2))] py-10 [-ms-overflow-style:none] [perspective:1400px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((item, i) => (
          <Link
            key={item.id}
            data-card
            ref={(node) => {
              cards.current[i] = node;
            }}
            href={`/foto/${item.id}?ritorno=${encodeURIComponent(returnPath)}${
              navCtx ? `&ctx=${encodeURIComponent(navCtx)}` : ""
            }`}
            onContextMenu={(e) => e.preventDefault()}
            style={{
              transformStyle: "preserve-3d",
              willChange: "transform",
              backfaceVisibility: "hidden",
            }}
            className="group relative aspect-[3/4] w-60 shrink-0 snap-center overflow-hidden rounded-3xl bg-muted shadow-[0_30px_60px_-30px_rgba(0,0,0,0.7)] ring-1 ring-border transition-[transform,opacity] duration-300 ease-out hover:ring-primary/50 sm:w-72"
          >
            <Image
              loader={photoLoader}
              src={photoSrc(item.id)}
              alt={item.raceNumber ? `Scatto #${item.raceNumber}` : "Scatto Lifeshot"}
              fill
              sizes="(max-width: 640px) 15rem, 18rem"
              priority={i < 3}
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
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
