"use client";

import Image from "next/image";
import { photoSrc } from "@/lib/utils";

/**
 * Immagine del dettaglio con protezioni anti-salvataggio: niente menu
 * contestuale, niente drag, niente "callout" del long-press su iOS. Un velo
 * trasparente sopra l'immagine intercetta il tocco prolungato, così il
 * browser non ha un <img> "sotto il dito" da offrire in salvataggio.
 *
 * Nota: sono deterrenti forti contro il salvataggio comune (tap-and-hold,
 * tasto destro, trascinamento), non una protezione assoluta — sul web
 * nessuna tecnica lo è. La difesa vera resta la filigrana impressa.
 */
export function ProtectedImage({
  id,
  alt,
  width,
  height,
}: {
  id: string;
  alt: string;
  width: number;
  height: number;
}) {
  return (
    <div
      className="relative select-none [-webkit-touch-callout:none]"
      onContextMenu={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
    >
      {/* Sempre la rotta watermark protetta, mai l'URL del bucket */}
      <Image
        unoptimized
        src={photoSrc(id)}
        alt={alt}
        width={width}
        height={height}
        priority
        draggable={false}
        sizes="(max-width: 1024px) 100vw, 70vw"
        className="pointer-events-none h-auto w-full select-none object-contain [-webkit-user-drag:none]"
      />
      {/* Velo trasparente: il long-press cade qui, non sull'immagine */}
      <span
        aria-hidden
        className="absolute inset-0 z-10 block [-webkit-touch-callout:none]"
      />
    </div>
  );
}
