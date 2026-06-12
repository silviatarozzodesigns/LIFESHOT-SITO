import type { Metadata } from "next";
import { ImageOff } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { GalleryFilters } from "@/components/gallery/filters";
import { PhotoCard } from "@/components/gallery/photo-card";
import { GalleryPagination } from "@/components/gallery/pagination";
import { FadeIn } from "@/components/motion/fade-in";
import { getEventsForFilter } from "@/lib/data/events";
import { searchPhotos } from "@/lib/data/photos";

export const metadata: Metadata = {
  title: "Galleria",
  description:
    "Cerca le foto del tuo evento per nome o numero di gara e acquista i tuoi scatti.",
};

// Le foto cambiano a ogni upload: render sempre a richiesta (serverless)
export const dynamic = "force-dynamic";

interface GalleryPageProps {
  searchParams: Promise<{
    evento?: string;
    numero?: string;
    pagina?: string;
  }>;
}

export default async function GalleryPage({ searchParams }: GalleryPageProps) {
  const { evento = "", numero = "", pagina } = await searchParams;
  const page = Math.max(1, Number(pagina) || 1);

  const [events, result] = await Promise.all([
    getEventsForFilter(),
    searchPhotos({ eventSlug: evento, raceNumber: numero, page }),
  ]);

  const hasFilters = Boolean(evento || numero);

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />

      <main className="container flex-1 py-12 sm:py-16">
        <FadeIn>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Galleria
          </h1>
          <p className="mt-3 max-w-xl text-muted-foreground">
            Seleziona il tuo evento e inserisci il numero di gara per trovare i
            tuoi scatti.
          </p>
        </FadeIn>

        <FadeIn delay={0.1} className="mt-8">
          <GalleryFilters
            events={events.map(({ slug, name }) => ({ slug, name }))}
            selectedEvent={evento}
            raceNumber={numero}
          />
        </FadeIn>

        <section className="mt-10">
          {result.photos.length > 0 ? (
            <>
              <p className="mb-4 text-sm text-muted-foreground">
                {result.total === 1
                  ? "1 foto trovata"
                  : `${result.total} foto trovate`}
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {result.photos.map((photo, index) => (
                  <FadeIn key={photo.id} delay={Math.min(index * 0.04, 0.4)}>
                    <PhotoCard
                      id={photo.id}
                      url={photo.url}
                      raceNumber={photo.raceNumber}
                      eventName={photo.event?.name}
                      priority={index < 4}
                    />
                  </FadeIn>
                ))}
              </div>
              <GalleryPagination
                page={result.page}
                totalPages={result.totalPages}
                searchParams={{ evento, numero }}
              />
            </>
          ) : (
            <FadeIn
              delay={0.15}
              className="flex flex-col items-center gap-4 rounded-2xl border border-dashed py-24 text-center"
            >
              <ImageOff className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="font-medium">
                  {hasFilters
                    ? "Nessuna foto trovata con questi filtri"
                    : "Nessuna foto ancora pubblicata"}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {hasFilters
                    ? "Prova a cambiare evento o a controllare il numero di gara."
                    : "Le foto degli eventi appariranno qui appena caricate."}
                </p>
              </div>
            </FadeIn>
          )}
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
