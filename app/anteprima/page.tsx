import type { Metadata } from "next";
import { AgencyView } from "@/components/agency/agency-view";
import { requireAdmin } from "@/lib/auth";
import { getHomepagePhotos } from "@/lib/data/photos";
import { getDraftContent } from "@/lib/data/content";

// Anteprima riservata: contenuti BOZZA, sempre freschi, mai indicizzata.
export const dynamic = "force-dynamic";
export const metadata: Metadata = { robots: { index: false, follow: false } };

/**
 * Specchio 1:1 della homepage agenzia con i contenuti in BOZZA del CMS.
 * Stesso identico componente del sito pubblico (AgencyView) → ciò che vedi
 * qui è esattamente ciò che andrà online alla pubblicazione.
 * (L'anteprima della pagina motorsport è in /anteprima/motorsport.)
 */
export default async function AnteprimaPage() {
  await requireAdmin();
  const [content, motorsport, ristorazione, business] = await Promise.all([
    getDraftContent(),
    getHomepagePhotos(8, "motorsport"),
    getHomepagePhotos(8, "ristorazione"),
    getHomepagePhotos(8, "business"),
  ]);

  return (
    <AgencyView
      content={content}
      featuredPhotos={{ motorsport, ristorazione, business }}
    />
  );
}
