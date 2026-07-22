import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Calendar, Instagram, MapPin } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { FadeIn } from "@/components/motion/fade-in";
import { PhotoSlider } from "@/components/home/photo-slider";
import { MenuBook } from "@/components/agency/menu-book";
import type { EventDTO } from "@/lib/data/events";
import type { PhotoDTO } from "@/lib/data/photos";
import type { CategorySlug } from "@/components/agency/category-page";
import { site } from "@/lib/site";
import { formatDate } from "@/lib/utils";

const CATEGORY_LABELS: Record<CategorySlug, string> = {
  ristorazione: "Ristorazione",
  business: "Business",
};

/**
 * PAGINA PROGETTO (Ristorazione / Business) — il dettaglio di un lavoro:
 * titolo e contesto → galleria scorrevole con gli scatti del progetto →
 * descrizione. I progetti si creano dal CMS come gli eventi motorsport.
 */
export function ProjectView({
  project,
  photos,
  category,
}: {
  project: EventDTO;
  photos: PhotoDTO[];
  category: CategorySlug;
}) {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />

      <main className="flex-1">
        {/* INTESTAZIONE — categoria, titolo, data e luogo */}
        <section className="container relative pt-10 sm:pt-16">
          <div
            aria-hidden
            className="glow-primary pointer-events-none absolute left-1/2 top-0 h-[22rem] w-[44rem] -translate-x-1/2 -translate-y-1/2"
          />
          <FadeIn className="relative mx-auto max-w-3xl text-center">
            <Link
              href={`/${category}`}
              className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.3em] text-primary transition-opacity hover:opacity-80"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              {CATEGORY_LABELS[category]}
            </Link>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
              {project.name}
            </h1>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-sm text-muted-foreground">
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
          </FadeIn>
        </section>

        {/* MENÙ SFOGLIABILE — al posto della galleria, se è un progetto menù */}
        {project.isMenu ? (
          <div className="container mt-8 sm:mt-12">
            <MenuBook
              title={project.name}
              coverImage={project.menuCoverImage || undefined}
              materialImage={project.menuMaterialImage || undefined}
              soft={project.menuSoftFlip}
              pages={photos}
            />
          </div>
        ) : (
          photos.length > 0 && (
            <div className="mt-6 sm:mt-10">
              <PhotoSlider
                items={photos.map((p) => ({ id: p.id, raceNumber: null }))}
                eyebrow="Galleria"
                title="Il progetto in immagini"
                returnPath={`/${category}/${project.slug}`}
                navCtx={`e:${project.id}`}
              />
            </div>
          )
        )}

        {/* DESCRIZIONE — il racconto del progetto */}
        {project.description && (
          <section className="container pt-10 sm:pt-14">
            <FadeIn className="mx-auto max-w-2xl">
              <p className="whitespace-pre-line text-pretty leading-relaxed text-muted-foreground sm:text-lg">
                {project.description}
              </p>
            </FadeIn>
          </section>
        )}

        {/* CTA — un progetto simile? */}
        <section className="container py-16 sm:py-24">
          <FadeIn className="mx-auto flex max-w-2xl flex-col items-center gap-4 rounded-3xl border bg-card px-6 py-12 text-center">
            <h2 className="text-2xl font-semibold tracking-tight">
              Vuoi un progetto così per te?
            </h2>
            <p className="max-w-md text-sm text-muted-foreground">
              Raccontaci la tua idea: ti rispondiamo in giornata.
            </p>
            <a
              href={site.instagramDmUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group mt-2 inline-flex items-center gap-2.5 rounded-full bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:scale-[1.03] hover:shadow-primary/40 active:scale-95"
            >
              <Instagram className="h-4 w-4" />
              Scrivici in DM
              <ArrowUpRight className="h-4 w-4" />
            </a>
          </FadeIn>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
