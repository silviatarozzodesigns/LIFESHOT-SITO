"use client";

import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * CURSORI DEI SERVIZI — l'animazione della hero agenzia.
 *
 * Piccole etichette-pillola con un puntatore (stile cursore condiviso dei
 * tool di design) che ENTRANO ANIMATE DAI BORDI dello schermo e si fermano
 * negli spazi vuoti attorno allo slogan, una alla volta. Poi restano a
 * "galleggiare" appena, come cursori vivi.
 *
 * Il puntatore è ancorato all'angolo della pillola rivolto verso il centro
 * della hero e RUOTATO in modo da puntare il centro (come i cursori
 * collaborativi dei mockup di design).
 *
 * Le posizioni finali sono in percentuale della hero, scelte per non
 * toccare mai slogan e CTA; le pillole sono HTML → mai deformate. Set
 * separati desktop (6 servizi) e touch/tablet+mobile (4 settori).
 * Rispetta prefers-reduced-motion.
 */

interface Chip {
  label: string;
  /** Posizione finale (% della hero, riferita al centro della pillola) */
  x: number;
  y: number;
  /** Lato dello schermo da cui entra */
  from: "left" | "right" | "top" | "bottom";
  delay: number;
}

const DESKTOP: Chip[] = [
  { label: "Siti web", x: 13, y: 24, from: "left", delay: 0.3 },
  { label: "Grafiche", x: 82, y: 20, from: "top", delay: 0.65 },
  { label: "Branding", x: 86, y: 55, from: "right", delay: 1.0 },
  { label: "Video", x: 10, y: 52, from: "left", delay: 1.35 },
  { label: "Social", x: 17, y: 78, from: "bottom", delay: 1.7 },
  { label: "Foto", x: 79, y: 81, from: "right", delay: 2.05 },
];

/** Tablet e mobile: i 4 settori dell'agenzia */
const TOUCH: Chip[] = [
  { label: "Grafiche", x: 24, y: 22, from: "left", delay: 0.3 },
  { label: "Social", x: 72, y: 22, from: "right", delay: 0.65 },
  { label: "Foto", x: 26, y: 77, from: "left", delay: 1.0 },
  { label: "Video", x: 70, y: 84, from: "bottom", delay: 1.35 },
];

/** Punto di partenza fuori campo per ogni lato d'ingresso */
const OFFSET: Record<Chip["from"], { x: number; y: number }> = {
  left: { x: -480, y: 60 },
  right: { x: 480, y: -60 },
  top: { x: 80, y: -380 },
  bottom: { x: -80, y: 380 },
};

/**
 * Puntatore stile cursore (freccia piena, giallo brand): sta sull'angolo
 * della pillola rivolto verso il centro della hero e viene ruotato per
 * puntarlo davvero. Il glifo del path punta nativamente a ~30° (giù-destra).
 */
function Pointer({ chip }: { chip: Chip }) {
  const angle =
    (Math.atan2(50 - chip.y, 50 - chip.x) * 180) / Math.PI;
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className={cn(
        "absolute h-[18px] w-[18px] drop-shadow-[0_2px_6px_rgba(0,0,0,0.5)]",
        chip.x < 50 ? "-right-2.5" : "-left-2.5",
        chip.y < 50 ? "-bottom-3" : "-top-3"
      )}
      style={{ transform: `rotate(${Math.round(angle - 30)}deg)` }}
    >
      <path
        d="M5 2.5 L20.5 11.5 L12.6 13.2 L8.9 20.5 Z"
        fill="hsl(var(--primary))"
        stroke="hsl(var(--primary-foreground) / 0.35)"
        strokeWidth="1"
      />
    </svg>
  );
}

function CursorChip({ chip, index }: { chip: Chip; index: number }) {
  const reduced = useReducedMotion();
  const off = OFFSET[chip.from];

  return (
    <div
      className="absolute -translate-x-1/2 -translate-y-1/2"
      style={{ left: `${chip.x}%`, top: `${chip.y}%` }}
    >
      <motion.div
        initial={reduced ? false : { x: off.x, y: off.y, opacity: 0 }}
        animate={{ x: 0, y: 0, opacity: 1 }}
        transition={{
          delay: chip.delay,
          type: "spring",
          stiffness: 50,
          damping: 14,
          opacity: { delay: chip.delay, duration: 0.4 },
        }}
      >
        {/* Galleggiamento lento una volta arrivata */}
        <motion.div
          animate={reduced ? undefined : { y: [0, -7, 0] }}
          transition={{
            repeat: Infinity,
            duration: 5 + index * 0.8,
            ease: "easeInOut",
            delay: chip.delay + 1.2,
          }}
          className="relative"
        >
          <Pointer chip={chip} />
          <span className="inline-block whitespace-nowrap rounded-full border border-border/70 bg-background/60 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground/90 shadow-[0_10px_35px_-12px_rgba(0,0,0,0.65)] backdrop-blur-md sm:text-xs">
            {chip.label}
          </span>
        </motion.div>
      </motion.div>
    </div>
  );
}

export function ServiceCursors({ dim = false }: { dim?: boolean }) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 z-[5] transition-opacity duration-700 opacity-100"
      )}
    >
      <div className="hidden lg:block">
        {DESKTOP.map((chip, i) => (
          <CursorChip key={chip.label} chip={chip} index={i} />
        ))}
      </div>
      <div className="lg:hidden">
        {TOUCH.map((chip, i) => (
          <CursorChip key={chip.label} chip={chip} index={i} />
        ))}
      </div>
    </div>
  );
}
