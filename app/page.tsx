import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Calendar, Camera, MapPin, Search } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { FadeIn } from "@/components/motion/fade-in";
import { getRecentEvents } from "@/lib/data/events";
import { formatDate } from "@/lib/utils";

// Gli eventi recenti arrivano dal database: render a richiesta
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const events = await getRecentEvents(6);

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />

      <main className="flex-1">
        {/* Hero */}
        <section className="container flex flex-col items-center py-24 text-center sm:py-32">
          <FadeIn>
            <p className="mb-4 text-sm font-medium uppercase tracking-[0.3em] text-muted-foreground">
              Fotografia · Video · Grafica
            </p>
            <h1 className="max-w-3xl text-balance text-5xl font-semibold tracking-tight sm:text-7xl">
              I tuoi momenti,
              <br />
              <span className="text-muted-foreground">
                scattati per durare.
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-balance text-lg text-muted-foreground">
              Cerca le foto del tuo evento con il tuo numero di gara e portale
              a casa in pochi clic.
            </p>
          </FadeIn>

          {/* Ricerca diretta: porta in galleria con il numero precompilato */}
          <FadeIn delay={0.15} className="mt-10 w-full max-w-md">
            <form
              action="/galleria"
              className="flex items-center gap-3 rounded-full border bg-card px-5 py-2 shadow-sm transition-colors focus-within:border-foreground/40 hover:border-foreground/30"
            >
              <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
              <input
                name="numero"
                inputMode="numeric"
                placeholder="Il tuo numero di gara…"
                aria-label="Cerca per numero di gara"
                className="h-10 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
              <button
                type="submit"
                aria-label="Cerca"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform hover:scale-105 active:scale-95"
              >
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          </FadeIn>
        </section>

        {/* Eventi recenti */}
        <section id="eventi" className="container pb-24">
          <FadeIn className="mb-8 flex items-end justify-between">
            <div>
              <h2 className="text-3xl font-semibold tracking-tight">
                Eventi recenti
              </h2>
              <p className="mt-2 text-muted-foreground">
                Gli ultimi eventi coperti da Lifeshot.
              </p>
            </div>
            <Link
              href="/galleria"
              className="hidden items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground sm:inline-flex"
            >
              Tutta la galleria
              <ArrowRight className="h-4 w-4" />
            </Link>
          </FadeIn>

          {events.length > 0 ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {events.map((event, index) => (
                <FadeIn key={event.id} delay={index * 0.06}>
                  <Link
                    href={`/galleria?evento=${event.slug}`}
                    className="group block overflow-hidden rounded-2xl border bg-card transition-all duration-300 hover:-translate-y-1 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                      {event.coverImage ? (
                        <Image
                          src={event.coverImage}
                          alt={event.name}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <Camera className="h-8 w-8 text-muted-foreground/50" />
                        </div>
                      )}
                    </div>
                    <div className="p-5">
                      <h3 className="font-medium tracking-tight">
                        {event.name}
                      </h3>
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5" />
                          {formatDate(event.date)}
                        </span>
                        {event.location && (
                          <span className="inline-flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5" />
                            {event.location}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                </FadeIn>
              ))}
            </div>
          ) : (
            <FadeIn className="flex flex-col items-center gap-3 rounded-2xl border border-dashed py-20 text-center">
              <Camera className="h-8 w-8 text-muted-foreground" />
              <p className="font-medium">Nessun evento pubblicato</p>
              <p className="text-sm text-muted-foreground">
                I prossimi eventi coperti da Lifeshot appariranno qui.
              </p>
            </FadeIn>
          )}
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
