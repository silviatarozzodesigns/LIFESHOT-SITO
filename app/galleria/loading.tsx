import { SiteHeader } from "@/components/site-header";

/**
 * Schermata "scheletro" mostrata ISTANTANEAMENTE durante la navigazione verso
 * la galleria, mentre il server prepara i dati. Stessa struttura della pagina
 * reale (titolo, filtri, griglia 3:2) così il passaggio è senza scatti.
 */
export default function GalleryLoading() {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main className="container flex-1 py-12 sm:py-16">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          Galleria
        </h1>
        <p className="mt-3 max-w-xl text-muted-foreground">
          Seleziona il tuo evento, poi cerca per numero di gara o nome pilota.
        </p>

        {/* Filtri */}
        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          <div className="skeleton h-11 rounded-xl" />
          <div className="skeleton h-11 rounded-xl" />
          <div className="skeleton h-11 rounded-xl" />
        </div>

        {/* Griglia foto */}
        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="skeleton rounded-2xl"
              style={{ aspectRatio: "3 / 2" }}
            />
          ))}
        </div>
      </main>
    </div>
  );
}
