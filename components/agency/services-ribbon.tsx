/**
 * NASTRO SERVIZI — marquee orizzontale a rallentatore che elenca tutti i
 * servizi dell'agenzia subito sotto la hero. Le voci arrivano dal CMS
 * (campo unico separato da "·"). Stessa tecnica del PhotoMarquee: lista
 * duplicata + translateX(-50%) in loop, pausa all'hover, rispetta
 * prefers-reduced-motion (globals.css).
 */
export function ServicesRibbon({ items }: { items: string }) {
  const list = items
    .split("·")
    .map((s) => s.trim())
    .filter(Boolean);
  if (list.length === 0) return null;

  const track = [...list, ...list];

  return (
    <section
      aria-label="I nostri servizi"
      className="group relative overflow-hidden border-y border-border/40 py-5"
      style={{ "--marquee-duration": "60s" } as React.CSSProperties}
    >
      {/* Sfumature laterali per un ingresso/uscita morbido */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-background to-transparent sm:w-32" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-background to-transparent sm:w-32" />

      <ul className="flex w-max animate-marquee items-center group-hover:[animation-play-state:paused]">
        {track.map((item, index) => (
          <li
            key={`${item}-${index}`}
            aria-hidden={index >= list.length}
            className="flex shrink-0 items-center"
          >
            <span className="px-6 text-sm font-semibold uppercase tracking-[0.3em] text-muted-foreground sm:px-8 sm:text-base">
              {item}
            </span>
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary/80" />
          </li>
        ))}
      </ul>
    </section>
  );
}
