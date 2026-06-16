import { connectDB } from "@/lib/db";
import { SiteContent } from "@/models/SiteContent";
import { isAdmin } from "@/lib/auth";
import {
  DEFAULT_CONTENT,
  normalizeContent,
  type CmsData,
} from "@/lib/content";

/**
 * Contenuto da mostrare in una pagina pubblica: la BOZZA quando la pagina è
 * aperta in anteprima dall'admin (`?preview=1` dentro l'editor), altrimenti il
 * PUBBLICATO. Così l'editor mostra le modifiche non ancora pubblicate.
 */
export async function getViewContent(preview: boolean): Promise<CmsData> {
  if (preview && (await isAdmin())) return getDraftContent();
  return getPublishedContent();
}

/**
 * Contenuti PUBBLICATI — usati dalle pagine pubbliche e dai metadata.
 * Senza database o prima della prima pubblicazione: default del codice.
 */
export async function getPublishedContent(): Promise<CmsData> {
  try {
    await connectDB();
    const doc = await SiteContent.findOne({ key: "site" })
      .select("published")
      .lean();
    return normalizeContent(doc?.published);
  } catch (error) {
    console.error("[lifeshot] lettura contenuti pubblicati fallita:", error);
    return DEFAULT_CONTENT;
  }
}

/**
 * BOZZA per l'editor admin: se non esiste ancora, parte dal pubblicato
 * (o dai default). Da usare solo dietro requireAdmin().
 */
export async function getDraftContent(): Promise<CmsData> {
  try {
    await connectDB();
    const doc = await SiteContent.findOne({ key: "site" })
      .select("draft published")
      .lean();
    return normalizeContent(doc?.draft ?? doc?.published);
  } catch (error) {
    console.error("[lifeshot] lettura bozza fallita:", error);
    return DEFAULT_CONTENT;
  }
}
