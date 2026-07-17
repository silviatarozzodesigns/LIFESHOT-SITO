import { NextResponse, type NextRequest } from "next/server";

/**
 * Vecchio indirizzo della galleria filtrata (`/galleria?evento=gara-2026`)
 * → pagina dell'evento (`/galleria/gara-2026`), con rimando PERMANENTE.
 *
 * Perché qui e non dentro la pagina: `app/galleria/loading.tsx` fa partire
 * la risposta in streaming con stato 200, quindi un redirect chiesto dal
 * codice della pagina può solo essere eseguito via JavaScript — per Google
 * vale molto meno di un 308 vero. Il middleware invece risponde prima di
 * qualsiasi rendering.
 *
 * Perché non `redirects()` in next.config: lì `evento` resterebbe attaccato
 * anche alla destinazione (`/galleria/gara-2026?evento=gara-2026`), cioè un
 * doppione dello stesso contenuto. Qui l'indirizzo si costruisce pulito,
 * tenendo però numero, pilota e pagina: i link già condivisi in DM o su
 * WhatsApp continuano a portare esattamente dove portavano prima.
 */
export function middleware(request: NextRequest) {
  const evento = request.nextUrl.searchParams.get("evento");
  if (!evento) return;

  const url = request.nextUrl.clone();
  url.pathname = `/galleria/${evento}`;
  url.searchParams.delete("evento");
  return NextResponse.redirect(url, 308);
}

// Solo la galleria: il middleware non deve pesare su tutto il resto
export const config = { matcher: "/galleria" };
