"use client";

import { useEffect, useRef, useState } from "react";
import HTMLFlipBook from "react-pageflip";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { PhotoDTO } from "@/lib/data/photos";
import { photoSrc } from "@/lib/utils";

/**
 * MENÙ SFOGLIABILE PREMIUM.
 *
 * Il menù è "immerso" su un tavolo di legno con luce d'ambiente e ombra di
 * contatto: un contenitore che vende la grafica come un oggetto reale.
 * La fodera è pelle realistica del COLORE scelto dall'admin; se c'è
 * un'immagine di copertina (fronte) o di fondo (retro) riveste l'INTERA
 * faccia, non un riquadro. Desktop: due pagine; mobile: una pagina, solo
 * frecce. Le pagine sono le foto dell'evento, nell'ordine deciso a mano.
 */

const NOISE_SVG = `<svg xmlns='http://www.w3.org/2000/svg' width='140' height='140'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/></filter><rect width='100%' height='100%' filter='url(#n)'/></svg>`;
const NOISE = `data:image/svg+xml;utf8,${encodeURIComponent(NOISE_SVG)}`;

const WOOD: React.CSSProperties = {
  backgroundColor: "#2b1e14",
  backgroundImage: [
    "repeating-linear-gradient(90deg, rgba(0,0,0,0.34) 0 2px, rgba(255,255,255,0.02) 2px 3px, transparent 3px 190px)",
    "repeating-linear-gradient(0deg, rgba(255,225,180,0.02) 0 2px, transparent 2px 6px)",
    "radial-gradient(120% 95% at 50% 28%, #4c3624 0%, #2c1e13 55%, #160e08 100%)",
  ].join(","),
};

interface FlipApi {
  pageFlip: () => { flipNext: () => void; flipPrev: () => void };
}

/** Una faccia della fodera in pelle realistica, del colore indicato. */
function LeatherFace({
  color,
  rounded,
  children,
}: {
  color: string;
  rounded: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={`absolute inset-0 overflow-hidden ${rounded}`}
      style={{ backgroundColor: color }}
    >
      <span
        className="absolute inset-0"
        style={{
          backgroundImage: [
            "radial-gradient(120% 90% at 28% 12%, rgba(255,255,255,0.20), transparent 55%)",
            "linear-gradient(135deg, rgba(255,255,255,0.07) 0%, transparent 32%)",
            "radial-gradient(150% 135% at 50% 118%, rgba(0,0,0,0.50), transparent 60%)",
          ].join(","),
        }}
      />
      <span
        className="absolute inset-0 opacity-[0.22] mix-blend-overlay"
        style={{ backgroundImage: `url("${NOISE}")`, backgroundSize: "150px 150px" }}
      />
      <span
        className="pointer-events-none absolute inset-0"
        style={{
          boxShadow:
            "inset 0 2px 10px rgba(255,255,255,0.14), inset 0 -22px 52px rgba(0,0,0,0.42), inset 0 0 0 1px rgba(0,0,0,0.25)",
        }}
      />
      <span className="pointer-events-none absolute inset-[13px] rounded-lg border-[1.5px] border-dashed border-white/20" />
      {children}
    </div>
  );
}

export function MenuBook({
  title,
  coverImage,
  backImage,
  leatherColor,
  soft,
  pages,
}: {
  title: string;
  coverImage?: string;
  backImage?: string;
  leatherColor: string;
  soft: boolean;
  pages: PhotoDTO[];
}) {
  const bookRef = useRef<FlipApi | null>(null);
  const [mounted, setMounted] = useState(false);
  const [page, setPage] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => setMounted(true), []);
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

  const w = pages[0]?.width ?? 210;
  const h = pages[0]?.height ?? 297;
  const baseW = 480;
  const baseH = Math.round((baseW * h) / w);
  const total = pages.length + 2;

  const flip = (dir: 1 | -1) => {
    const api = bookRef.current?.pageFlip();
    if (!api) return;
    if (dir > 0) api.flipNext();
    else api.flipPrev();
  };

  const embossTitle = (
    <div className="absolute inset-0 flex items-center justify-center p-8 text-center">
      <span
        className="text-2xl font-semibold uppercase tracking-[0.18em] sm:text-3xl"
        style={{
          color: "#f2e6c8",
          textShadow:
            "0 1px 1px rgba(0,0,0,0.55), 0 -1px 0 rgba(255,255,255,0.10)",
        }}
      >
        {title}
      </span>
    </div>
  );

  const maxWidth = isMobile
    ? `min(98vw, calc(84vh * ${w} / ${h}))`
    : `min(92vw, 900px, calc(66vh * 2 * ${w} / ${h}))`;

  return (
    <div className="relative w-full overflow-hidden" style={WOOD}>
      {/* grana del legno */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.28] mix-blend-overlay"
        style={{ backgroundImage: `url("${NOISE}")`, backgroundSize: "240px 240px" }}
      />
      {/* luce d'ambiente calda dietro il menù */}
      <span
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[42%] h-[78%] w-[72%] -translate-x-1/2 -translate-y-1/2"
        style={{
          background:
            "radial-gradient(closest-side, rgba(255,214,160,0.20), rgba(255,214,160,0) 72%)",
        }}
      />

      <div className="relative mx-auto flex flex-col items-center gap-6 px-4 py-14 sm:py-20">
        <div
          className="relative mx-auto w-full drop-shadow-[0_28px_50px_rgba(0,0,0,0.6)]"
          style={{ maxWidth }}
        >
          {/* ombra di contatto sul tavolo */}
          <span
            aria-hidden
            className="pointer-events-none absolute -bottom-6 left-1/2 h-9 w-[88%] -translate-x-1/2 rounded-[50%] bg-black/60 blur-2xl"
          />

          {mounted && (
            <>
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
                maxShadowOpacity={0.6}
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
                {/* COPERTINA (fronte): immagine a tutta pagina o pelle */}
                <div data-density="hard" className="relative h-full w-full">
                  {coverImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={coverImage}
                      alt={`Copertina del menù ${title}`}
                      draggable={false}
                      className="absolute inset-0 h-full w-full select-none rounded-r-[10px] object-cover [-webkit-user-drag:none]"
                    />
                  ) : (
                    <LeatherFace color={leatherColor} rounded="rounded-r-[10px]">
                      {embossTitle}
                    </LeatherFace>
                  )}
                  <span className="pointer-events-none absolute inset-y-0 left-0 w-6 rounded-r-[10px] bg-gradient-to-r from-black/45 to-transparent" />
                </div>

                {/* PAGINE del menù */}
                {pages.map((p, i) => (
                  <div
                    key={p.id}
                    data-density={soft ? "soft" : "hard"}
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

                {/* RETRO (fondo): immagine a tutta pagina o pelle */}
                <div data-density="hard" className="relative h-full w-full">
                  {backImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={backImage}
                      alt={`Retro del menù ${title}`}
                      draggable={false}
                      className="absolute inset-0 h-full w-full select-none rounded-l-[10px] object-cover [-webkit-user-drag:none]"
                    />
                  ) : (
                    <LeatherFace color={leatherColor} rounded="rounded-l-[10px]" />
                  )}
                  <span className="pointer-events-none absolute inset-y-0 right-0 w-6 rounded-l-[10px] bg-gradient-to-l from-black/45 to-transparent" />
                </div>
              </HTMLFlipBook>
            </>
          )}
        </div>

        {/* Frecce + contatore */}
        <div className="relative flex items-center gap-4">
          <button
            type="button"
            onClick={() => flip(-1)}
            disabled={page === 0}
            aria-label="Pagina precedente"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-black/40 text-white backdrop-blur-sm transition-colors hover:border-primary/60 hover:text-primary disabled:opacity-25"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <span className="min-w-16 text-center text-sm text-white/70">
            {page + 1} / {total}
          </span>
          <button
            type="button"
            onClick={() => flip(1)}
            disabled={page >= total - 1}
            aria-label="Pagina successiva"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-black/40 text-white backdrop-blur-sm transition-colors hover:border-primary/60 hover:text-primary disabled:opacity-25"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
