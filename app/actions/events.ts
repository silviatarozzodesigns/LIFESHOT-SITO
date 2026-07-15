"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { EVENTS_TAG } from "@/lib/data/events";
import { PHOTOS_TAG } from "@/lib/data/photos";
import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import { Event } from "@/models/Event";
import { Photo } from "@/models/Photo";
import { getStorage, deleteByPublicUrl } from "@/lib/storage";
import { slugify } from "@/lib/parse-filename";
import { isAdmin } from "@/lib/auth";

/**
 * Server Actions CRUD per la gestione degli Eventi.
 * Richiamabili solo con sessione admin attiva (cookie verificato).
 */

const UNAUTHORIZED = {
  ok: false as const,
  error: "Non autorizzato: effettua il login admin.",
};

export interface EventInput {
  name: string;
  /** Data in formato ISO o yyyy-mm-dd (input type="date") */
  date: string;
  location?: string;
  description?: string;
  coverImage?: string;
  published?: boolean;
}

export type ActionResult =
  | { ok: true; id: string; slug: string }
  | { ok: false; error: string };

function validate(input: EventInput): string | null {
  if (!input.name?.trim()) return "Il nome dell'evento è obbligatorio.";
  if (input.name.trim().length > 200) return "Nome troppo lungo (max 200 caratteri).";
  if (!input.date || Number.isNaN(Date.parse(input.date)))
    return "Data dell'evento mancante o non valida.";
  return null;
}

/** Genera uno slug univoco; in caso di collisione aggiunge un suffisso. */
async function uniqueSlug(name: string, excludeId?: string): Promise<string> {
  const base = slugify(name) || "evento";
  let slug = base;
  let attempt = 1;
  while (
    await Event.exists({
      slug,
      ...(excludeId ? { _id: { $ne: excludeId } } : {}),
    })
  ) {
    attempt += 1;
    slug = `${base}-${attempt}`;
  }
  return slug;
}

function revalidatePublicPages() {
  revalidateTag(EVENTS_TAG);
  revalidateTag(PHOTOS_TAG);
  revalidatePath("/");
  revalidatePath("/motorsport");
  revalidatePath("/galleria");
}

export async function createEvent(input: EventInput): Promise<ActionResult> {
  if (!(await isAdmin())) return UNAUTHORIZED;
  const invalid = validate(input);
  if (invalid) return { ok: false, error: invalid };

  try {
    await connectDB();
    const event = await Event.create({
      name: input.name.trim(),
      slug: await uniqueSlug(input.name),
      date: new Date(input.date),
      location: input.location?.trim() ?? "",
      description: input.description?.trim() ?? "",
      coverImage: input.coverImage ?? "",
      published: input.published ?? true,
    });
    revalidatePublicPages();
    return { ok: true, id: String(event._id), slug: event.slug };
  } catch (error) {
    console.error("[lifeshot] createEvent fallita:", error);
    return { ok: false, error: "Errore durante la creazione dell'evento." };
  }
}

export async function updateEvent(
  id: string,
  input: EventInput
): Promise<ActionResult> {
  if (!(await isAdmin())) return UNAUTHORIZED;
  if (!Types.ObjectId.isValid(id)) return { ok: false, error: "ID non valido." };
  const invalid = validate(input);
  if (invalid) return { ok: false, error: invalid };

  try {
    await connectDB();
    const event = await Event.findById(id);
    if (!event) return { ok: false, error: "Evento non trovato." };

    // Lo slug viene rigenerato solo se il nome cambia, per non rompere i link
    if (event.name !== input.name.trim()) {
      event.slug = await uniqueSlug(input.name, id);
    }
    event.name = input.name.trim();
    event.date = new Date(input.date);
    event.location = input.location?.trim() ?? "";
    event.description = input.description?.trim() ?? "";
    // Cover sostituita/rimossa: elimina subito la vecchia da Cloudflare
    const previousCover = event.coverImage;
    if (input.coverImage !== undefined) event.coverImage = input.coverImage;
    if (input.published !== undefined) event.published = input.published;
    await event.save();

    if (
      input.coverImage !== undefined &&
      previousCover &&
      previousCover !== input.coverImage
    ) {
      await deleteByPublicUrl(previousCover);
    }

    revalidatePublicPages();
    return { ok: true, id, slug: event.slug };
  } catch (error) {
    console.error("[lifeshot] updateEvent fallita:", error);
    return { ok: false, error: "Errore durante l'aggiornamento dell'evento." };
  }
}

/**
 * Elimina l'evento, tutte le sue foto su MongoDB e i file nello storage
 * (locale o R2, in base all'ambiente).
 */
export async function deleteEvent(id: string): Promise<ActionResult> {
  if (!(await isAdmin())) return UNAUTHORIZED;
  if (!Types.ObjectId.isValid(id)) return { ok: false, error: "ID non valido." };

  try {
    await connectDB();
    const event = await Event.findById(id);
    if (!event) return { ok: false, error: "Evento non trovato." };

    const photos = await Photo.find({ event: id })
      .select("storageKey originalKey previewKey")
      .lean();
    const storage = getStorage();
    const keys = photos.flatMap((photo) =>
      [photo.storageKey, photo.originalKey, photo.previewKey].filter(
        (k): k is string => Boolean(k)
      )
    );
    const results = await Promise.allSettled(
      keys.map((key) => storage.delete(key))
    );
    const failed = results.filter((r) => r.status === "rejected").length;
    if (failed > 0) {
      console.warn(
        `[lifeshot] deleteEvent: ${failed}/${keys.length} file non eliminati dallo storage`
      );
    }
    // Elimina anche la copertina dell'evento dal cloud
    await deleteByPublicUrl(event.coverImage);

    await Photo.deleteMany({ event: id });
    await event.deleteOne();

    revalidatePublicPages();
    return { ok: true, id, slug: event.slug };
  } catch (error) {
    console.error("[lifeshot] deleteEvent fallita:", error);
    return { ok: false, error: "Errore durante l'eliminazione dell'evento." };
  }
}
