import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { Calendar, MapPin } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { GalleryView } from "@/components/gallery/gallery-view";
import { getEventByAnySlug } from "@/lib/data/events";
import { galleryHref } from "@/lib/gallery-url";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ evento: string }>;
  searchParams: Promise<{ numero?: string; pilota?: string; pagina?: string }>;
}

/**
 * Le foto di un evento vivono qui, con un indirizzo e un titolo propri:
 * `/galleria/internazionali-italia-2026`. È la pagina che risponde a chi
 * cerca "foto <nome gara>" su Google — prima era un parametro della
 * galleria, che Google non sa distinguere né mostrare nei risultati.
 * Solo motorsport: i progetti di ristorazione e business hanno le loro.
 */
async function eventoPubblicato(slug: string) {
  const found = await getEventByAnySlug(slug);
  if (!found || found.event.category !== "motorsport") return null;
  return found; // { event, redirect: null | slug-nuovo }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { evento } = await params;
  const found = await eventoPubblicato(evento);
  if (!found) return {};
  const { event } = found;

  const dove = event.location ? ` a ${event.location}` : "";
  const quando = event.date ? ` del ${formatDate(event.date)}` : "";
  return {
    title: { absolute: `Foto ${event.name} · Lifeshot` },
    description: `Le foto di ${event.name}${dove}${quando}: cerca i tuoi scatti per numero di gara o nome pilota e richiedili in alta risoluzione.`,
    openGraph: {
      title: `Foto ${event.name} · Lifeshot`,
      description: `Cerca i tuoi scatti di ${event.name} per numero di gara o nome pilota.`,
      ...(event.coverImage ? { images: [event.coverImage] } : {}),
    },
  };
}

export default async function EventoGalleryPage({ params, searchParams }: Props) {
  const { evento } = await params;
  const { numero = "", pilota = "", pagina } = await searchParams;
  const page = Math.max(1, Number(pagina) || 1);

  const found = await eventoPubblicato(evento);
  if (!found) notFound();
  const { event, redirect } = found;

  // Slug in pensione (evento rinominato) → rimando permanente al nuovo
  // indirizzo, tenendo i filtri: i vecchi link e i risultati Google non
  // muoiono e Google sposta il valore sulla pagina nuova.
  if (redirect) {
    permanentRedirect(
      galleryHref({ evento: redirect, numero, pilota, pagina: page })
    );
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />

      <main className="container flex-1 py-12 sm:py-16">
        <GalleryView
          evento={evento}
          numero={numero}
          pilota={pilota}
          page={page}
          intestazione={
            <>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
                Evento
              </p>
              {/* Il nome dell'evento come titolo della pagina: è la parola
                  che le persone cercano davvero */}
              <h1 className="mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">
                {event.name}
              </h1>
              <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-muted-foreground">
                {event.date && (
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" />
                    {formatDate(event.date)}
                  </span>
                )}
                {event.location && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-4 w-4" />
                    {event.location}
                  </span>
                )}
              </div>
              <p className="mt-3 max-w-xl text-muted-foreground">
                Cerca i tuoi scatti per numero di gara o nome pilota — anche
                insieme.
              </p>
            </>
          }
        />
      </main>

      <SiteFooter />
    </div>
  );
}
