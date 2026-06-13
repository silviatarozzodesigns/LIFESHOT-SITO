import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Calendar, Camera, MapPin } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { FadeIn } from "@/components/motion/fade-in";
import { Hero3D } from "@/components/home/hero-3d";
import { PhotoSlider } from "@/components/home/photo-slider";
import { EventScout } from "@/components/home/event-scout";
import { getRecentEvents } from "@/lib/data/events";
import { getMarqueePhotos } from "@/lib/data/photos";
import { getPublishedContent } from "@/lib/data/content";
import {
  getImage,
  getImageSettings,
  getSpacingClass,
  getText,
  getTypographyClass,
} from "@/lib/content";
import { cn, formatDate } from "@/lib/utils";

// Eventi e contenuti CMS arrivano dal database: render a richiesta
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [events, marquee, content] = await Promise.all([
    getRecentEvents(6),
    getMarqueePhotos(16),
    getPublishedContent(),
  ]);
  const t = (key: string) => getText(content, "home", key);

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />

      <main className="flex-1">
        {/* HERO 3D — prossimo evento (CMS-editable) */}
        <Hero3D
          badge={t("hero.badge")}
          eventName={t("hero.eventName")}
          eventDate={t("hero.eventDate")}
          eventTime={t("hero.eventTime")}
          eventLocation={t("hero.eventLocation")}
          subtitle={t("hero.subtitle")}
          searchPlaceholder={t("hero.searchPlaceholder")}
          backgroundUrl={getImage(content, "home", "hero.background")}
          foregroundUrl={getImage(content, "home", "hero.foreground")}
          eventNameClass={getTypographyClass(content, "home", "hero.eventName")}
          dateClass={getTypographyClass(content, "home", "hero.date")}
          bgPosition={getImageSettings(content, "home", "hero.background").position}
          bgScale={getImageSettings(content, "home", "hero.background").scale}
          fgPosition={getImageSettings(content, "home", "hero.foreground").position}
          fgScale={getImageSettings(content, "home", "hero.foreground").scale}
        />

        {/* SLIDER — scatti recenti, frecce + swipe */}
        {marquee.length > 0 && (
          <div className="mt-12">
            <PhotoSlider
              items={marquee.map((p) => ({ id: p.id, raceNumber: p.raceNumber }))}
            />
          </div>
        )}

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

        {/* Invita Lifeshot al tuo evento (lead-gen) */}
        <section
          className={cn("container", getSpacingClass(content, "home", "scout"))}
        >
          <FadeIn>
            <EventScout
              title={t("scout.title")}
              subtitle={t("scout.subtitle")}
              buttonLabel={t("scout.button")}
            />
          </FadeIn>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
