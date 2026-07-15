"use client";

import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * COSTELLAZIONE DEI SERVIZI — la linea sinuosa della hero agenzia.
 *
 * LA FORMA È QUELLA APPROVATA (la serpentina della prima demo): onde
 * morbide che entrano da destra, scendono accanto allo slogan, passano
 * sotto la CTA e risalgono verso sinistra. Qui è riprodotta con le sue
 * curve di Bézier ORIGINALI — non ridisegnata — quindi il carattere del
 * tratto è identico.
 *
 * Due accorgimenti la rendono corretta su ogni schermo:
 *  1. NIENTE DEFORMAZIONI — misuriamo la hero reale e disegniamo in pixel
 *     1:1: le etichette hanno sempre la loro grandezza naturale.
 *  2. ZONA PROTETTA — un "soffio" morbido (gaussiano, quindi la curva
 *     resta liscia) spinge la discesa a destra dello slogan e il tratto
 *     basso sotto la CTA quando lo schermo è piccolo; sugli schermi larghi
 *     la spinta tende a zero e la forma è quella pura.
 */

type Pt = [number, number];
interface Seg {
  c1: Pt;
  c2: Pt;
  a: Pt;
}
interface LabelDef {
  /** indice segmento (0-based) e posizione lungo di esso */
  seg: number;
  t: number;
  text: string;
  anchor?: "start" | "middle" | "end";
  dx?: number;
  dy?: number;
}
interface Shape {
  start: Pt;
  segs: Seg[];
  labels: LabelDef[];
}

const DRAW_MS = 7000;
const DELAY_MS = 600;
const FONT_PX = 12.5;

/** Serpentina desktop approvata (coordinate normalizzate 0–1). */
const DESKTOP: Shape = {
  start: [1.03, 0.153],
  segs: [
    { c1: [0.941, 0.117], c2: [0.919, 0.306], a: [0.838, 0.3] },
    { c1: [0.757, 0.294], c2: [0.765, 0.144], a: [0.706, 0.167] },
    { c1: [0.647, 0.189], c2: [0.699, 0.417], a: [0.688, 0.589] },
    { c1: [0.678, 0.761], c2: [0.618, 0.8], a: [0.532, 0.803] },
    { c1: [0.447, 0.806], c2: [0.424, 0.739], a: [0.356, 0.753] },
    { c1: [0.288, 0.767], c2: [0.288, 0.833], a: [0.218, 0.831] },
    { c1: [0.147, 0.828], c2: [0.125, 0.7], a: [0.056, 0.683] },
  ],
  labels: [
    { seg: 0, t: 1, text: "Siti web", dy: -18 },
    { seg: 1, t: 1, text: "Grafiche", dy: -20 },
    { seg: 2, t: 0.72, text: "Branding", anchor: "start", dx: 18, dy: 4 },
    { seg: 3, t: 1, text: "Social", dy: 26 },
    { seg: 4, t: 1, text: "Video", dy: 26 },
    { seg: 6, t: 1, text: "Foto", anchor: "start", dx: 10, dy: -14 },
  ],
};

/** Variante verticale (telefoni e tablet in verticale): stessa famiglia
    di onde — sopra lo slogan, giù lungo il bordo sinistro, sotto la CTA. */
const MOBILE: Shape = {
  start: [1.05, 0.1],
  segs: [
    { c1: [0.825, 0.064], c2: [0.825, 0.186], a: [0.6125, 0.169] },
    { c1: [0.4125, 0.153], c2: [0.4375, 0.064], a: [0.2375, 0.083] },
    { c1: [0.075, 0.097], c2: [0.035, 0.2], a: [0.04, 0.286] },
    { c1: [0.045, 0.371], c2: [0.02, 0.471], a: [0.04, 0.564] },
    { c1: [0.06, 0.664], c2: [0.2375, 0.721], a: [0.4375, 0.731] },
    { c1: [0.6375, 0.741], c2: [0.77, 0.779], a: [0.7875, 0.846] },
  ],
  labels: [
    { seg: 0, t: 1, text: "Siti web", dy: -16 },
    { seg: 2, t: 0.65, text: "Grafiche", anchor: "start", dx: 14, dy: 4 },
    { seg: 4, t: 1, text: "Social", dy: 24 },
    { seg: 5, t: 1, text: "Foto", dy: 24 },
  ],
};

const round1 = (n: number) => Math.round(n * 10) / 10;

/** Punto su una Bézier cubica */
function bezierAt(p0: Pt, c1: Pt, c2: Pt, p1: Pt, t: number): Pt {
  const u = 1 - t;
  const w0 = u * u * u;
  const w1 = 3 * u * u * t;
  const w2 = 3 * u * t * t;
  const w3 = t * t * t;
  return [
    w0 * p0[0] + w1 * c1[0] + w2 * c2[0] + w3 * p1[0],
    w0 * p0[1] + w1 * c1[1] + w2 * c2[1] + w3 * p1[1],
  ];
}

/**
 * Adattamento allo schermo SENZA toccare la forma:
 *
 * - la SEZIONE DESTRA (onda d'ingresso + discesa) viene traslata in blocco
 *   di `delta` px quando lo slogan ha bisogno di più aria — la sua
 *   geometria interna resta identica all'originale; lo spostamento viene
 *   assorbito dal segmento di raccordo verso il tratto basso, che è una
 *   Bézier e resta liscia per costruzione;
 * - il TRATTO BASSO scende di `dyBottom` px (in modo graduale, sigmoide)
 *   quando la CTA ha bisogno di più aria sotto.
 * Su schermi larghi delta e dyBottom tendono a zero → forma pura.
 */
function makeDesktopMap(w: number, h: number) {
  const cX = w / 2;
  const cY = h / 2;
  // Corridoio: la discesa (x nominale 0.688w) deve stare a destra dello
  // slogan; cap per non tagliare l'etichetta "Siti web" al bordo.
  const delta = Math.min(
    Math.max(0, cX + 365 - 0.688 * w),
    Math.max(0, w - 0.838 * w - 110)
  );
  // Tratto basso sotto la CTA; cap per non uscire dal fondo della hero
  const dyBottom = Math.max(
    0,
    Math.min(cY + 280 - 0.803 * h, 0.197 * h - 70)
  );
  return { delta, mapPt: pointMapper(w, h, cY, dyBottom) };
}

function makeMobileMap(w: number, h: number) {
  const cY = h / 2;
  const dyBottom = Math.max(
    0,
    Math.min(cY + 230 - 0.731 * h, 0.154 * h - 88)
  );
  return { delta: 0, mapPt: pointMapper(w, h, cY, dyBottom) };
}

/** Frazioni → pixel + discesa graduale del tratto basso */
function pointMapper(w: number, h: number, cY: number, dyBottom: number) {
  return ([nx, ny]: Pt, dx: number): Pt => {
    const x = nx * w + dx;
    const y0 = ny * h;
    const y = y0 + dyBottom / (1 + Math.exp(-(y0 - cY) / 80));
    return [x, y];
  };
}

/** Il delta orizzontale vale per l'onda d'ingresso e la discesa (segmenti
    0–2) e per il primo controllo del raccordo (segmento 3). */
function desktopDx(delta: number, segIdx: number, part: "c1" | "c2" | "a"): number {
  if (segIdx <= 2) return delta;
  if (segIdx === 3 && part === "c1") return delta;
  return 0;
}

interface Computed {
  d: string;
  labels: Array<{
    x: number;
    y: number;
    text: string;
    anchor: "start" | "middle" | "end";
    dx: number;
    dy: number;
    /** frazione di percorso: quando la penna ci passa, l'etichetta appare */
    f: number;
  }>;
}

function compute(shape: Shape, w: number, h: number, mobile: boolean): Computed {
  const { delta, mapPt } = mobile ? makeMobileMap(w, h) : makeDesktopMap(w, h);
  const dx = (segIdx: number, part: "c1" | "c2" | "a") =>
    mobile ? 0 : desktopDx(delta, segIdx, part);
  const start = mapPt(shape.start, mobile ? 0 : delta);
  const segs = shape.segs.map((s, i) => ({
    c1: mapPt(s.c1, dx(i, "c1")),
    c2: mapPt(s.c2, dx(i, "c2")),
    a: mapPt(s.a, dx(i, "a")),
  }));

  let d = `M ${round1(start[0])} ${round1(start[1])}`;
  for (const s of segs) {
    d += ` C ${round1(s.c1[0])} ${round1(s.c1[1])}, ${round1(s.c2[0])} ${round1(s.c2[1])}, ${round1(s.a[0])} ${round1(s.a[1])}`;
  }

  // Lunghezze approssimate (spezzata sugli ancoraggi) per il timing
  const anchors = [start, ...segs.map((s) => s.a)];
  const lens: number[] = [];
  for (let i = 1; i < anchors.length; i++) {
    lens.push(
      Math.hypot(anchors[i][0] - anchors[i - 1][0], anchors[i][1] - anchors[i - 1][1])
    );
  }
  const total = lens.reduce((a, b) => a + b, 0) || 1;

  const labels = shape.labels.map((l) => {
    const p0 = l.seg === 0 ? start : segs[l.seg - 1].a;
    const s = segs[l.seg];
    const [x, y] = bezierAt(p0, s.c1, s.c2, s.a, l.t);
    const before = lens.slice(0, l.seg).reduce((a, b) => a + b, 0);
    return {
      x,
      y,
      text: l.text,
      anchor: l.anchor ?? ("middle" as const),
      dx: l.dx ?? 0,
      dy: l.dy ?? 0,
      f: (before + lens[l.seg] * l.t) / total,
    };
  });

  return { d, labels };
}

export function Constellation({ dim = false }: { dim?: boolean }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const [visible, setVisible] = useState(0);
  const animated = useRef(false);

  // Misura la hero reale; reagisce solo a cambi significativi
  useLayoutEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const measure = () => {
      const r = el.getBoundingClientRect();
      setSize((prev) =>
        prev && Math.abs(prev.w - r.width) < 2 && Math.abs(prev.h - r.height) < 2
          ? prev
          : { w: Math.round(r.width), h: Math.round(r.height) }
      );
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const view = useMemo(() => {
    if (!size) return null;
    // Sotto i 1280px non c'è spazio a fianco dello slogan per la discesa:
    // meglio la variante verticale (bordo sinistro), elegante ovunque.
    const mobile = size.w < 1280;
    return compute(mobile ? MOBILE : DESKTOP, size.w, size.h, mobile);
  }, [size]);

  // La penna disegna UNA volta al primo layout; sui resize successivi
  // (o con "riduci animazioni") la linea appare già completa.
  useLayoutEffect(() => {
    const path = pathRef.current;
    if (!path || !view) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (animated.current || reduce) {
      path.style.transition = "none";
      path.style.strokeDasharray = "none";
      path.style.strokeDashoffset = "0";
      setVisible(view.labels.length);
      return;
    }
    animated.current = true;

    const L = path.getTotalLength();
    path.style.transition = "none";
    path.style.strokeDasharray = `${L}`;
    path.style.strokeDashoffset = `${L}`;
    void path.getBoundingClientRect();
    path.style.transition = `stroke-dashoffset ${DRAW_MS}ms cubic-bezier(0.45,0,0.25,1) ${DELAY_MS}ms`;
    path.style.strokeDashoffset = "0";

    const timers = view.labels.map((l, i) =>
      setTimeout(
        () => setVisible((v) => Math.max(v, i + 1)),
        DELAY_MS + DRAW_MS * l.f
      )
    );
    return () => {
      timers.forEach(clearTimeout);
    };
  }, [view]);

  return (
    <div
      ref={boxRef}
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 text-foreground transition-opacity duration-700",
        // Con le slide fotografiche la linea diventa un sussurro
        dim ? "opacity-[0.14]" : "opacity-[0.55]"
      )}
    >
      {size && view && (
        <svg
          width={size.w}
          height={size.h}
          viewBox={`0 0 ${size.w} ${size.h}`}
          className="absolute inset-0"
        >
          <path
            ref={pathRef}
            d={view.d}
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
          />
          {view.labels.map((l, i) => (
            <g
              key={l.text}
              style={{
                opacity: i < visible ? 1 : 0,
                transition: "opacity 900ms ease",
              }}
            >
              <circle cx={l.x} cy={l.y} r={3} fill="hsl(var(--primary))" />
              <text
                x={l.x + l.dx}
                y={l.y + l.dy}
                textAnchor={l.anchor}
                fill="currentColor"
                fontSize={FONT_PX}
                fontWeight={500}
                letterSpacing="0.16em"
                className="uppercase"
              >
                {l.text}
              </text>
            </g>
          ))}
        </svg>
      )}
    </div>
  );
}
