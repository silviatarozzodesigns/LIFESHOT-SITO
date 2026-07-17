/**
 * Indirizzi della galleria — un solo posto che li costruisce, così filtri,
 * paginazione, link e sitemap non possono divergere.
 *
 * L'evento è un PEZZO DI PERCORSO, non un parametro: `/galleria/gara-2026`
 * invece di `/galleria?evento=gara-2026`. Un pilota cerca su Google "foto
 * <nome gara>", e una pagina con un indirizzo e un titolo propri può
 * rispondere a quella ricerca; un parametro no.
 *
 * Numero e pilota restano parametri: sono un filtro dentro l'evento, non
 * una pagina a sé (e non ha senso indicizzare "#45").
 */
export function galleryHref({
  evento,
  numero,
  pilota,
  pagina,
}: {
  evento?: string;
  numero?: string;
  pilota?: string;
  pagina?: number;
} = {}): string {
  const base = evento ? `/galleria/${encodeURIComponent(evento)}` : "/galleria";
  const params = new URLSearchParams();
  if (numero?.trim()) params.set("numero", numero.trim());
  if (pilota?.trim()) params.set("pilota", pilota.trim());
  if (pagina && pagina > 1) params.set("pagina", String(pagina));
  const query = params.toString();
  return query ? `${base}?${query}` : base;
}
