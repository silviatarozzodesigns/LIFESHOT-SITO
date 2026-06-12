"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { WatermarkOverlay } from "@/components/gallery/watermark-overlay";
import { cn } from "@/lib/utils";

interface PhotoCardProps {
  id: string;
  url: string;
  raceNumber: string | null;
  eventName?: string;
  /** Per il preload delle prime card above-the-fold */
  priority?: boolean;
}

/**
 * Card della griglia foto: skeleton shimmer finché l'immagine carica,
 * filigrana visiva sovrapposta, micro-interazione hover, link al dettaglio.
 */
export function PhotoCard({
  id,
  url,
  raceNumber,
  eventName,
  priority = false,
}: PhotoCardProps) {
  const [loaded, setLoaded] = useState(false);

  return (
    <Link
      href={`/foto/${id}`}
      className={cn(
        "group relative block aspect-[3/2] overflow-hidden rounded-xl bg-muted",
        "transition-transform duration-300 ease-out hover:-translate-y-1",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        !loaded && "skeleton"
      )}
    >
      <Image
        src={url}
        alt={eventName ? `Foto — ${eventName}` : "Foto Lifeshot"}
        fill
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        priority={priority}
        onLoad={() => setLoaded(true)}
        className={cn(
          "object-cover transition-all duration-500 ease-out group-hover:scale-[1.04]",
          loaded ? "opacity-100" : "opacity-0"
        )}
      />

      <WatermarkOverlay />

      {/* Velo + badge numero di gara on hover */}
      <div className="absolute inset-0 z-20 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      {raceNumber && (
        <span className="absolute bottom-3 left-3 z-30 rounded-full bg-black/55 px-2.5 py-1 text-xs font-medium tracking-wide text-white backdrop-blur-sm">
          #{raceNumber}
        </span>
      )}
    </Link>
  );
}
