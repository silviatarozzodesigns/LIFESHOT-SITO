import { cn } from "@/lib/utils";

/**
 * PLACEHOLDER — Filigrana visiva sulle anteprime.
 *
 * Sovrappone il marchio Lifeshot ripetuto in diagonale sopra le immagini
 * della galleria, per scoraggiare il salvataggio delle anteprime.
 * Quando il watermark verrà impresso nei pixel in fase di upload
 * (vedi lib/watermark.ts), questo overlay potrà essere rimosso.
 */
export function WatermarkOverlay({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 z-10 select-none overflow-hidden",
        className
      )}
    >
      <div className="absolute inset-[-50%] flex rotate-[-30deg] flex-col justify-around opacity-[0.16]">
        {Array.from({ length: 6 }).map((_, row) => (
          <p
            key={row}
            className="whitespace-nowrap text-2xl font-bold tracking-[0.4em] text-white"
            style={{ marginLeft: row % 2 ? "-4rem" : "0" }}
          >
            {"LIFESHOT © ".repeat(12)}
          </p>
        ))}
      </div>
    </div>
  );
}
