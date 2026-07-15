"use client";

import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * CURSORI DEI SERVIZI — l'animazione della hero agenzia.
 *
 * Cursori "vivi" stile presentazione Canva: ogni etichetta è un cursore
 * collaborativo che ENTRA dai bordi con una traiettoria curva, decelera
 * verso il punto, fa un piccolo overshoot con correzione (come una mano
 * vera sul mouse), "clicca" per posarsi e poi resta a vagare appena,
 * con micro-spostamenti irregolari invece di un ondeggiamento meccanico.
 *
 * La freccia del cursore è ORIENTATA VERSO IL CENTRO della hero, con
 * l'etichetta che pende dietro la punta come il name-tag di un utente.
 * Le posizioni finali (in % della hero) non toccano mai slogan e CTA.
 * Set separati: desktop (6 servizi) e touch/tablet+mobile (4 settori).
 * Rispetta prefers-reduced-motion.
 */

interface Chip {
  label: string;
  /** Punta del cursore (% della hero) */
  x: number;
  y: number;
  /** Lato dello schermo da cui entra */
  from: "left" | "right" | "top" | "bottom";
  delay: number;
}

const DESKTOP: Chip[] = [
  { label: "Siti web", x: 15, y: 26, from: "left", delay: 0.3 },
  { label: "Grafiche", x: 81, y: 21, from: "top", delay: 0.55 },
  { label: "Branding", x: 85, y: 55, from: "right", delay: 0.8 },
  { label: "Video", x: 12, y: 54, from: "left", delay: 1.05 },
  { label: "Social", x: 19, y: 79, from: "bottom", delay: 1.3 },
  { label: "Foto", x: 78, y: 82, from: "right", delay: 1.55 },
];

/** Tablet e mobile: i 4 settori dell'agenzia */
const TOUCH: Chip[] = [
  { label: "Grafiche", x: 25, y: 21, from: "left", delay: 0.3 },
  { label: "Social", x: 73, y: 27, from: "top", delay: 0.6 },
  { label: "Foto", x: 26, y: 78, from: "bottom", delay: 0.9 },
  { label: "Video", x: 71, y: 84, from: "right", delay: 1.2 },
];

/** Punto di partenza fuori campo per ogni lato d'ingresso */
const OFFSET: Record<Chip["from"], { x: number; y: number }> = {
  left: { x: -520, y: 90 },
  right: { x: 520, y: -90 },
  top: { x: 120, y: -420 },
  bottom: { x: -120, y: 420 },
};

/**
 * Freccia del cursore. Il path "punta" nativamente a ~30° (giù-destra);
 * il wrapper la ruota così che la punta guardi il centro della hero.
 * La punta del path è a (20.5, 11.5) e viene ancorata sul punto x/y del chip.
 */
function Pointer({ angle }: { angle: number }) {
  return (
    <div
      aria-hidden
      className="absolute left-0 top-0 h-0 w-0"
      style={{ transform: `rotate(${angle - 30}deg)` }}
    >
      <svg
        viewBox="0 0 24 24"
        className="absolute h-[20px] w-[20px] drop-shadow-[0_2px_6px_rgba(0,0,0,0.5)]"
        style={{ left: -20.5 * (20 / 24), top: -11.5 * (20 / 24) }}
      >
        <path
          d="M5 2.5 L20.5 11.5 L12.6 13.2 L8.9 20.5 Z"
          fill="hsl(var(--primary))"
          stroke="hsl(var(--primary-foreground) / 0.35)"
          strokeWidth="1"
        />
      </svg>
    </div>
  );
}

function CursorChip({ chip, index }: { chip: Chip; index: number }) {
  const reduced = useReducedMotion();
  const off = OFFSET[chip.from];

  // Direzione dal chip verso il centro della hero → orientamento freccia
  const dx = 50 - chip.x;
  const dy = 50 - chip.y;
  const dLen = Math.hypot(dx, dy) || 1;
  const ux = dx / dLen;
  const uy = dy / dLen;
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

  // Direzione di viaggio (dal fuori-campo verso il punto) per curva e overshoot
  const oLen = Math.hypot(off.x, off.y) || 1;
  const tx = -off.x / oLen;
  const ty = -off.y / oLen;
  // Curvatura laterale della traiettoria (alterna il verso per varietà)
  const bow = (34 + index * 9) * (index % 2 === 0 ? 1 : -1);
  const bowX = -ty * bow;
  const bowY = tx * bow;
  // Overshoot oltre il bersaglio, poi correzione all'indietro
  const ovX = tx * 22;
  const ovY = ty * 22;

  const travel = 1.15 + index * 0.06;

  return (
    <div
      className="absolute"
      style={{ left: `${chip.x}%`, top: `${chip.y}%` }}
    >
      {/* VIAGGIO — traiettoria curva, decelerazione, overshoot + correzione */}
      <motion.div
        initial={reduced ? false : { x: off.x, y: off.y, opacity: 0 }}
        animate={
          reduced
            ? { opacity: 1 }
            : {
                x: [off.x, off.x * 0.42 + bowX, ovX, ovX * -0.3, 0],
                y: [off.y, off.y * 0.42 + bowY, ovY, ovY * -0.3, 0],
                opacity: [0, 1, 1, 1, 1],
              }
        }
        transition={{
          delay: chip.delay,
          duration: travel,
          times: [0, 0.42, 0.72, 0.88, 1],
          ease: ["easeOut", "easeOut", "easeInOut", "easeOut"],
          opacity: { delay: chip.delay, duration: travel * 0.3 },
        }}
      >
        {/* CLICK — piccola pressione quando il cursore "si posa" */}
        <motion.div
          animate={reduced ? undefined : { scale: [1, 0.88, 1] }}
          transition={{
            delay: chip.delay + travel + 0.12,
            duration: 0.3,
            times: [0, 0.4, 1],
            ease: "easeOut",
          }}
        >
          {/* IDLE — micro-vagabondaggio irregolare, mai la stessa ampiezza */}
          <motion.div
            animate={
              reduced
                ? undefined
                : {
                    x: [0, 5, -3, 6, -2, 0],
                    y: [0, -4, 3, -2, 4, 0],
                  }
            }
            transition={{
              repeat: Infinity,
              duration: 9 + index * 1.3,
              times: [0, 0.18, 0.42, 0.61, 0.83, 1],
              ease: "easeInOut",
              delay: chip.delay + travel + 0.9,
              repeatDelay: 0.4,
            }}
            className="relative"
          >
            <Pointer angle={angle} />
            {/* Etichetta dietro la punta, spinta via dal centro (si auto-scala
                sulla propria misura grazie alle percentuali di translate) */}
            <span
              className="absolute left-0 top-0 inline-block whitespace-nowrap rounded-full border border-border/70 bg-background/60 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground/90 shadow-[0_10px_35px_-12px_rgba(0,0,0,0.65)] backdrop-blur-md sm:text-xs"
              style={{
                transform: `translate(calc(-50% + ${(-ux * 68).toFixed(1)}%), calc(-50% + ${(-uy * 80).toFixed(1)}%))`,
              }}
            >
              {chip.label}
            </span>
          </motion.div>
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
        "pointer-events-none absolute inset-0 z-[5] transition-opacity duration-700",
        // Con le slide fotografiche i cursori diventano un sussurro
        dim ? "opacity-25" : "opacity-100"
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
