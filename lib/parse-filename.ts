/**
 * Workflow "Nome File → Numero di Gara".
 *
 * Estrae il numero di gara dal nome del file caricato, così l'upload bulk
 * tagga automaticamente ogni foto su MongoDB.
 *
 * Convenzione supportata: `<qualsiasi>_<numeroGara>_<progressivo>.<ext>`
 *   "evento_45_01.jpg"        → "45"
 *   "granfondo_045_123.jpg"   → "045"
 * Fallback: se c'è un solo numero nel nome ("IMG_45.jpg") usa quello.
 * Se non viene trovato nessun numero, la foto resta senza tag (null) e
 * potrà essere taggata manualmente dalla dashboard.
 */
export function extractRaceNumber(filename: string): string | null {
  // Rimuove estensione e path
  const base = filename.split("/").pop()!.replace(/\.[^.]+$/, "");

  const segments = base.split(/[_\-\s]+/).filter(Boolean);
  const numericSegments = segments.filter((s) => /^\d+$/.test(s));

  // Caso standard "evento_45_01": penultimo segmento numerico = numero di gara
  if (numericSegments.length >= 2) {
    return numericSegments[numericSegments.length - 2];
  }

  // Un solo numero nel nome: lo usiamo come numero di gara
  if (numericSegments.length === 1) {
    return numericSegments[0];
  }

  return null;
}

/** Genera una chiave storage sicura e univoca per la foto */
export function buildStorageKey(eventSlug: string, filename: string): string {
  const ext = filename.includes(".") ? filename.split(".").pop() : "jpg";
  const safeName = filename
    .replace(/\.[^.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  const unique = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  return `events/${eventSlug}/${safeName}-${unique}.${ext}`;
}

/** Slug URL-friendly dal nome evento */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // rimuove accenti
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
}
