import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { FadeIn } from "@/components/motion/fade-in";
import { AgencyHero, type HeroSlide } from "@/components/agency/agency-hero";
import { ServicesRibbon } from "@/components/agency/services-ribbon";
import {
  CategoryShowcase,
  type ShowcaseCategory,
} from "@/components/agency/category-showcase";
import { AgencyTestimonials } from "@/components/agency/agency-testimonials";
import { ContactSection } from "@/components/agency/contact-section";
import { EditableText } from "@/components/cms/editable-text";
import type { PhotoDTO } from "@/lib/data/photos";
import {
  getImage,
  getImageSettings,
  getServiceCopy,
  getSpacingClass,
  getText,
  getTextStyle,
  getTypographyClass,
  type CmsData,
} from "@/lib/content";
import { cn } from "@/lib/utils";

const SLIDE_KEYS = [
  "hero.slide1",
  "hero.slide2",
  "hero.slide3",
  "hero.slide4",
] as const;

/**
 * Vista UNICA della homepage AGENZIA: usata sia dal sito pubblico ("/",
 * contenuti pubblicati) sia dall'anteprima CMS /anteprima (bozza).
 *
 * Racconta l'agenzia a tre livelli: hero con slogan e costellazione dei
 * servizi → nastro che li elenca → categorie (Ristorazione, Motorsport,
 * Business) che si espandono allo scroll con galleria e descrizione.
 * Il motorsport rimanda alla sua pagina dedicata /motorsport.
 */
export function AgencyView({
  content,
  motorsportPhotos,
}: {
  content: CmsData;
  motorsportPhotos: PhotoDTO[];
}) {
  const t = (key: string) => getText(content, "agenzia", key);
  const ts = (key: string) => getTextStyle(content, "agenzia", key);

  const slides: HeroSlide[] = SLIDE_KEYS.map((key) => {
    const url = getImage(content, "agenzia", key);
    const settings = getImageSettings(content, "agenzia", key);
    return { key, url, position: settings.position, scale: settings.scale };
  }).filter((s) => s.url);

  // Anteprima in home = i primi 4 "lavori" caricati sulla pagina categoria
  const workMedia = (cat: "ristorazione" | "business") =>
    [1, 2, 3, 4]
      .map((n) => getImage(content, cat, `work${n}`))
      .filter(Boolean)
      .map((src) => ({ kind: "url" as const, src }));

  const workKeys = [1, 2, 3, 4].map((n) => `work${n}`);

  const categories: ShowcaseCategory[] = [
    {
      id: "ristorazione",
      title: t("cat.ristorazione.title"),
      description: t("cat.ristorazione.description"),
      titleStyle: ts("cat.ristorazione.title"),
      descriptionStyle: ts("cat.ristorazione.description"),
      href: "/ristorazione",
      linkLabel: "Scopri la ristorazione",
      media: workMedia("ristorazione"),
      imagePage: "ristorazione",
      imageKeys: workKeys,
    },
    {
      id: "motorsport",
      title: t("cat.motorsport.title"),
      description: t("cat.motorsport.description"),
      titleStyle: ts("cat.motorsport.title"),
      descriptionStyle: ts("cat.motorsport.description"),
      href: "/motorsport",
      linkLabel: "Entra nel motorsport",
      media: motorsportPhotos.map((p) => ({
        kind: "photo" as const,
        id: p.id,
        raceNumber: p.raceNumber,
      })),
    },
    {
      id: "business",
      title: t("cat.business.title"),
      description: t("cat.business.description"),
      titleStyle: ts("cat.business.title"),
      descriptionStyle: ts("cat.business.description"),
      href: "/business",
      linkLabel: "Scopri il business",
      media: workMedia("business"),
      imagePage: "business",
      imageKeys: workKeys,
    },
  ];

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader floating />

      <main className="flex-1">
        {/* HERO — slogan + CTA, costellazione, slide CMS opzionali */}
        <AgencyHero
          sloganLine1={t("hero.sloganLine1")}
          sloganLine2={t("hero.sloganLine2")}
          ctaLabel={t("hero.ctaLabel")}
          sloganClass={getTypographyClass(content, "agenzia", "hero.slogan")}
          slides={slides}
          videoLandscape={getImage(content, "agenzia", "hero.videoLandscape")}
          videoPortrait={getImage(content, "agenzia", "hero.videoPortrait")}
          serviceCopy={getServiceCopy(content)}
          textStyles={content.pages.agenzia.textStyles}
        />

        {/* NASTRO SERVIZI — ripete a rallentatore ciò che la hero suggerisce */}
        <div className="mt-10 sm:mt-14">
          <ServicesRibbon items={t("ribbon.items")} />
        </div>

        {/* CATEGORIE — si espandono allo scroll, una alla volta */}
        <section
          id="categorie"
          className={cn(
            "container scroll-mt-24",
            getSpacingClass(content, "agenzia", "categories")
          )}
        >
          <FadeIn className="mb-10 max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
              Categorie
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
              <EditableText
                page="agenzia"
                k="categories.title"
                value={t("categories.title")}
                maxLength={80}
                style={ts("categories.title")}
              />
            </h2>
            <p className="mt-2 text-muted-foreground">
              <EditableText
                page="agenzia"
                k="categories.subtitle"
                value={t("categories.subtitle")}
                as="span"
                maxLength={200}
                style={ts("categories.subtitle")}
              />
            </p>
          </FadeIn>
          <CategoryShowcase categories={categories} />
        </section>

        {/* TESTIMONIANZE — voci miste dalle varie categorie */}
        <div className={getSpacingClass(content, "agenzia", "reviews")}>
          <AgencyTestimonials content={content} />
        </div>

        {/* CONTATTI — DM Instagram e mail, i canali veri dell'agenzia */}
        <section
          className={cn(
            "container",
            getSpacingClass(content, "agenzia", "contact")
          )}
        >
          <FadeIn>
            <ContactSection
              title={t("contact.title")}
              subtitle={t("contact.subtitle")}
              titleStyle={ts("contact.title")}
              subtitleStyle={ts("contact.subtitle")}
            />
          </FadeIn>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
