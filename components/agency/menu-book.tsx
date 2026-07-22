"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { PhotoDTO } from "@/lib/data/photos";
import { cn, photoSrc } from "@/lib/utils";

/**
 * MENÙ SFOGLIABILE — fodera in pelle realistica con copertina personalizzabile.
 * Chiuso mostra la copertina (immagine caricata dall'admin, o il nome del
 * progetto); al tocco si apre con l'anta che ruota sulla costa e dentro
 * scorrono le pagine caricate, con l'effetto della pagina che gira.
 *
 * Le pagine prendono l'aspetto reale della prima immagine (A4 → A4) e tutto
 * il libro è limitato all'85% dell'altezza schermo per stare intero nei vari
 * dispositivi. Frecce, swipe e tasti freccia per sfogliare.
 */
export function MenuBook({
  title,
  coverImage,
  pages,
}: {
  title: string;
  coverImage?: string;
  pages: PhotoDTO[];
}) {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const lock = useRef(false);
  const swipeX = useRef<number | null>(null);

  // Aspetto del menù = aspetto della prima pagina (fallback A4 verticale)
  const w = pages[0]?.width ?? 210;
  const h = pages[0]?.height ?? 297;
  const stageStyle = {
    aspectRatio: `${w} / ${h}`,
    maxWidth: `calc(85vh * ${w} / ${h})`,
  };

  const go = useCallback(
    (delta: 1 | -1) => {
      if (lock.current) return;
      setIndex((i) => {
        const next = i + delta;
        if (next < 0 || next >= pages.length) return i;
        lock.current = true;
        setDirection(delta);
        return next;
      });
    },
    [pages.length]
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, go]);

  if (pages.length === 0) {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-dashed p-10 text-center text-sm text-muted-foreground">
        Il menù è in preparazione: carica le pagine dalla scheda del progetto.
      </div>
    );
  }

  const arrowClass =
    "absolute top-1/2 z-30 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm transition-all hover:bg-primary hover:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-95 disabled:pointer-events-none disabled:opacity-0";

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        className="relative mx-auto w-full"
        style={{ ...stageStyle, perspective: "1800px" }}
        onTouchStart={(e) => {
          swipeX.current = e.touches[0]?.clientX ?? null;
        }}
        onTouchEnd={(e) => {
          if (swipeX.current == null || !open) return;
          const dx = (e.changedTouches[0]?.clientX ?? 0) - swipeX.current;
          swipeX.current = null;
          if (Math.abs(dx) < 60) return;
          go(dx > 0 ? -1 : 1);
        }}
      >
        {/* PAGINE (sotto la copertina): la pagina corrente, con flip */}
        <div className="absolute inset-0 overflow-hidden rounded-[10px] bg-[#f6f1e7] shadow-[0_30px_60px_-25px_rgba(0,0,0,0.7)]">
          <AnimatePresence initial={false} custom={direction} mode="wait">
            <motion.img
              key={index}
              src={photoSrc(pages[index].id)}
              alt={`Pagina ${index + 1} del menù`}
              custom={direction}
              variants={{
                enter: (d: number) => ({
                  rotateY: d >= 0 ? 75 : -75,
                  opacity: 0,
                }),
                center: { rotateY: 0, opacity: 1 },
                exit: (d: number) => ({
                  rotateY: d >= 0 ? -75 : 75,
                  opacity: 0,
                }),
              }}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.34, ease: [0.22, 0.61, 0.36, 1] }}
              onAnimationComplete={() => {
                lock.current = false;
              }}
              draggable={false}
              style={{ transformOrigin: "left center" }}
              className="pointer-events-none absolute inset-0 h-full w-full select-none object-contain [-webkit-user-drag:none]"
            />
          </AnimatePresence>

          {/* Ombra della costa (rilegatura) sul bordo sinistro */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-0 z-20 w-10 bg-gradient-to-r from-black/25 to-transparent"
          />

          {open && pages.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => go(-1)}
                disabled={index === 0}
                aria-label="Pagina precedente"
                className={cn(arrowClass, "left-3")}
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                type="button"
                onClick={() => go(1)}
                disabled={index === pages.length - 1}
                aria-label="Pagina successiva"
                className={cn(arrowClass, "right-3")}
              >
                <ChevronRight className="h-6 w-6" />
              </button>
              <span className="absolute bottom-3 left-1/2 z-30 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
                {index + 1} / {pages.length}
              </span>
            </>
          )}
        </div>

        {/* COPERTINA (fodera in pelle): si apre ruotando sulla costa */}
        <AnimatePresence initial={false}>
          {!open && (
            <motion.button
              type="button"
              onClick={() => setOpen(true)}
              aria-label="Apri il menù"
              initial={false}
              exit={{ rotateY: -168, opacity: 0.9 }}
              transition={{ duration: 0.75, ease: [0.33, 0, 0.2, 1] }}
              style={{ transformOrigin: "left center" }}
              className="absolute inset-0 z-40 origin-left cursor-pointer overflow-hidden rounded-[10px] text-left [transform-style:preserve-3d]"
            >
              {/* Pelle */}
              <span
                aria-hidden
                className="absolute inset-0"
                style={{
                  background:
                    "radial-gradient(120% 80% at 30% 20%, #3a2b22 0%, #241a15 55%, #140d0a 100%)",
                  boxShadow:
                    "inset 0 2px 10px rgba(255,255,255,0.08), inset 0 -20px 60px rgba(0,0,0,0.6)",
                }}
              />
              {/* Costa più scura a sinistra */}
              <span
                aria-hidden
                className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-black/70 to-transparent"
              />
              {/* Immagine di copertina (se caricata), incorniciata dalla pelle */}
              {coverImage ? (
                <span className="absolute inset-6 overflow-hidden rounded-md ring-1 ring-white/10 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.8)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={coverImage}
                    alt={`Copertina del menù ${title}`}
                    draggable={false}
                    className="h-full w-full select-none object-cover [-webkit-user-drag:none]"
                  />
                </span>
              ) : (
                <span className="absolute inset-0 flex items-center justify-center p-8 text-center">
                  <span
                    className="text-2xl font-semibold uppercase tracking-[0.2em] text-[#e8d9b5] sm:text-3xl"
                    style={{ textShadow: "0 1px 2px rgba(0,0,0,0.6)" }}
                  >
                    {title}
                  </span>
                </span>
              )}
              {/* Cucitura dorata + brand */}
              <span
                aria-hidden
                className="absolute inset-3 rounded-md border border-dashed border-primary/40"
              />
              <span className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-[10px] font-medium uppercase tracking-widest text-white/85 backdrop-blur-sm">
                Tocca per aprire
              </span>
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {open && (
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
        >
          <X className="h-4 w-4" />
          Chiudi il menù
        </button>
      )}
    </div>
  );
}
