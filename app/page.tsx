import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Calendar, Camera, MapPin, Search } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { FadeIn } from "@/components/motion/fade-in";
import { getRecentEvents } from "@/lib/data/events";
import { getPublishedContent } from "@/lib/data/content";
import { getSpacingClass, getText } from "@/lib/content";
import { cn, formatDate } from "@/lib/utils";

// Eventi e contenuti CMS arrivano dal database: render a richiesta
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [events, content] = await Promise.all([
    getRecentEvents(6),
    getPublishedContent(),
  ]);
  const t = (key: string) => getText(content, "home", key);

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />

      <main className="flex-1">
        {/* Hero — i bagliori di sfondo sono full-frame nel layout root */}
        <section className="relative">
          <div
            className={cn(
              "container flex flex-col items-center text-center",
              getSpacingClass(content, "home", "hero")
            )}
          >
            <FadeIn>
              <p className="mb-4 text-sm font-semibold uppercase tracking-[0.3em] text-primary">
                {t("hero.eyebrow")}
              </p>
              <h1 className="max-w-3xl text-balance text-5xl font-semibold tracking-tight sm:text-7xl">
                {t("hero.titleLine1")}
                <br />
                <span className="text-muted-foreground">
                  {t("hero.titleLine2")}
                </span>
              </h1>
              <p className="mx-auto mt-6 max-w-xl text-balance text-lg text-muted-foreground">
                {t("hero.subtitle")}
              </p>
            </FadeIn>

            {/* Ricerca diretta: porta in galleria con il numero precompilato */}
            <FadeIn delay={0.15} className="mt-10 w-full max-w-md">
              <form
                action="/galleria"
                className="flex items-center gap-3 rounded-full border bg-card/80 px-5 py-2 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.5)] backdrop-blur-sm transition-colors focus-within:border-primary/60 hover:border-primary/40"
              >
                <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
                <input
                  name="numero"
                  inputMode="numeric"
                  placeholder={t("hero.searchPlaceholder")}
                  aria-label="Cerca per numero di gara"
                  className="h-10 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />
                <button
                  type="submit"
                  aria-label="Cerca"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-all hover:scale-105 hover:shadow-[0_0_24px_-4px_hsl(var(--primary)/0.6)] active:scale-95"
                >
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>
            </FadeIn>
          </div>
        </section>

        {/* Eventi recenti */}
        <section
          id="eventi"
          className={cn(
            "container",
            getSpacingClass(content, "home", "sections")
          )}
        >
          <FadeIn className="mb-8 flex items-end justify-between">
            <div>
              <h2 className="text-3xl font-semibold tracking-tight">
                {t("events.title")}
              </h2>
              <p className="mt-2 text-muted-foreground">
                {t("events.subtitle")}
              </p>
            </div>
            <Link
              href="/galleria"
              className="hidden items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-primary sm:inline-flex"
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
                    className="group block overflow-hidden rounded-2xl border bg-card transition-all duration-500 hover:-translate-y-1 hover:border-primary/40 hover:shadow-[0_20px_60px_-24px_rgba(0,0,0,0.8)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                      {event.coverImage ? (
                        <Image
                          src={event.coverImage}
                          alt={event.name}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          className="object-cover transition-transform duration-700 [transition-timing-function:cubic-bezier(0.22,0.61,0.36,1)] group-hover:scale-[1.06]"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <Camera className="h-8 w-8 text-muted-foreground/50" />
                        </div>
                      )}
                    </div>
                    <div className="p-5">
                      <h3 className="font-medium tracking-tight transition-colors group-hover:text-primary">
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
