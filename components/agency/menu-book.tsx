"use client";

import { useEffect, useRef, useState } from "react";
import HTMLFlipBook from "react-pageflip";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { PhotoDTO } from "@/lib/data/photos";
import { photoSrc } from "@/lib/utils";

/**
 * MENÙ SFOGLIABILE — libro realistico con fodera (materiale a scelta).
 *
 * Desktop: libro aperto a DUE pagine; mobile: una pagina alla volta. La
 * copertina è una pagina "dura" che si apre rigida e RESTA come anta sinistra
 * (non sparisce). Le pagine interne si sfogliano in modo morbido (curva) o
 * rigido, a scelta dell'admin. Il materiale della fodera (pelle, legno,
 * stoffa…) è un'immagine caricabile; senza, una pelle scura di default.
 *
 * Le dimensioni seguono l'aspetto reale della prima pagina (A4 → A4) e il
 * libro è limitato per stare intero nei vari dispositivi.
 */

interface FlipApi {
  pageFlip: () => { flipNext: () => void; flipPrev: () => void };
}

export function MenuBook({
  title,
  coverImage,
  materialImage,
  soft,
  pages,
}: {
  title: string;
  coverImage?: string;
  materialImage?: string;
  soft: boolean;
  pages: PhotoDTO[];
}) {
  const bookRef = useRef<FlipApi | null>(null);
  const [mounted, setMounted] = useState(false);
  const [page, setPage] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  // react-pageflip tocca il DOM: si monta solo lato client
  useEffect(() => setMounted(true), []);
  // Su mobile lo sfoglio è SOLO con le frecce (niente trascinamento col dito)
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  if (pages.length === 0) {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-dashed p-10 text-center text-sm text-muted-foreground">
        Il menù è in preparazione: carica le pagine dalla scheda del progetto.
      </div>
    );
  }

  // Aspetto pagina = prima immagine (fallback A4 verticale)
  const w = pages[0]?.width ?? 210;
  const h = pages[0]?.height ?? 297;
  const baseW = 480;
  const baseH = Math.round((baseW * h) / w);

  // Pelle di default (usata quando non c'è un'immagine di materiale): tono
  // caldo, riflesso in alto a sinistra, vignettatura scura e grana sottile.
  const leather = {
    backgroundColor: "#4a3626",
    backgroundImage: [
      "radial-gradient(115% 90% at 28% 15%, rgba(255,224,178,0.20), transparent 55%)",
      "radial-gradient(120% 110% at 72% 92%, rgba(0,0,0,0.55), transparent 60%)",
      "repeating-linear-gradient(48deg, rgba(0,0,0,0.05) 0 1px, transparent 1px 4px)",
      "linear-gradient(155deg, #5c4531 0%, #3d2c1d 55%, #241811 100%)",
    ].join(","),
    boxShadow:
      "inset 0 2px 14px rgba(255,235,200,0.10), inset 0 -34px 80px rgba(0,0,0,0.55)",
  };
  const material = materialImage
    ? {
        backgroundImage: `url(${materialImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }
    : leather;

  const density = soft ? "soft" : "hard";
  const total = pages.length + 2; // + copertina + retro

  const flip = (dir: 1 | -1) => {
    const api = bookRef.current?.pageFlip();
    if (!api) return;
    if (dir > 0) api.flipNext();
    else api.flipPrev();
  };

  if (!mounted) {
    return (
      <div
        className="mx-auto animate-pulse rounded-[10px] bg-muted"
        style={{ aspectRatio: `${w} / ${h}`, maxWidth: `calc(68vh * ${w} / ${h})` }}
      />
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Dimensione contenuta: su desktop il libro aperto (2 pagine, rapporto
          2w:h) non supera ~68vh d'altezza né ~900px, così non è gigante. */}
      <div
        className="relative mx-auto w-full drop-shadow-[0_30px_60px_rgba(0,0,0,0.55)]"
        style={{
          maxWidth: isMobile
            ? `min(94vw, calc(74vh * ${w} / ${h}))`
            : `min(92vw, 900px, calc(68vh * 2 * ${w} / ${h}))`,
        }}
      >
        {/* @ts-expect-error react-pageflip: tipi del wrapper non completi */}
        <HTMLFlipBook
          key={isMobile ? "mobile" : "desktop"}
          ref={bookRef}
          width={baseW}
          height={baseH}
          size="stretch"
          minWidth={260}
          maxWidth={1000}
          minHeight={Math.round((260 * h) / w)}
          maxHeight={1500}
          maxShadowOpacity={0.5}
          drawShadow
          showCover
          usePortrait
          mobileScrollSupport
          flippingTime={soft ? 800 : 550}
          useMouseEvents={!isMobile}
          disableFlipByClick={isMobile}
          className="mx-auto"
          style={{ margin: "0 auto" }}
          onFlip={(e: { data: number }) => setPage(e.data)}
        >
          {/* COPERTINA (dura): materiale + grafica copertina o titolo */}
          <div
            data-density="hard"
            className="relative h-full w-full overflow-hidden rounded-r-[10px]"
            style={material}
          >
            <div className="absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-black/60 to-transparent" />
            {coverImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={coverImage}
                alt={`Copertina del menù ${title}`}
                draggable={false}
                className="absolute inset-5 h-[calc(100%-2.5rem)] w-[calc(100%-2.5rem)] select-none rounded-md object-cover shadow-[0_10px_30px_-10px_rgba(0,0,0,0.8)] ring-1 ring-white/10 [-webkit-user-drag:none]"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center p-8 text-center">
                <span
                  className="text-2xl font-semibold uppercase tracking-[0.2em] text-[#e8d9b5] sm:text-3xl"
                  style={{ textShadow: "0 1px 2px rgba(0,0,0,0.6)" }}
                >
                  {title}
                </span>
              </div>
            )}
            <span className="pointer-events-none absolute inset-3 rounded-md border border-dashed border-primary/40" />
            <span className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-[10px] font-medium uppercase tracking-widest text-white/85 backdrop-blur-sm">
              Sfoglia il menù
            </span>
          </div>

          {/* PAGINE del menù */}
          {pages.map((p, i) => (
            <div
              key={p.id}
              data-density={density}
              className="relative h-full w-full overflow-hidden bg-[#f6f1e7]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photoSrc(p.id)}
                alt={`Pagina ${i + 1} del menù`}
                draggable={false}
                className="absolute inset-0 h-full w-full select-none object-contain [-webkit-user-drag:none]"
              />
              <span
                aria-hidden
                className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-black/15 to-transparent"
              />
            </div>
          ))}

          {/* RETRO (duro): solo materiale */}
          <div
            data-density="hard"
            className="relative h-full w-full overflow-hidden rounded-l-[10px]"
            style={material}
          >
            <div className="absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-black/60 to-transparent" />
            <span className="pointer-events-none absolute inset-3 rounded-md border border-dashed border-primary/30" />
          </div>
        </HTMLFlipBook>
      </div>

      {/* Frecce + contatore */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => flip(-1)}
          disabled={page === 0}
          aria-label="Pagina precedente"
          className="flex h-11 w-11 items-center justify-center rounded-full border bg-card text-foreground transition-colors hover:border-primary/50 hover:text-primary disabled:opacity-30"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <span className="min-w-16 text-center text-sm text-muted-foreground">
          {page + 1} / {total}
        </span>
        <button
          type="button"
          onClick={() => flip(1)}
          disabled={page >= total - 1}
          aria-label="Pagina successiva"
          className="flex h-11 w-11 items-center justify-center rounded-full border bg-card text-foreground transition-colors hover:border-primary/50 hover:text-primary disabled:opacity-30"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
