import { AgencyView } from "@/components/agency/agency-view";
import { getFeaturedPhotos } from "@/lib/data/photos";
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
  const [content, motorsportPhotos] = await Promise.all([
    getPublishedContent(),
    getFeaturedPhotos(8, "motorsport"),
  ]);

  return <AgencyView content={content} motorsportPhotos={motorsportPhotos} />;
}
