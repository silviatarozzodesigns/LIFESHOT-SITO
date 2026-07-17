import { ImageOff, Instagram } from "lucide-react";
import { GalleryFilters } from "@/components/gallery/filters";
import { PhotoCard } from "@/components/gallery/photo-card";
import { GalleryPagination } from "@/components/gallery/pagination";
import { FadeIn } from "@/components/motion/fade-in";
import { buttonVariants } from "@/components/ui/button";
import { getEventsForFilter } from "@/lib/data/events";
import { searchPhotos } from "@/lib/data/photos";
import { galleryHref } from "@/lib/gallery-url";
import { site } from "@/lib/site";
import { cn } from "@/lib/utils";

/**
 * La galleria: filtri, griglia, paginazione e i due vuoti (senza risultati
 * con filtri attivi → rimando ai DM; senza foto del tutto → attesa).
 *
 * Vista UNICA per /galleria (ricerca generale) e /galleria/<evento> (la
 * pagina dell'evento, con indirizzo e titolo propri per Google): cambia
 * solo l'intestazione, che arriva da fuori.
 */
export async function GalleryView({
  evento = "",
  numero = "",
  pilota = "",
  page = 1,
  intestazione,
}: {
  evento?: string;
  numero?: string;
  pilota?: string;
  page?: number;
  /** Titolo e sottotitolo della pagina che ospita la galleria */
  intestazione: React.ReactNode;
}) {
  const [events, result] = await Promise.all([
    getEventsForFilter(),
    searchPhotos({ eventSlug: evento, raceNumber: numero, pilotName: pilota, page }),
  ]);

  const hasFilters = Boolean(evento || numero || pilota);
  // Ritorno dal dettaglio foto: riporta esattamente dov'eri, filtri compresi
  const galleryReturn = galleryHref({ evento, numero, pilota, pagina: page });

  return (
    <>
      <FadeIn>{intestazione}</FadeIn>

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
                <FadeIn key={photo.id} delay={Math.min(index * 0.02, 0.12)}>
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
              filtri={{ evento, numero, pilota }}
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
              Scrivici in DM su Instagram: abbiamo migliaia di scatti inediti
              che non sono ancora online.
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
    </>
  );
}
