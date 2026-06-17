import type { Metadata } from "next";
import { ImageOff, Instagram } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { GalleryFilters } from "@/components/gallery/filters";
import { PhotoCard } from "@/components/gallery/photo-card";
import { GalleryPagination } from "@/components/gallery/pagination";
import { FadeIn } from "@/components/motion/fade-in";
import { buttonVariants } from "@/components/ui/button";
import { getEventsForFilter } from "@/lib/data/events";
import { searchPhotos } from "@/lib/data/photos";
import { site } from "@/lib/site";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Galleria",
  description:
    "Cerca le foto del tuo evento per numero di gara o nome pilota e acquista i tuoi scatti.",
};

// Le foto cambiano a ogni upload: render sempre a richiesta (serverless)
export const dynamic = "force-dynamic";

interface GalleryPageProps {
  searchParams: Promise<{
    evento?: string;
    numero?: string;
    pilota?: string;
    pagina?: string;
  }>;
}

export default async function GalleryPage({ searchParams }: GalleryPageProps) {
  const { evento = "", numero = "", pilota = "", pagina } = await searchParams;
  const page = Math.max(1, Number(pagina) || 1);

  const [events, result] = await Promise.all([
    getEventsForFilter(),
    searchPhotos({
      eventSlug: evento,
      raceNumber: numero,
      pilotName: pilota,
      page,
    }),
  ]);

  const hasFilters = Boolean(evento || numero || pilota);

  // URL di ritorno per il dettaglio: include SOLO i filtri attivi.
  // Senza filtri → "/galleria" pulito, così il back resta non filtrato (punto 5).
  const returnParams = new URLSearchParams();
  if (evento) returnParams.set("evento", evento);
  if (numero) returnParams.set("numero", numero);
  if (pilota) returnParams.set("pilota", pilota);
  if (page > 1) returnParams.set("pagina", String(page));
  const galleryReturn = `/galleria${returnParams.size ? `?${returnParams}` : ""}`;

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />

      <main className="container flex-1 py-12 sm:py-16">
        <FadeIn>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Galleria
          </h1>
          <p className="mt-3 max-w-xl text-muted-foreground">
            Seleziona il tuo evento, poi cerca per numero di gara o nome
            pilota — anche insieme.
          </p>
        </FadeIn>

        <FadeIn delay={0.1} className="mt-8">
          <GalleryFilters
            events={events.map(({ slug, name }) => ({ slug, name }))}
            selectedEvent={evento}
            raceNumber={numero}
            pilotName={pilota}
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
                      raceNumber={photo.raceNumber}
                      pilotName={photo.pilotName}
                      eventName={photo.event?.name}
                      priority={index < 4}
                      backTo={galleryReturn}
                    />
                  </FadeIn>
                ))}
              </div>
              <GalleryPagination
                page={result.page}
                totalPages={result.totalPages}
                searchParams={{ evento, numero, pilota }}
              />
            </>
          ) : hasFilters ? (
            /* Fallback Instagram: zero risultati con filtri attivi */
            <FadeIn
              delay={0.15}
              className="relative overflow-hidden rounded-3xl border bg-card px-6 py-16 text-center sm:px-12"
            >
              <div
                aria-hidden
                className="glow-primary pointer-events-none absolute left-1/2 top-[-60%] h-[28rem] w-[40rem] -translate-x-1/2"
              />
              <Instagram className="mx-auto h-10 w-10 text-primary" />
              <h2 className="mx-auto mt-6 max-w-xl text-balance text-2xl font-semibold tracking-tight sm:text-3xl">
                Non trovi il tuo numero in pista?
              </h2>
              <p className="mx-auto mt-3 max-w-md text-balance text-muted-foreground">
                Scrivici in DM su Instagram: abbiamo migliaia di scatti
                inediti che non sono ancora online.
              </p>
              <a
                href={site.instagramDmUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(buttonVariants({ size: "lg" }), "mt-8")}
              >
                <Instagram />
                Scrivici in DM su Instagram
              </a>
            </FadeIn>
          ) : (
            <FadeIn
              delay={0.15}
              className="flex flex-col items-center gap-4 rounded-2xl border border-dashed py-24 text-center"
            >
              <ImageOff className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="font-medium">Nessuna foto ancora pubblicata</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Le foto degli eventi appariranno qui appena caricate.
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
