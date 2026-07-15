/* eslint-disable @next/next/no-img-element */

import { Camera } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { FadeIn } from "@/components/motion/fade-in";
import { ContactSection } from "@/components/agency/contact-section";
import { CategoryHero } from "@/components/agency/category-hero";
import { EditableText } from "@/components/cms/editable-text";
import { EditableImage } from "@/components/cms/editable-image";
import {
  getImage,
  getImageSettings,
  getSpacingClass,
  getText,
  getTextStyle,
  type CmsData,
} from "@/lib/content";
import { site } from "@/lib/site";
import { cn } from "@/lib/utils";

export type CategorySlug = "ristorazione" | "business";

const WORK_KEYS = [
  "work1",
  "work2",
  "work3",
  "work4",
  "work5",
  "work6",
  "work7",
  "work8",
] as const;

/**
 * PAGINA CATEGORIA (Ristorazione / Business) — la vetrina dedicata di una
 * nicchia, come /motorsport lo è per la pista: intestazione con CTA
 * "Guarda i nostri lavori" → galleria interna (griglia semplice, niente
 * filtri: qui si sfoglia, non si cerca) → contatti. Tutto dal CMS.
 */
export function CategoryPageView({
  content,
  slug,
}: {
  content: CmsData;
  slug: CategorySlug;
}) {
  const t = (key: string) => getText(content, slug, key);
  const ts = (key: string) => getTextStyle(content, slug, key);

  const works = WORK_KEYS.map((key) => ({
    key,
    url: getImage(content, slug, key),
    settings: getImageSettings(content, slug, key),
  })).filter((w) => w.url);

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader floating />

      <main className="flex-1">
        {/* HERO 3D — sfondo + soggetto in overlay, come /motorsport */}
        <CategoryHero content={content} slug={slug} />

        {/* GALLERIA LAVORI — griglia semplice, si sfoglia e basta */}
        <section
          id="lavori"
          className={cn(
            "container scroll-mt-24",
            getSpacingClass(content, slug, "gallery")
          )}
        >
          <FadeIn className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-xl">
              <h2 className="text-3xl font-semibold tracking-tight">
                <EditableText
                  page={slug}
                  k="gallery.title"
                  value={t("gallery.title")}
                  maxLength={80}
                  style={ts("gallery.title")}
                />
              </h2>
              <p className="mt-2 text-muted-foreground">
                <EditableText
                  page={slug}
                  k="gallery.subtitle"
                  value={t("gallery.subtitle")}
                  as="span"
                  maxLength={200}
                  style={ts("gallery.subtitle")}
                />
              </p>
            </div>
            {/* Chip upload (solo admin in edit mode) */}
            <div className="flex max-w-md flex-wrap justify-end gap-2">
              {WORK_KEYS.map((key, i) => (
                <EditableImage
                  key={key}
                  page={slug}
                  k={key}
                  label={`Lavoro ${i + 1}`}
                />
              ))}
            </div>
          </FadeIn>

          {works.length > 0 ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {works.map((work, index) => (
                <FadeIn key={work.key} delay={Math.min(index * 0.06, 0.3)}>
                  <div className="group relative aspect-[4/3] overflow-hidden rounded-2xl border bg-muted">
                    <img
                      src={work.url}
                      alt=""
                      style={{
                        objectPosition: work.settings.position,
                        transform: `scale(${Math.max(1, work.settings.scale / 100)})`,
                      }}
                      className="h-full w-full object-cover transition-transform duration-700 [transition-timing-function:cubic-bezier(0.22,0.61,0.36,1)] group-hover:scale-[1.05]"
                    />
                  </div>
                </FadeIn>
              ))}
            </div>
          ) : (
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
          )}
        </section>

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
