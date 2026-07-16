import { ArrowDown, ArrowUpRight, Instagram } from "lucide-react";
import { Hero3DShell } from "@/components/hero/hero-3d-shell";
import { EditableText } from "@/components/cms/editable-text";
import {
  getHeroAssets,
  getText,
  getTextStyle,
  getTypographyClass,
  type CmsData,
} from "@/lib/content";
import { site } from "@/lib/site";
import { cn } from "@/lib/utils";
import type { CategorySlug } from "@/components/agency/category-page";

/**
 * HERO 3D DELLE PAGINE CATEGORIA (Ristorazione / Business) — stessa
 * scenografia cinematografica di /motorsport (sfondo + soggetto in overlay
 * con parallax, asset per dispositivo dal CMS), con il contenuto della
 * categoria: titolo, sottotitolo e CTA verso i lavori.
 */
export function CategoryHero({
  content,
  slug,
  interactive = true,
}: {
  content: CmsData;
  slug: CategorySlug;
  interactive?: boolean;
}) {
  const t = (key: string) => getText(content, slug, key);
  const ts = (key: string) => getTextStyle(content, slug, key);

  return (
    <Hero3DShell
      page={slug}
      assets={getHeroAssets(content, slug)}
      overlayLabel="Soggetto"
      interactive={interactive}
      fullHeight
    >
      {/* Ritmo verticale della hero motorsport: l'intestazione respira in
          alto, le azioni scendono in fondo (dove lì sta la ricerca) invece
          di ammassarsi tutte al centro. Vale su ogni schermo. */}
      <div className="flex w-full max-w-xl flex-1 flex-col justify-between gap-12">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
            Categoria
          </p>
          <h1
            className={cn(
              "mt-4 font-semibold uppercase leading-[0.95] tracking-tight",
              getTypographyClass(content, slug, "hero.title")
            )}
          >
            <EditableText
              page={slug}
              k="hero.title"
              value={t("hero.title")}
              maxLength={60}
              style={ts("hero.title")}
            />
          </h1>
          <p className="mt-5 max-w-md text-balance text-muted-foreground sm:text-lg">
            <EditableText
              page={slug}
              k="hero.subtitle"
              value={t("hero.subtitle")}
              as="span"
              maxLength={220}
              style={ts("hero.subtitle")}
            />
          </p>
        </div>

        {/* CTA — verso i lavori in pagina + canale DM */}
        <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:text-left">
          <a
            href="#lavori"
            className="group inline-flex items-center justify-center gap-2.5 whitespace-nowrap rounded-full bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:scale-[1.03] hover:shadow-primary/40 active:scale-95"
          >
            <EditableText
              page={slug}
              k="hero.cta"
              value={t("hero.cta")}
              maxLength={40}
              style={ts("hero.cta")}
            />
            <ArrowDown className="h-4 w-4 transition-transform group-hover:translate-y-0.5" />
          </a>
          <a
            href={site.instagramDmUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border bg-background/50 px-6 py-3.5 text-sm font-medium backdrop-blur transition-colors hover:border-primary/50 hover:text-primary"
          >
            <Instagram className="h-4 w-4" />
            Scrivici in DM
            <ArrowUpRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    </Hero3DShell>
  );
}
