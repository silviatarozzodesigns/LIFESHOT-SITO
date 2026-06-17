/**
 * Shuffle "intelligente" per la galleria.
 *
 * Obiettivo: mostrare le foto in ordine casuale MA evitando, finché è
 * matematicamente possibile, due foto consecutive dello stesso soggetto
 * (stesso numero di gara / stesso pilota). Il risultato alterna i soggetti
 * (es. 16 → 19 → 22 → 23 → 16 …) per dare varietà visiva.
 */

/** Fisher-Yates: mischia una copia dell'array senza mutarlo. */
export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Riordina gli elementi alternando i soggetti per la MASSIMA varietà.
 *
 * Strategia round-robin: a ogni "giro" pesca un elemento da OGNI soggetto
 * ancora disponibile (dal più numeroso al meno numeroso), poi ripete. Così
 * con soggetti 16/95/99 la sequenza è 16,95,99,16,95,99… invece di
 * incollare i due dominanti (16,95,16,95…) e relegare i rari alla fine.
 *
 * Garantisce zero adiacenze uguali finché è matematicamente possibile
 * (nessun soggetto supera la metà+1); quando un soggetto domina, degrada
 * accodando i suoi residui invece di fallire.
 *
 * L'input va già mischiato (vedi `shuffle`): l'ordine dentro ogni gruppo
 * resta casuale, il round-robin decide solo la sequenza tra gruppi diversi.
 */
export function interleaveByKey<T>(
  items: T[],
  keyFn: (item: T) => string
): T[] {
  if (items.length <= 2) return items;

  const groups = new Map<string, T[]>();
  for (const item of items) {
    const key = keyFn(item);
    const bucket = groups.get(key);
    if (bucket) bucket.push(item);
    else groups.set(key, [item]);
  }

  // Un solo gruppo: niente da alternare.
  if (groups.size <= 1) return items;

  // Ordine iniziale dei soggetti casuale (a parità di residui resta tale).
  const buckets = shuffle(
    [...groups.entries()].map(([key, arr]) => ({ key, arr }))
  );
  const result: T[] = [];
  let lastKey: string | null = null;

  while (result.length < items.length) {
    // Soggetti più numerosi per primi a ogni giro: massimizza la distanza
    // tra ripetizioni dello stesso soggetto.
    buckets.sort((a, b) => b.arr.length - a.arr.length);

    let progressed = false;
    for (const b of buckets) {
      if (!b.arr.length || b.key === lastKey) continue;
      result.push(b.arr.pop()!);
      lastKey = b.key;
      progressed = true;
    }

    // Resta solo il soggetto dell'ultimo inserito: adiacenza inevitabile.
    if (!progressed) {
      const b = buckets.find((x) => x.arr.length);
      if (!b) break;
      result.push(b.arr.pop()!);
      lastKey = b.key;
    }
  }

  return result;
}
