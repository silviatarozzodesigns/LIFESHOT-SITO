import { AgencyView } from "@/components/agency/agency-view";
import { getHomepagePhotos } from "@/lib/data/photos";
import { getPublishedContent } from "@/lib/data/content";

// ISR: la home è servita da cache (navigazione istantanea) e rigenerata
// on-demand — upload/pubblicazioni chiamano revalidatePath("/").
// Il revalidate orario è solo una rete di sicurezza.
export const revalidate = 3600;

/**
 * HOMEPAGE AGENZIA — "Tutto il tuo digitale. Un'unica agenzia."
 * La vetrina di tutti i servizi; il mondo motorsport (ex homepage)
 * vive nella sua pagina dedicata /motorsport.
 */
export default async function HomePage() {
  const [content, motorsport, ristorazione, business] = await Promise.all([
    getPublishedContent(),
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
