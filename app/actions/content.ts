"use server";

import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/db";
import { SiteContent } from "@/models/SiteContent";
import { isAdmin } from "@/lib/auth";
import { normalizeContent, type CmsData } from "@/lib/content";

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
    // layout incluso: i metadata SEO vivono nel root layout
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
