import Image from "next/image";
import Link from "next/link";
import { photoSrc } from "@/lib/utils";

interface MarqueeItem {
  id: string;
  raceNumber: string | null;
}

/**
 * Galleria marquee a scorrimento infinito.
 *
 * Performance: una sola animazione CSS (`animate-marquee`) trasla il
 * binario di -50%; la lista è duplicata, quindi al -50% il secondo blocco
 * è esattamente dove era il primo → loop senza salti, zero JS per frame.
 * In pausa all'hover. Rispetta prefers-reduced-motion (vedi globals.css).
 */
export function PhotoMarquee({ items }: { items: MarqueeItem[] }) {
  if (items.length === 0) return null;
  // Duplico per il loop continuo
  const track = [...items, ...items];

  return (
    <section
      aria-label="I nostri scatti"
      className="group relative overflow-hidden py-2"
    >
      {/* Sfumature laterali per un ingresso/uscita morbido */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-background to-transparent sm:w-32" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-background to-transparent sm:w-32" />

      <ul className="flex w-max animate-marquee gap-4 group-hover:[animation-play-state:paused]">
        {track.map((item, index) => (
          <li key={`${item.id}-${index}`} className="shrink-0">
            <Link
              href={`/foto/${item.id}`}
              aria-hidden={index >= items.length}
              tabIndex={index >= items.length ? -1 : undefined}
              className="relative block aspect-[3/2] h-40 overflow-hidden rounded-xl bg-muted ring-1 ring-border transition-all duration-500 hover:ring-primary/50 sm:h-52"
            >
              <Image
                unoptimized
                // Larghezza richiesta direttamente a /api/images (anteprima
                // piccola); unoptimized = niente ottimizzatore Vercel.
                src={`${photoSrc(item.id)}&w=640`}
                alt={item.raceNumber ? `Scatto #${item.raceNumber}` : "Scatto Lifeshot"}
                fill
                sizes="320px"
                className="object-cover"
              />
              {item.raceNumber && (
                <span className="absolute bottom-2 left-2 rounded-full bg-black/55 px-2 py-0.5 text-xs font-semibold text-white backdrop-blur-sm">
                  #{item.raceNumber}
                </span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
