"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
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

  // Badge: numero di gara se presente, altrimenti il nome del pilota.
  const badge = raceNumber ? `#${raceNumber}` : pilotName || null;

  return (
    <Link
      href={
        backTo ? `/foto/${id}?ritorno=${encodeURIComponent(backTo)}` : `/foto/${id}`
      }
      className={cn(
        "group block overflow-hidden rounded-2xl bg-muted",
        "ring-1 ring-transparent transition-[transform,box-shadow,border-color] duration-500 ease-out",
        "hover:-translate-y-1 hover:shadow-[0_20px_50px_-20px_rgba(0,0,0,0.7)] hover:ring-primary/50",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      )}
    >
      {/* Box con proporzione 3:2 FORZATA via inline style: non può essere
          rimossa dal purge di Tailwind e vincola sempre l'immagine, anche
          in hover (fix bug "card rettangolari"). */}
      <div
        className={cn(
          "relative w-full overflow-hidden",
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

        {/* Velo + badge (numero di gara o, in mancanza, nome pilota) on hover */}
        <div className="absolute inset-0 z-20 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
        {badge && (
          <span className="absolute bottom-3 left-3 z-30 max-w-[calc(100%-1.5rem)] truncate rounded-full bg-black/55 px-2.5 py-1 text-xs font-semibold tracking-wide text-white backdrop-blur-sm transition-colors duration-300 group-hover:bg-primary group-hover:text-primary-foreground">
            {badge}
          </span>
        )}
      </div>
    </Link>
  );
}
