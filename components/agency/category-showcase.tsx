"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Camera,
  ChevronDown,
} from "lucide-react";
import { EditableText } from "@/components/cms/editable-text";
import { EditableImage } from "@/components/cms/editable-image";
import type { PageSlug, TextStyle } from "@/lib/content";
import { site } from "@/lib/site";
import { cn, photoLoader, photoSrc } from "@/lib/utils";

export type ShowcaseMedia =
  | { kind: "photo"; id: string; raceNumber: string | null }
  | { kind: "url"; src: string };

export interface ShowcaseCategory {
  id: string;
  title: string;
  description: string;
  titleStyle?: TextStyle;
  descriptionStyle?: TextStyle;
  /** Pagina dedicata (es. /motorsport). Senza href → CTA "Richiedi info" */
  href?: string;
  linkLabel?: string;
  media: ShowcaseMedia[];
  /** Pagina CMS delle immagini galleria (chip upload in edit mode) */
  imagePage?: PageSlug;
  /** Chiavi immagine CMS della galleria (chip upload in edit mode) */
  imageKeys?: string[];
}

/**
 * Bordo inferiore della navbar fissa (viewport), per non finirci sotto.
 * Se risulta fuori schermo il `fixed` è momentaneamente neutralizzato
 * (l'animazione d'ingresso pagina applica un filter → containing block):
 * in quel caso vale l'altezza nominale della capsula.
 */
function navBottom(): number {
  const rect = document.querySelector("header")?.getBoundingClientRect();
  return rect && rect.bottom > 0 ? rect.bottom : 88;
}

/**
 * CATEGORIE A ESPANSIONE.
 *
 * DESKTOP (puntatore fine): guidata dalla posizione. Scorrendo, la categoria
 * la cui intestazione è più vicina al "fuoco" del viewport si espande e le
 * altre si richiudono.
 *
 * TOUCH (mobile/tablet): comanda il TOCCO. L'espansione da scroll qui è
 * inservibile — mentre scorri l'apertura sposta il contenuto, lo scroll
 * ricalcola e l'animazione singhiozza; per giunta la card finiva in un punto
 * qualsiasi, spesso sotto la navbar fissa. Al tap la card si apre e si
 * CENTRA nello spazio libero sotto la navbar, con lo scroll animato in
 * parallelo all'espansione (un solo movimento, niente rincorse).
 *
 * Dentro: galleria sfogliabile + descrizione.
 */
export function CategoryShowcase({
  categories,
}: {
  categories: ShowcaseCategory[];
}) {
  const heads = useRef<Array<HTMLDivElement | null>>([]);
  const articles = useRef<Array<HTMLElement | null>>([]);
  const panels = useRef<Array<HTMLDivElement | null>>([]);
  const [active, setActive] = useState(0);
  const [touch, setTouch] = useState(false);
  const raf = useRef<number | null>(null);

  // Su touch/schermi piccoli l'espansione la comanda il tap, non lo scroll
  useEffect(() => {
    const mq = window.matchMedia("(pointer: coarse), (max-width: 1023px)");
    const update = () => setTouch(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (touch) return; // niente scroll-driven su touch
    const compute = () => {
      raf.current = null;
      const target = window.innerHeight * 0.4;
      const dists = heads.current.map((el) => {
        if (!el) return Infinity;
        const r = el.getBoundingClientRect();
        return Math.abs(r.top + r.height / 2 - target);
      });
      // ISTERESI: un'altra categoria "vince" solo se batte l'attiva con un
      // margine netto. Senza, l'espansione sposta le intestazioni e lo
      // scroll-anchoring di Chrome compensa → loop apri/chiudi infinito.
      setActive((prev) => {
        let best = prev;
        let bestDist = dists[prev] ?? Infinity;
        dists.forEach((d, i) => {
          if (d + 80 < bestDist) {
            best = i;
            bestDist = d;
          }
        });
        return best;
      });
    };
    const onScroll = () => {
      if (raf.current == null) raf.current = requestAnimationFrame(compute);
    };
    compute();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf.current != null) cancelAnimationFrame(raf.current);
    };
  }, [touch]);

  /**
   * Apre la categoria i e la porta al centro dello spazio libero.
   *
   * L'altezza finale del pannello si conosce PRIMA di animare (il contenuto
   * è già montato, solo ritagliato da overflow-hidden → scrollHeight), così
   * lo scroll parte subito insieme all'apertura invece di inseguirla.
   */
  function open(i: number) {
    const prev = active;
    setActive(i);
    if (i === prev) return;

    requestAnimationFrame(() => {
      const article = articles.current[i];
      if (!article) return;
      const rect = article.getBoundingClientRect();
      const panelH = panels.current[i]?.scrollHeight ?? 0;
      // Se la card aperta sta SOPRA, chiudendosi accorcia la pagina: la card
      // toccata salirà di tanto quanto il pannello che si chiude.
      const shift =
        prev < i ? (panels.current[prev]?.scrollHeight ?? 0) : 0;

      const top = navBottom();
      const free = window.innerHeight - top - 16;
      const cardH = rect.height + panelH; // rect: card ancora chiusa
      // Ci sta tutta → centrata; troppo alta → intestazione subito sotto la nav
      const targetTop = top + (cardH < free ? (free - cardH) / 2 : 12);

      window.scrollTo({
        top: window.scrollY + (rect.top - targetTop) - shift,
        behavior: "smooth",
      });
    });
  }

  return (
    // overflow-anchor: none → lo scroll anchoring non compensa le
    // espansioni/chiusure (altrimenti litiga con l'attivazione da scroll)
    <div className="space-y-4" style={{ overflowAnchor: "none" }}>
      {categories.map((cat, i) => {
        const isActive = i === active;
        // const locale → il narrowing di TS sopravvive dentro il JSX annidato
        const imagePage = cat.imagePage;
        return (
          <article
            key={cat.id}
            ref={(el) => {
              articles.current[i] = el;
            }}
            className={cn(
              "overflow-hidden rounded-3xl border bg-card transition-colors duration-500",
              isActive && "border-primary/40"
            )}
          >
            {/* Intestazione: su touch è il comando d'apertura, su desktop
                guida lo stato ma resta comunque cliccabile */}
            <div
              ref={(el) => {
                heads.current[i] = el;
              }}
              role="button"
              tabIndex={0}
              aria-expanded={isActive}
              onClick={() => open(i)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  open(i);
                }
              }}
              className="flex cursor-pointer items-center justify-between gap-4 p-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:p-8"
            >
              <div className="flex min-w-0 items-baseline gap-4 sm:gap-6">
                <span
                  className={cn(
                    "text-sm font-semibold tabular-nums transition-colors duration-500",
                    isActive ? "text-primary" : "text-muted-foreground/60"
                  )}
                >
                  0{i + 1}
                </span>
                <h3
                  className={cn(
                    "truncate text-2xl font-semibold tracking-tight transition-colors duration-500 sm:text-4xl",
                    !isActive && "text-muted-foreground"
                  )}
                >
                  <EditableText
                    page="agenzia"
                    k={`cat.${cat.id}.title`}
                    value={cat.title}
                    maxLength={40}
                    style={cat.titleStyle}
                  />
                </h3>
              </div>
              <ChevronDown
                className={cn(
                  "h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-500",
                  isActive && "rotate-180 text-primary"
                )}
                aria-hidden
              />
            </div>

            {/* Pannello espandibile */}
            <motion.div
              initial={false}
              animate={{
                height: isActive ? "auto" : 0,
                opacity: isActive ? 1 : 0,
              }}
              transition={{ duration: 0.45, ease: [0.22, 0.61, 0.36, 1] }}
              className="overflow-hidden"
            >
              <div
                ref={(el) => {
                  panels.current[i] = el;
                }}
                className="grid gap-6 p-6 pt-0 sm:p-8 sm:pt-0 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:items-center"
              >
                <Gallery cat={cat} />
                <div>
                  <p className="text-muted-foreground">
                    <EditableText
                      page="agenzia"
                      k={`cat.${cat.id}.description`}
                      value={cat.description}
                      as="span"
                      maxLength={300}
                      style={cat.descriptionStyle}
                    />
                  </p>
                  {cat.href ? (
                    <Link
                      href={cat.href}
                      className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:scale-[1.03] hover:shadow-primary/40 active:scale-95"
                    >
                      {cat.linkLabel ?? "Scopri di più"}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  ) : (
                    <a
                      href={site.instagramDmUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-5 inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-medium transition-colors hover:border-primary/50 hover:text-primary"
                    >
                      Richiedi info
                      <ArrowUpRight className="h-4 w-4" />
                    </a>
                  )}
                  {/* Chip upload immagini galleria (solo admin in edit mode) */}
                  {imagePage && cat.imageKeys && cat.imageKeys.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {cat.imageKeys.map((k, n) => (
                        <EditableImage
                          key={k}
                          page={imagePage}
                          k={k}
                          label={`Lavoro ${n + 1}`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </article>
        );
      })}
    </div>
  );
}

/** Galleria orizzontale sfogliabile (swipe + frecce, scroll-snap nativo) */
function Gallery({ cat }: { cat: ShowcaseCategory }) {
  const scroller = useRef<HTMLDivElement>(null);

  const scrollBy = (dir: 1 | -1) => {
    const el = scroller.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.7, behavior: "smooth" });
  };

  if (cat.media.length === 0) {
    return (
      <div className="flex min-h-48 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed p-8 text-center sm:min-h-60">
        <Camera className="h-6 w-6 text-muted-foreground" aria-hidden />
        <p className="text-sm text-muted-foreground">
          La galleria di questa categoria sta arrivando.
        </p>
      </div>
    );
  }

  return (
    <div className="relative min-w-0">
      <div
        ref={scroller}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {cat.media.map((m, i) => (
          <div
            key={m.kind === "photo" ? m.id : `${cat.id}-${i}`}
            className="relative aspect-[4/3] h-44 shrink-0 snap-start overflow-hidden rounded-2xl bg-muted ring-1 ring-border sm:h-60"
          >
            {m.kind === "photo" ? (
              <Link
                href={`/foto/${m.id}?ritorno=%2F`}
                className="group absolute inset-0"
              >
                <Image
                  loader={photoLoader}
                  src={photoSrc(m.id)}
                  alt={
                    m.raceNumber ? `Scatto #${m.raceNumber}` : "Scatto Lifeshot"
                  }
                  fill
                  sizes="(max-width: 640px) 15rem, 20rem"
                  className="object-cover transition-transform duration-700 group-hover:scale-[1.05]"
                />
                {m.raceNumber && (
                  <span className="absolute bottom-2 left-2 rounded-full bg-black/55 px-2 py-0.5 text-xs font-semibold text-white backdrop-blur-sm">
                    #{m.raceNumber}
                  </span>
                )}
              </Link>
            ) : (
              <Image
                unoptimized
                src={m.src}
                alt=""
                fill
                sizes="(max-width: 640px) 15rem, 20rem"
                className="object-cover"
              />
            )}
          </div>
        ))}
      </div>

      {cat.media.length > 2 && (
        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            onClick={() => scrollBy(-1)}
            aria-label="Scorri indietro"
            className="flex h-9 w-9 items-center justify-center rounded-full border bg-background/70 transition-colors hover:border-primary/50 hover:text-primary active:scale-95"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => scrollBy(1)}
            aria-label="Scorri avanti"
            className="flex h-9 w-9 items-center justify-center rounded-full border bg-background/70 transition-colors hover:border-primary/50 hover:text-primary active:scale-95"
          >
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
