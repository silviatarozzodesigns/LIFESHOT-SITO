import { ArrowLeft } from "lucide-react";
import { SiteHeader } from "@/components/site-header";

/**
 * Scheletro del dettaglio foto, mostrato istantaneamente durante la
 * navigazione mentre il server recupera la foto e ne genera l'anteprima.
 */
export default function PhotoLoading() {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main className="container flex-1 py-10 sm:py-14">
        <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
          <ArrowLeft className="h-4 w-4" />
          Torna alla galleria
        </span>

        <div className="mt-6 grid gap-10 lg:grid-cols-[1fr_360px]">
          {/* Immagine grande */}
          <div
            className="skeleton w-full rounded-2xl"
            style={{ aspectRatio: "3 / 2" }}
          />
          {/* Pannello info */}
          <aside className="space-y-4">
            <div className="skeleton h-8 w-2/3 rounded-lg" />
            <div className="skeleton h-5 w-1/2 rounded-lg" />
            <div className="skeleton h-32 w-full rounded-2xl" />
            <div className="skeleton h-12 w-full rounded-xl" />
          </aside>
        </div>
      </main>
    </div>
  );
}
