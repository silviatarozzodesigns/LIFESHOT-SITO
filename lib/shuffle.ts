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
 * Riordina gli elementi in modo che due adiacenti non condividano la stessa
 * chiave, quando possibile. Strategia greedy "gruppo più numeroso diverso
 * dall'ultimo usato": è la regola che garantisce zero adiacenze uguali ogni
 * volta che la distribuzione lo consente (nessun soggetto supera la metà + 1).
 * Quando è impossibile (un soggetto domina), degrada raggruppando il minimo
 * indispensabile invece di fallire.
 *
 * L'input va già mischiato (vedi `shuffle`): l'ordine dentro ogni gruppo
 * resta casuale, l'interleave decide solo la sequenza tra gruppi diversi.
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

  const buckets = [...groups.entries()].map(([key, arr]) => ({ key, arr }));
  const result: T[] = [];
  let lastKey: string | null = null;

  while (result.length < items.length) {
    // Gruppo con più elementi rimasti, diverso dall'ultimo inserito.
    let pick: { key: string; arr: T[] } | null = null;
    for (const b of buckets) {
      if (!b.arr.length || b.key === lastKey) continue;
      if (!pick || b.arr.length > pick.arr.length) pick = b;
    }
    // Resta solo il gruppo dell'ultimo soggetto: adiacenza inevitabile.
    if (!pick) pick = buckets.find((b) => b.arr.length) ?? null;
    if (!pick) break;

    result.push(pick.arr.pop()!);
    lastKey = pick.key;
  }

  return result;
}
