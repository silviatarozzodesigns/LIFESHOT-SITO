"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ServiceOverlay } from "@/components/agency/service-overlay";
import type { ServiceCopy } from "@/lib/content";
import {
  HERO_CHIPS_DESKTOP,
  HERO_CHIPS_TOUCH,
  SERVICES,
  type HeroChip,
  type ServiceId,
} from "@/lib/services";
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
 * Sono CLICCABILI: aprono l'overlay che spiega il servizio (le pillole hanno
 * forma di pulsante, la gente prova a toccarle → tanto vale rispondere).
 *
 * Le posizioni finali sono in percentuale della hero, scelte per non
 * toccare mai slogan e CTA; le pillole sono HTML → mai deformate. Set
 * separati desktop (6 servizi) e touch/tablet+mobile (4 settori: gli altri
 * si raggiungono da "Vedi anche" dentro l'overlay).
 * Rispetta prefers-reduced-motion.
 */

/** Punto di partenza fuori campo per ogni lato d'ingresso */
const OFFSET: Record<HeroChip["from"], { x: number; y: number }> = {
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
function Pointer({ chip }: { chip: HeroChip }) {
  const angle = (Math.atan2(50 - chip.y, 50 - chip.x) * 180) / Math.PI;
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className={cn(
        "pointer-events-none absolute h-[18px] w-[18px] drop-shadow-[0_2px_6px_rgba(0,0,0,0.5)]",
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

function CursorChip({
  chip,
  index,
  onOpen,
}: {
  chip: HeroChip;
  index: number;
  onOpen: (id: ServiceId) => void;
}) {
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
          <button
            type="button"
            onClick={() => onOpen(chip.id)}
            className="pointer-events-auto inline-block whitespace-nowrap rounded-full border border-border/70 bg-background/60 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground/90 shadow-[0_10px_35px_-12px_rgba(0,0,0,0.65)] backdrop-blur-md transition-all hover:border-primary/60 hover:bg-background/80 hover:text-primary active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:text-xs"
          >
            {SERVICES[chip.id].label}
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}

export function ServiceCursors({
  copy,
}: {
  /** Testi dei servizi dal CMS, per id */
  copy: Record<string, ServiceCopy>;
}) {
  const [openId, setOpenId] = useState<ServiceId | null>(null);

  return (
    <>
      <div
        className={cn(
          "pointer-events-none absolute inset-0 z-[5] transition-opacity duration-700 opacity-100"
        )}
      >
        <div className="hidden lg:block">
          {HERO_CHIPS_DESKTOP.map((chip, i) => (
            <CursorChip key={chip.id} chip={chip} index={i} onOpen={setOpenId} />
          ))}
        </div>
        <div className="lg:hidden">
          {HERO_CHIPS_TOUCH.map((chip, i) => (
            <CursorChip key={chip.id} chip={chip} index={i} onOpen={setOpenId} />
          ))}
        </div>
      </div>

      <ServiceOverlay
        openId={openId}
        copy={copy}
        onSelect={setOpenId}
        onClose={() => setOpenId(null)}
      />
    </>
  );
}
