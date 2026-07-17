import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { GalleryView } from "@/components/gallery/gallery-view";

export const metadata: Metadata = {
  title: "Galleria",
  description:
    "Cerca le foto del tuo evento per numero di gara o nome pilota e acquista i tuoi scatti.",
};

// Le foto cambiano a ogni upload: render sempre a richiesta (serverless)
export const dynamic = "force-dynamic";

interface GalleryPageProps {
  searchParams: Promise<{ numero?: string; pilota?: string; pagina?: string }>;
}

/**
 * Ricerca generale su tutti gli eventi (l'indirizzo resta `/galleria`: il
 * gruppo fra parentesi non compare nell'URL).
 *
 * Il vecchio `?evento=...` non arriva mai qui: lo intercetta il middleware,
 * che rimanda alla pagina dell'evento prima di ogni rendering.
 */
export default async function GalleryPage({ searchParams }: GalleryPageProps) {
  const { numero = "", pilota = "", pagina } = await searchParams;
  const page = Math.max(1, Number(pagina) || 1);

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />

      <main className="container flex-1 py-12 sm:py-16">
        <GalleryView
          numero={numero}
          pilota={pilota}
          page={page}
          intestazione={
            <>
              <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
                Galleria
              </h1>
              <p className="mt-3 max-w-xl text-muted-foreground">
                Seleziona il tuo evento, poi cerca per numero di gara o nome
                pilota — anche insieme.
              </p>
            </>
          }
        />
      </main>

      <SiteFooter />
    </div>
  );
}
