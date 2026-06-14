import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Versione del watermark: incrementala per forzare la CDN a rigenerare TUTTE
 * le preview (la cache è `immutable`, quindi senza un cambio di URL le foto
 * già servite resterebbero con la filigrana vecchia).
 */
export const WATERMARK_VERSION = "3";

/** URL della preview filigranata di una foto (con cache-bust del watermark). */
export function photoSrc(id: string): string {
  return `/api/images/${id}?v=${WATERMARK_VERSION}`;
}

/** Formatta una data in italiano (es. "12 giugno 2026") */
export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("it-IT", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}
