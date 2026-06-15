import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Calendar, Camera, MapPin } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { FadeIn } from "@/components/motion/fade-in";
import { Hero3D } from "@/components/home/hero-3d";
import { PhotoSlider } from "@/components/home/photo-slider";
import { HowItWorks } from "@/components/home/how-it-works";
import { Services } from "@/components/home/services";
import { Testimonials } from "@/components/home/testimonials";
import { EventScout } from "@/components/home/event-scout";
import { EditableText } from "@/components/cms/editable-text";
import type { EventDTO } from "@/lib/data/events";
import type { PhotoDTO } from "@/lib/data/photos";
import {
  getImage,
  getImageSettings,
  getSpacingClass,
  getText,
  getTextStyle,
  getTypographyClass,
  type CmsData,
} from "@/lib/content";
import { cn, formatDate } from "@/lib/utils";

/**
 * Vista UNICA della homepage: usata sia dal sito pubblico (contenuti
 * pubblicati) sia dall'anteprima CMS /anteprima (bozza). Un solo codice →
 * l'anteprima è uno specchio 1:1 reale, niente più mock che diverge.
 */
export function HomeView({
  content,
  events,
  marquee,
}: {
  content: CmsData;
  events: EventDTO[];
  marquee: PhotoDTO[];
}) {
  const t = (key: string) => getText(content, "home", key);

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader floating />

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
          backgroundTabletUrl={getImage(content, "home", "hero.backgroundTablet")}
          backgroundMobileUrl={getImage(content, "home", "hero.backgroundMobile")}
          foregroundUrl={getImage(content, "home", "hero.foreground")}
          foregroundTabletUrl={getImage(content, "home", "hero.foregroundTablet")}
          foregroundMobileUrl={getImage(content, "home", "hero.foregroundMobile")}
          eventNameClass={getTypographyClass(content, "home", "hero.eventName")}
          dateClass={getTypographyClass(content, "home", "hero.date")}
          bgPosition={getImageSettings(content, "home", "hero.background").position}
          bgScale={getImageSettings(content, "home", "hero.background").scale}
          bgTabletPosition={getImageSettings(content, "home", "hero.backgroundTablet").position}
          bgTabletScale={getImageSettings(content, "home", "hero.backgroundTablet").scale}
          bgMobilePosition={getImageSettings(content, "home", "hero.backgroundMobile").position}
          bgMobileScale={getImageSettings(content, "home", "hero.backgroundMobile").scale}
          fgPosition={getImageSettings(content, "home", "hero.foreground").position}
          fgScale={getImageSettings(content, "home", "hero.foreground").scale}
          fgTabletPosition={getImageSettings(content, "home", "hero.foregroundTablet").position}
          fgTabletScale={getImageSettings(content, "home", "hero.foregroundTablet").scale}
          fgMobilePosition={getImageSettings(content, "home", "hero.foregroundMobile").position}
          fgMobileScale={getImageSettings(content, "home", "hero.foregroundMobile").scale}
          textStyles={content.pages.home.textStyles}
        />

        {/* SLIDER — scatti recenti, frecce + swipe */}
        {marquee.length > 0 && (
          <div className="mt-16 sm:mt-24">
            <PhotoSlider
              items={marquee.map((p) => ({ id: p.id, raceNumber: p.raceNumber }))}
            />
          </div>
        )}

        {/* Come funziona — flusso d'acquisto */}
        <div className="pt-20 sm:pt-28">
          <HowItWorks />
        </div>

        {/* Eventi recenti */}
        <section
          id="eventi"
          className={cn(
            "container scroll-mt-24 pt-20 sm:pt-28",
            getSpacingClass(content, "home", "sections")
          )}
        >
          <FadeIn className="mb-8 flex items-end justify-between">
            <div>
              <h2 className="text-3xl font-semibold tracking-tight">
                <EditableText
                  page="home"
                  k="events.title"
                  value={t("events.title")}
                  maxLength={80}
                  style={getTextStyle(content, "home", "events.title")}
                />
              </h2>
              <p className="mt-2 text-muted-foreground">
                <EditableText
                  page="home"
                  k="events.subtitle"
                  value={t("events.subtitle")}
                  as="span"
                  maxLength={200}
                  style={getTextStyle(content, "home", "events.subtitle")}
                />
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

        {/* Servizi — cosa offre Lifeshot oltre alle foto evento */}
        <div className="pt-8 sm:pt-12">
          <Services />
        </div>

        {/* Testimonianze — social proof dei rider */}
        <div className="pt-20 sm:pt-28">
          <Testimonials />
        </div>

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
