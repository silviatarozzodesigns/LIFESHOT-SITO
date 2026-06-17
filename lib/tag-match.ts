/**
 * Helper PURI (nessuna dipendenza server) per il match dei tag foto.
 * Condivisi tra la ricerca pubblica (lib/data/photos.ts, lato Mongo) e il
 * filtro della dashboard admin (client, lato JS), così "senza numero" / "S/N"
 * si comporta allo stesso modo ovunque.
 */

/**
 * Riconosce la sigla "senza numero" anche dentro un testo più lungo
 * (es. tipo moto + sigla: "KTM S/N", "Husqvarna SN"). I confini
 * `(^|[^a-z0-9])…([^a-z0-9]|$)` evitano falsi positivi ("snake", "USN").
 */
export const NO_NUMBER_REGEX =
  /(^|[^a-z0-9])(s[\s./_-]*n|senza\s*numero)([^a-z0-9]|$)/i;

/** Firma normalizzata: minuscolo, senza spazi/punteggiatura. "S/N" → "sn". */
export function noNumberSignature(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/** True se la query digitata indica "senza numero" (S/N, SN, senza numero…). */
export function isNoNumberQuery(value: string): boolean {
  const sig = noNumberSignature(value);
  return sig === "sn" || sig === "senzanumero";
}

/** True se un singolo tag rappresenta una moto senza numero. */
export function matchesNoNumber(tag: string): boolean {
  return NO_NUMBER_REGEX.test(tag);
}

/**
 * Filtro client per la griglia admin: una foto matcha se la query corrisponde
 * a un numero di gara, un pilota o il nome file. "senza numero"/"S/N" matcha
 * i tag relativi (anche dentro testi tipo "KTM S/N").
 */
export function photoMatchesQuery(
  photo: {
    raceNumbers: string[];
    pilotNames: string[];
    originalFilename: string;
  },
  query: string
): boolean {
  const q = query.trim();
  if (!q) return true;
  if (isNoNumberQuery(q)) {
    return (
      photo.raceNumbers.some(matchesNoNumber) ||
      photo.pilotNames.some(matchesNoNumber)
    );
  }
  const lower = q.toLowerCase();
  return [...photo.raceNumbers, ...photo.pilotNames, photo.originalFilename].some(
    (v) => v.toLowerCase().includes(lower)
  );
}
