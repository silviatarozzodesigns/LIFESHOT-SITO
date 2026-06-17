"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { matchesNoNumber } from "@/lib/tag-match";
import { cn, photoLoader, photoSrc } from "@/lib/utils";

interface PhotoCardProps {
  id: string;
  raceNumber: string | null;
  /** Nome pilota: mostrato sul badge come fallback se manca il numero */
  pilotName?: string | null;
  eventName?: string;
  /** Per il preload delle prime card above-the-fold */
  priority?: boolean;
  /** URL di ritorno passato al dettaglio (?ritorno=...) per il back contestuale */
  backTo?: string;
}

/**
 * Card della griglia foto: skeleton shimmer finché l'immagine carica,
 * filigrana visiva, zoom fluido in hover con accento giallo cinema.
 */
export function PhotoCard({
  id,
  raceNumber,
  pilotName,
  eventName,
  priority = false,
  backTo,
}: PhotoCardProps) {
  const [loaded, setLoaded] = useState(false);

  // Badge dell'anteprima:
  // - numero di gara reale → "#16"
  // - "senza numero" (S/N) → mostra la sigla E ANCHE il nome pilota, così
  //   la moto resta identificabile
  // - solo pilota → il nome
  const isNoNumber = raceNumber ? matchesNoNumber(raceNumber) : false;
  const badges: string[] =
    raceNumber && !isNoNumber
      ? [`#${raceNumber}`]
      : [
          ...(raceNumber ? [raceNumber] : []),
          ...(pilotName ? [pilotName] : []),
        ];

  return (
    <Link
      href={
        backTo ? `/foto/${id}?ritorno=${encodeURIComponent(backTo)}` : `/foto/${id}`
      }
      className={cn(
        "group block rounded-2xl bg-muted",
        "ring-1 ring-transparent transition-[transform,box-shadow,border-color] duration-500 ease-out",
        "hover:-translate-y-1 hover:shadow-[0_20px_50px_-20px_rgba(0,0,0,0.7)] hover:ring-primary/50",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      )}
    >
      {/* Box-clip con proporzione 3:2 (inline, non eliminabile dal purge).
          rounded-2xl + overflow-hidden QUI (sull'elemento che contiene davvero
          l'immagine) e translateZ(0)+isolate per forzare un layer di
          compositing proprio: così Safari/WebKit ritaglia anche l'immagine
          SCALATA in hover dentro gli angoli arrotondati (fix bug "rettangolo
          fuori dal frame in hover"). */}
      <div
        className={cn(
          "relative isolate w-full overflow-hidden rounded-2xl [transform:translateZ(0)]",
          !loaded && "skeleton"
        )}
        style={{ aspectRatio: "3 / 2" }}
      >
        {/* SEMPRE la rotta watermark protetta, mai l'URL diretto del bucket.
            absolute inset-0 + h-full/w-full + object-cover: l'immagine riempie
            il box 3:2 e non può mostrarsi alla dimensione naturale. */}
        <Image
          loader={photoLoader}
          src={photoSrc(id)}
          alt={eventName ? `Foto — ${eventName}` : "Foto Lifeshot"}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          priority={priority}
          onLoad={() => setLoaded(true)}
          className={cn(
            "absolute inset-0 h-full w-full object-cover transition-[opacity,transform] duration-700 [transition-timing-function:cubic-bezier(0.22,0.61,0.36,1)] group-hover:scale-[1.06]",
            loaded ? "opacity-100" : "opacity-0"
          )}
        />

        {/* Velo + badge (numero di gara, oppure S/N + pilota, oppure pilota) */}
        <div className="absolute inset-0 z-20 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
        {badges.length > 0 && (
          <div className="absolute bottom-3 left-3 z-30 flex max-w-[calc(100%-1.5rem)] flex-wrap gap-1.5">
            {badges.map((label) => (
              <span
                key={label}
                className="max-w-full truncate rounded-full bg-black/55 px-2.5 py-1 text-xs font-semibold tracking-wide text-white backdrop-blur-sm transition-colors duration-300 group-hover:bg-primary group-hover:text-primary-foreground"
              >
                {label}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
