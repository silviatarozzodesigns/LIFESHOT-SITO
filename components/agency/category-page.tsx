import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Calendar, Camera, MapPin } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { FadeIn } from "@/components/motion/fade-in";
import { ContactSection } from "@/components/agency/contact-section";
import { CategoryHero } from "@/components/agency/category-hero";
import { VideoSection } from "@/components/agency/video-section";
import { PhotoSlider } from "@/components/home/photo-slider";
import { EditableText } from "@/components/cms/editable-text";
import type { EventDTO } from "@/lib/data/events";
import type { PhotoDTO } from "@/lib/data/photos";
import type { VideoDTO } from "@/lib/data/videos";
import {
  getSpacingClass,
  getText,
  getTextStyle,
  type CmsData,
} from "@/lib/content";
import { site } from "@/lib/site";
import { cn, formatDate } from "@/lib/utils";

export type CategorySlug = "ristorazione" | "business";

/**
 * PAGINA CATEGORIA (Ristorazione / Business) — la vetrina dedicata di una
 * nicchia, come /motorsport lo è per la pista:
 *   HERO 3D (sfondo + soggetto overlay) →
 *   IN EVIDENZA (slider degli scatti con la stella, dal CMS Gallery) →
 *   PROGETTI RECENTI (card dei progetti, ognuno con la sua pagina) →
 *   VIDEO (se la categoria ne ha) →
 *   CONTATTI.
 */
export function CategoryPageView({
  content,
  slug,
  featured,
  projects,
  videos,
}: {
  content: CmsData;
  slug: CategorySlug;
  /** Scatti con la stella degli eventi di questa categoria */
  featured: PhotoDTO[];
  /** Progetti (eventi) pubblicati della categoria, più recenti prima */
  projects: EventDTO[];
  /** Video della categoria (vuoto → la sezione non compare) */
  videos: VideoDTO[];
}) {
  const t = (key: string) => getText(content, slug, key);
  const ts = (key: string) => getTextStyle(content, slug, key);

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader floating />

      <main className="flex-1">
        {/* HERO 3D — sfondo + soggetto in overlay, come /motorsport */}
        <CategoryHero content={content} slug={slug} />

        {/* IN EVIDENZA — gli scatti migliori della categoria (stelline) */}
        <section id="lavori" className="scroll-mt-24 pt-16 sm:pt-24">
          {featured.length > 0 ? (
            <PhotoSlider
              items={featured.map((p) => ({ id: p.id, raceNumber: null }))}
              eyebrow="Gallery"
              title={
                <EditableText
                  page={slug}
                  k="gallery.title"
                  value={t("gallery.title")}
                  maxLength={80}
                  style={ts("gallery.title")}
                />
              }
              returnPath={`/${slug}`}
            />
          ) : (
            <div className="container">
              <FadeIn className="flex flex-col items-center gap-3 rounded-2xl border border-dashed py-20 text-center">
                <Camera className="h-8 w-8 text-muted-foreground" aria-hidden />
                <p className="font-medium">I lavori stanno arrivando</p>
                <p className="text-sm text-muted-foreground">
                  Nel frattempo trovi tutto sul nostro{" "}
                  <a
                    href={site.instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-primary hover:opacity-80"
                  >
                    Instagram
                  </a>
                  .
                </p>
              </FadeIn>
            </div>
          )}
        </section>

        {/* PROGETTI RECENTI — card dei progetti configurati dal CMS */}
        <section
          id="progetti"
          className={cn(
            "container scroll-mt-24 pt-16 sm:pt-24",
            getSpacingClass(content, slug, "gallery")
          )}
        >
          <FadeIn className="mb-8 max-w-xl">
            <h2 className="text-3xl font-semibold tracking-tight">
              <EditableText
                page={slug}
                k="projects.title"
                value={t("projects.title")}
                maxLength={80}
                style={ts("projects.title")}
              />
            </h2>
            <p className="mt-2 text-muted-foreground">
              <EditableText
                page={slug}
                k="projects.subtitle"
                value={t("projects.subtitle")}
                as="span"
                maxLength={200}
                style={ts("projects.subtitle")}
              />
            </p>
          </FadeIn>

          {projects.length > 0 ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {projects.map((project, index) => (
                <FadeIn key={project.id} delay={Math.min(index * 0.06, 0.3)}>
                  <Link
                    href={`/${slug}/${project.slug}`}
                    className="group block overflow-hidden rounded-2xl border bg-card transition-all duration-500 hover:-translate-y-1 hover:border-primary/40 hover:shadow-[0_20px_60px_-24px_rgba(0,0,0,0.8)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                      {project.coverImage ? (
                        <Image
                          src={project.coverImage}
                          alt={project.name}
                          fill
                          unoptimized
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
                        {project.name}
                      </h3>
                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                        {project.date && (
                          <span className="inline-flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5" />
                            {formatDate(project.date)}
                          </span>
                        )}
                        {project.location && (
                          <span className="inline-flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5" />
                            {project.location}
                          </span>
                        )}
                      </div>
                      <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary">
                        Guarda il progetto
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </div>
                  </Link>
                </FadeIn>
              ))}
            </div>
          ) : (
            <FadeIn className="flex flex-col items-center gap-3 rounded-2xl border border-dashed py-20 text-center">
              <Camera className="h-8 w-8 text-muted-foreground" aria-hidden />
              <p className="font-medium">Nessun progetto pubblicato</p>
              <p className="text-sm text-muted-foreground">
                I progetti configurati dal CMS appariranno qui.
              </p>
            </FadeIn>
          )}
        </section>

        {/* VIDEO — i video caricati nella macrocartella di questa categoria */}
        <VideoSection content={content} page={slug} videos={videos} />

        {/* CONTATTI — stessi canali della home agenzia */}
        <section className="container py-14 sm:py-20">
          <FadeIn>
            <ContactSection
              title={getText(content, "agenzia", "contact.title")}
              subtitle={getText(content, "agenzia", "contact.subtitle")}
              titleStyle={getTextStyle(content, "agenzia", "contact.title")}
              subtitleStyle={getTextStyle(content, "agenzia", "contact.subtitle")}
            />
          </FadeIn>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
