"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { connectDB } from "@/lib/db";
import { SiteContent } from "@/models/SiteContent";
import { CONTENT_TAG } from "@/lib/data/content";
import { isAdmin } from "@/lib/auth";
import { getStorage } from "@/lib/storage";
import {
  normalizeContent,
  type CmsData,
  type Level,
  type PageSlug,
} from "@/lib/content";

/**
 * Server Actions del micro-CMS.
 *
 * Flusso: l'editor lavora su uno stato React locale → "Salva bozza"
 * persiste in `draft` (il sito pubblico NON cambia) → "Salva e pubblica"
 * copia la bozza in `published` e rigenera le pagine pubbliche.
 */

export type ContentActionResult =
  | { ok: true; content: CmsData }
  | { ok: false; error: string };

const UNAUTHORIZED = {
  ok: false as const,
  error: "Non autorizzato: effettua il login admin.",
};

/**
 * Elimina un asset dallo storage Cloudflare R2 (o locale) a partire dal suo
 * URL pubblico — usato dalla sidebar quando si sostituisce o si rimuove
 * un'immagine, così non restano file orfani sul bucket.
 *
 * Sicuro per design: cancella SOLO i file caricati dal CMS (prefisso `cms/`).
 * Default vettoriali (/hero/…), object-URL (blob:) e URL esterni → no-op.
 */
export async function deleteAsset(url: string): Promise<{ ok: boolean }> {
  if (!(await isAdmin())) return { ok: false };
  if (!url || url.startsWith("blob:") || url.startsWith("/hero/")) {
    return { ok: true };
  }
  try {
    const storage = getStorage();
    const key = storage.keyFromPublicUrl(url);
    if (!key || !key.startsWith("cms/")) return { ok: true };
    await storage.delete(key);
    return { ok: true };
  } catch (error) {
    console.warn("[lifeshot] deleteAsset fallita:", error);
    return { ok: false };
  }
}

/**
 * Editing IN-PLACE (CMS WYSIWYG) → salva in BOZZA.
 * Le modifiche restano nella bozza (visibili nell'anteprima "Sito reale")
 * finché non si preme "Pubblica". Il sito pubblico NON cambia da solo.
 */
export async function setField(
  page: PageSlug,
  key: string,
  value: string
): Promise<{ ok: boolean; error?: string }> {
  if (!(await isAdmin())) return { ok: false, error: "Non autorizzato." };
  try {
    await connectDB();
    const doc = await SiteContent.findOne({ key: "site" })
      .select("draft published")
      .lean();
    const base = normalizeContent(doc?.draft ?? doc?.published);
    if (!(key in base.pages[page].texts)) {
      return { ok: false, error: "Campo sconosciuto." };
    }
    base.pages[page].texts[key] = value;
    const content = normalizeContent(base); // riapplica le lunghezze massime
    await SiteContent.updateOne(
      { key: "site" },
      { $set: { draft: content } },
      { upsert: true }
    );
    return { ok: true };
  } catch (error) {
    console.error("[lifeshot] setField fallita:", error);
    return { ok: false, error: "Salvataggio non riuscito." };
  }
}

/** Override di un testo "fisso" (id arbitrario) → BOZZA. */
export async function setCustom(
  id: string,
  value: string
): Promise<{ ok: boolean; error?: string }> {
  if (!(await isAdmin())) return { ok: false, error: "Non autorizzato." };
  if (!id) return { ok: false, error: "Id mancante." };
  try {
    await connectDB();
    const doc = await SiteContent.findOne({ key: "site" })
      .select("draft published")
      .lean();
    const base = normalizeContent(doc?.draft ?? doc?.published);
    base.custom[id] = value.slice(0, 600);
    const content = normalizeContent(base);
    await SiteContent.updateOne(
      { key: "site" },
      { $set: { draft: content } },
      { upsert: true }
    );
    return { ok: true };
  } catch (error) {
    console.error("[lifeshot] setCustom fallita:", error);
    return { ok: false, error: "Salvataggio non riuscito." };
  }
}

/** Allineamento/dimensione di un testo "fisso" (id arbitrario) → BOZZA. */
export async function setCustomStyle(
  id: string,
  style: { align?: "left" | "center" | "right"; size?: Level }
): Promise<{ ok: boolean; error?: string }> {
  if (!(await isAdmin())) return { ok: false, error: "Non autorizzato." };
  try {
    await connectDB();
    const doc = await SiteContent.findOne({ key: "site" })
      .select("draft published")
      .lean();
    const base = normalizeContent(doc?.draft ?? doc?.published);
    base.customStyles[id] = { ...base.customStyles[id], ...style };
    const content = normalizeContent(base);
    await SiteContent.updateOne(
      { key: "site" },
      { $set: { draft: content } },
      { upsert: true }
    );
    return { ok: true };
  } catch (error) {
    console.error("[lifeshot] setCustomStyle fallita:", error);
    return { ok: false, error: "Salvataggio non riuscito." };
  }
}

/** Editing in-place di un'immagine (sfondo/rider/OG…) → BOZZA. */
export async function setImageField(
  page: PageSlug,
  key: string,
  url: string
): Promise<{ ok: boolean; error?: string }> {
  if (!(await isAdmin())) return { ok: false, error: "Non autorizzato." };
  try {
    await connectDB();
    const doc = await SiteContent.findOne({ key: "site" })
      .select("draft published")
      .lean();
    const base = normalizeContent(doc?.draft ?? doc?.published);
    if (!(key in base.pages[page].images)) {
      return { ok: false, error: "Immagine sconosciuta." };
    }
    const previous = base.pages[page].images[key];
    base.pages[page].images[key] = url;
    const content = normalizeContent(base);
    await SiteContent.updateOne(
      { key: "site" },
      { $set: { draft: content } },
      { upsert: true }
    );
    // Pulisci il vecchio asset dal cloud (solo file caricati dal CMS)
    if (previous && previous !== url) await deleteAsset(previous);
    return { ok: true };
  } catch (error) {
    console.error("[lifeshot] setImageField fallita:", error);
    return { ok: false, error: "Salvataggio non riuscito." };
  }
}

/** Editing in-place dimensione/allineamento di un testo → BOZZA. */
export async function setTextStyle(
  page: PageSlug,
  key: string,
  style: { align?: "left" | "center" | "right"; size?: Level }
): Promise<{ ok: boolean; error?: string }> {
  if (!(await isAdmin())) return { ok: false, error: "Non autorizzato." };
  try {
    await connectDB();
    const doc = await SiteContent.findOne({ key: "site" })
      .select("draft published")
      .lean();
    const base = normalizeContent(doc?.draft ?? doc?.published);
    const current = base.pages[page].textStyles[key] ?? {};
    base.pages[page].textStyles[key] = { ...current, ...style };
    const content = normalizeContent(base);
    await SiteContent.updateOne(
      { key: "site" },
      { $set: { draft: content } },
      { upsert: true }
    );
    return { ok: true };
  } catch (error) {
    console.error("[lifeshot] setTextStyle fallita:", error);
    return { ok: false, error: "Salvataggio non riuscito." };
  }
}

/** Rilegge la BOZZA corrente — usato dall'editor per risincronizzarsi dopo
 *  le modifiche in-place fatte dentro l'iframe (che salvano in draft).
 *  DEVE leggere draft prima di published: leggendo il pubblicato vecchio,
 *  lo stato dell'editor regrediva e "Pubblica" sovrascriveva le modifiche. */
export async function loadContent(): Promise<CmsData> {
  if (!(await isAdmin())) return normalizeContent(null);
  try {
    await connectDB();
    const doc = await SiteContent.findOne({ key: "site" })
      .select("published draft")
      .lean();
    return normalizeContent(doc?.draft ?? doc?.published);
  } catch (error) {
    console.error("[lifeshot] loadContent fallita:", error);
    return normalizeContent(null);
  }
}

/** Salva la bozza: visibile solo nell'editor, produzione intatta. */
export async function saveDraft(
  input: CmsData
): Promise<ContentActionResult> {
  if (!(await isAdmin())) return UNAUTHORIZED;

  try {
    const content = normalizeContent(input);
    await connectDB();
    await SiteContent.updateOne(
      { key: "site" },
      { $set: { draft: content } },
      { upsert: true }
    );
    return { ok: true, content };
  } catch (error) {
    console.error("[lifeshot] saveDraft fallita:", error);
    return { ok: false, error: "Errore durante il salvataggio della bozza." };
  }
}

/**
 * Salva e pubblica: bozza e pubblicato vengono allineati al contenuto
 * corrente dell'editor, poi le pagine pubbliche vengono rigenerate.
 */
export async function publishContent(
  input: CmsData
): Promise<ContentActionResult> {
  if (!(await isAdmin())) return UNAUTHORIZED;

  try {
    const content = normalizeContent(input);
    await connectDB();
    await SiteContent.updateOne(
      { key: "site" },
      { $set: { draft: content, published: content } },
      { upsert: true }
    );
    // Rinfresca la cache dei contenuti pubblicati + le pagine (SEO nel layout)
    revalidateTag(CONTENT_TAG);
    revalidatePath("/", "layout");
    return { ok: true, content };
  } catch (error) {
    console.error("[lifeshot] publishContent fallita:", error);
    return { ok: false, error: "Errore durante la pubblicazione." };
  }
}

/** Scarta la bozza riportandola allo stato pubblicato. */
export async function discardDraft(): Promise<ContentActionResult> {
  if (!(await isAdmin())) return UNAUTHORIZED;

  try {
    await connectDB();
    const doc = await SiteContent.findOne({ key: "site" })
      .select("published")
      .lean();
    const content = normalizeContent(doc?.published);
    await SiteContent.updateOne(
      { key: "site" },
      { $set: { draft: content } },
      { upsert: true }
    );
    return { ok: true, content };
  } catch (error) {
    console.error("[lifeshot] discardDraft fallita:", error);
    return { ok: false, error: "Errore durante il ripristino." };
  }
}
