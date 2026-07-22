"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Frecce di navigazione tra le foto dello stesso contesto (la sezione/i
 * filtri da cui si è aperto lo scatto). Oltre ai pulsanti: tasti freccia
 * sinistra/destra e swipe orizzontale su mobile. Le destinazioni sono già
 * calcolate lato server (prev/next dell'ordine del contesto).
 */
export function PhotoNav({
  prevHref,
  nextHref,
  index,
  total,
}: {
  prevHref: string | null;
  nextHref: string | null;
  index: number;
  total: number;
}) {
  const router = useRouter();
  const touchX = useRef<number | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" && prevHref) router.push(prevHref);
      if (e.key === "ArrowRight" && nextHref) router.push(nextHref);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [prevHref, nextHref, router]);

  useEffect(() => {
    const start = (e: TouchEvent) => {
      touchX.current = e.touches[0]?.clientX ?? null;
    };
    const end = (e: TouchEvent) => {
      if (touchX.current == null) return;
      const dx = (e.changedTouches[0]?.clientX ?? 0) - touchX.current;
      touchX.current = null;
      if (Math.abs(dx) < 60) return; // soglia: evita gli swipe involontari
      if (dx > 0 && prevHref) router.push(prevHref);
      if (dx < 0 && nextHref) router.push(nextHref);
    };
    window.addEventListener("touchstart", start, { passive: true });
    window.addEventListener("touchend", end, { passive: true });
    return () => {
      window.removeEventListener("touchstart", start);
      window.removeEventListener("touchend", end);
    };
  }, [prevHref, nextHref, router]);

  const arrowClass =
    "absolute top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-sm transition-all hover:bg-primary hover:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-95";

  return (
    <>
      {prevHref ? (
        <Link
          href={prevHref}
          aria-label="Foto precedente"
          scroll={false}
          className={cn(arrowClass, "left-3")}
        >
          <ChevronLeft className="h-6 w-6" />
        </Link>
      ) : null}
      {nextHref ? (
        <Link
          href={nextHref}
          aria-label="Foto successiva"
          scroll={false}
          className={cn(arrowClass, "right-3")}
        >
          <ChevronRight className="h-6 w-6" />
        </Link>
      ) : null}
      {index > 0 && total > 1 && (
        <span className="absolute bottom-3 left-1/2 z-20 -translate-x-1/2 rounded-full bg-black/55 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
          {index} / {total}
        </span>
      )}
    </>
  );
}
