/**
 * PLACEHOLDER — Watermark (filigrana) sulle anteprime.
 *
 * Strategia attuale: filigrana VISIVA lato client. Il componente
 * `components/gallery/watermark-overlay.tsx` sovrappone il marchio Lifeshot
 * alle anteprime nella griglia e nella vista dettaglio.
 *
 * Evoluzione prevista (da implementare qui): generare in fase di upload una
 * versione "preview" dell'immagine con watermark impresso nei pixel (es. con
 * `sharp`), salvando su storage sia l'originale pulito (venduto dopo
 * l'acquisto) sia la preview filigranata (mostrata pubblicamente).
 */

export interface WatermarkOptions {
  /** Testo della filigrana (default: brand Lifeshot) */
  text?: string;
  /** Opacità 0–1 */
  opacity?: number;
}

/**
 * Applica il watermark a un'immagine. PLACEHOLDER: oggi restituisce il buffer
 * invariato; la filigrana è gestita visivamente dal componente overlay.
 */
export async function applyWatermark(
  imageBuffer: Buffer,
  _options: WatermarkOptions = {}
): Promise<Buffer> {
  // TODO: implementare con sharp — comporre logo/testo semitrasparente
  // ripetuto in diagonale sull'immagine ridimensionata per il web.
  return imageBuffer;
}
