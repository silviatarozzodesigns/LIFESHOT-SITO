"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  FileImage,
  Hash,
  Instagram,
  MapPin,
  Sparkles,
  User,
} from "lucide-react";
import { site } from "@/lib/site";
import { CopyCodeButton } from "@/components/gallery/copy-code-button";
import type { PhotoDTO } from "@/lib/data/photos";
import { cn, formatDate, photoSrc } from "@/lib/utils";

/**
 * Visore del dettaglio foto: scorre prev/next SUL POSTO, senza cambiare rotta
 * (niente refresh). Cambia l'immagine con un'animazione di slide, aggiorna il
 * pannello con i metadati della foto (in cache o via /api/photos/<id>) e
 * sincronizza l'URL con history.replaceState — così condivisione e refresh
 * restano coerenti, ma la navigazione è istantanea.
 *
 * Anti-salvataggio: niente drag, niente menu contestuale, niente callout del
 * long-press su iOS (velo trasparente sopra l'immagine). Deterrente forte,
 * non assoluto: la difesa vera è la filigrana impressa.
 */
export function PhotoViewer({
  initial,
  ids,
  ctx,
  ritorno,
}: {
  initial: PhotoDTO;
  ids: string[];
  ctx?: string;
  ritorno?: string;
}) {
  const startIndex = ids.indexOf(initial.id);
  const [index, setIndex] = useState(startIndex);
  const [direction, setDirection] = useState(0);
  const [cache, setCache] = useState<Record<string, PhotoDTO>>({
    [initial.id]: initial,
  });
  const fetching = useRef<Set<string>>(new Set());
  const swipeX = useRef<number | null>(null);

  const currentId = index >= 0 ? ids[index] : initial.id;
  const current = cache[currentId] ?? (currentId === initial.id ? initial : null);

  const hasPrev = index > 0;
  const hasNext = index >= 0 && index < ids.length - 1;

  // Carica (una volta) i metadati di una foto non ancora in cache
  const ensure = useCallback(
    async (id: string) => {
      if (cache[id] || fetching.current.has(id)) return;
      fetching.current.add(id);
      try {
        const res = await fetch(`/api/photos/${id}`);
        const data = await res.json().catch(() => null);
        if (data?.ok) setCache((c) => ({ ...c, [id]: data.photo }));
      } catch {
        // rete assente: si riproverà al prossimo passaggio
      } finally {
        fetching.current.delete(id);
      }
    },
    [cache]
  );

  const go = useCallback(
    (delta: 1 | -1) => {
      if (index < 0) return;
      const next = index + delta;
      if (next < 0 || next >= ids.length) return;
      setDirection(delta);
      setIndex(next);
    },
    [index, ids.length]
  );

  // URL in sincronia con la foto mostrata, senza navigazione di rotta
  useEffect(() => {
    if (index < 0) return;
    const params = new URLSearchParams();
    if (ritorno) params.set("ritorno", ritorno);
    if (ctx) params.set("ctx", ctx);
    const q = params.toString();
    window.history.replaceState(
      window.history.state,
      "",
      `/foto/${currentId}${q ? `?${q}` : ""}`
    );
  }, [currentId, index, ctx, ritorno]);

  // Precarica immagine + metadati dei vicini: così i passi sono istantanei
  useEffect(() => {
    if (index < 0) return;
    [index - 1, index + 1].forEach((i) => {
      const id = ids[i];
      if (!id) return;
      const img = new Image();
      img.src = photoSrc(id);
      ensure(id);
    });
  }, [index, ids, ensure]);

  // Tasti freccia
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  const isShowcase =
    current?.event?.category === "ristorazione" ||
    current?.event?.category === "business";

  const aspect =
    current?.width && current?.height
      ? `${current.width} / ${current.height}`
      : "3 / 2";

  const arrowClass =
    "absolute top-1/2 z-30 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-sm transition-all hover:bg-primary hover:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-95 disabled:pointer-events-none disabled:opacity-0";

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
      {/* Immagine con filigrana, slide animata e frecce */}
      <div
        className="relative select-none overflow-hidden rounded-2xl bg-muted [-webkit-touch-callout:none]"
        style={{ aspectRatio: aspect }}
        onContextMenu={(e) => e.preventDefault()}
        onDragStart={(e) => e.preventDefault()}
        onTouchStart={(e) => {
          swipeX.current = e.touches[0]?.clientX ?? null;
        }}
        onTouchEnd={(e) => {
          if (swipeX.current == null) return;
          const dx = (e.changedTouches[0]?.clientX ?? 0) - swipeX.current;
          swipeX.current = null;
          if (Math.abs(dx) < 60) return;
          go(dx > 0 ? -1 : 1);
        }}
      >
        <AnimatePresence initial={false} custom={direction}>
          <motion.img
            key={currentId}
            src={photoSrc(currentId)}
            alt={current?.event ? `Foto — ${current.event.name}` : "Foto Lifeshot"}
            custom={direction}
            variants={{
              enter: (d: number) => ({ x: d >= 0 ? "100%" : "-100%", opacity: 0 }),
              center: { x: 0, opacity: 1 },
              exit: (d: number) => ({ x: d >= 0 ? "-100%" : "100%", opacity: 0 }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.32, ease: [0.22, 0.61, 0.36, 1] }}
            draggable={false}
            className="pointer-events-none absolute inset-0 h-full w-full select-none object-contain [-webkit-user-drag:none]"
          />
        </AnimatePresence>

        {/* Velo trasparente: il long-press cade qui, non sull'immagine */}
        <span aria-hidden className="absolute inset-0 z-20 block" />

        {ids.length > 1 && index >= 0 && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              disabled={!hasPrev}
              aria-label="Foto precedente"
              className={cn(arrowClass, "left-3")}
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              disabled={!hasNext}
              aria-label="Foto successiva"
              className={cn(arrowClass, "right-3")}
            >
              <ChevronRight className="h-6 w-6" />
            </button>
            <span className="absolute bottom-3 left-1/2 z-30 -translate-x-1/2 rounded-full bg-black/55 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
              {index + 1} / {ids.length}
            </span>
          </>
        )}
      </div>

      {/* Pannello informazioni + azione */}
      <aside className="lg:sticky lg:top-24">
        <div className="rounded-2xl border bg-card p-6">
          {current ? (
            <>
              {current.raceNumbers.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {current.raceNumbers.map((n) => (
                    <span
                      key={n}
                      className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-3 py-1 text-sm font-semibold text-primary"
                    >
                      <Hash className="h-3.5 w-3.5" />
                      {n}
                    </span>
                  ))}
                </div>
              )}

              <h1 className="mt-4 text-2xl font-semibold tracking-tight">
                {current.event?.name ?? "Foto Lifeshot"}
              </h1>

              <dl className="mt-4 space-y-2 text-sm text-muted-foreground">
                {current.pilotNames.length > 0 && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 shrink-0" />
                    <dd>{current.pilotNames.join(", ")}</dd>
                  </div>
                )}
                {current.event?.date && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 shrink-0" />
                    <dd>{formatDate(current.event.date)}</dd>
                  </div>
                )}
                {current.event?.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 shrink-0" />
                    <dd>{current.event.location}</dd>
                  </div>
                )}
              </dl>

              {isShowcase ? (
                <>
                  <div className="my-6 border-t" />
                  <p className="text-sm text-muted-foreground">
                    Ti piace questo scatto? Realizziamo servizi fotografici su
                    misura per la tua attività.
                  </p>
                  <Link
                    href="/contatti"
                    className="group mt-5 inline-flex h-auto min-h-12 w-full items-center justify-center gap-3 whitespace-nowrap rounded-2xl bg-primary px-5 py-3 text-center text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:scale-[1.02] hover:shadow-primary/40 active:scale-95"
                  >
                    <Sparkles className="h-5 w-5 shrink-0 transition-transform group-hover:rotate-[8deg]" />
                    Richiedi questo servizio
                  </Link>
                </>
              ) : (
                <>
                  <div className="mt-5 rounded-xl border border-dashed bg-background/50 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        <FileImage className="h-3.5 w-3.5" />
                        Codice scatto
                      </p>
                      <CopyCodeButton code={current.originalFilename} />
                    </div>
                    <p className="mt-1 break-all font-mono text-sm text-foreground">
                      {current.originalFilename}
                    </p>
                  </div>

                  <div className="my-6 border-t" />

                  <p className="text-sm text-muted-foreground">
                    Original ad alta risoluzione, senza filigrana. Scrivici in DM
                    con il codice qui sopra per riceverlo.
                  </p>

                  <a
                    href={site.instagramDmUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group mt-5 inline-flex h-auto min-h-12 w-full items-center justify-center gap-5 whitespace-nowrap rounded-2xl bg-primary px-5 py-3 text-center text-sm font-semibold leading-snug text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:scale-[1.02] hover:shadow-primary/40 active:scale-95"
                  >
                    <Instagram className="h-6 w-6 shrink-0 transition-transform group-hover:rotate-[8deg]" />
                    <span className="leading-tight text-center">
                      Scrivici in DM per<br /> acquistare le tue foto
                    </span>
                  </a>
                </>
              )}
            </>
          ) : (
            <div className="space-y-3">
              <div className="skeleton h-7 w-2/3 rounded-md" />
              <div className="skeleton h-4 w-1/2 rounded-md" />
              <div className="skeleton h-24 w-full rounded-xl" />
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
