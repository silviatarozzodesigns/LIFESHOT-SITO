"use server";

import { revalidatePath } from "next/cache";
import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import { Event } from "@/models/Event";
import { Photo } from "@/models/Photo";
import { getStorage } from "@/lib/storage";
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
  revalidatePath("/");
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
    if (input.coverImage !== undefined) event.coverImage = input.coverImage;
    if (input.published !== undefined) event.published = input.published;
    await event.save();

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

    const photos = await Photo.find({ event: id }).select("storageKey").lean();
    const storage = getStorage();
    const results = await Promise.allSettled(
      photos.map((photo) => storage.delete(photo.storageKey))
    );
    const failed = results.filter((r) => r.status === "rejected").length;
    if (failed > 0) {
      console.warn(
        `[lifeshot] deleteEvent: ${failed}/${photos.length} file non eliminati dallo storage`
      );
    }

    await Photo.deleteMany({ event: id });
    await event.deleteOne();

    revalidatePublicPages();
    return { ok: true, id, slug: event.slug };
  } catch (error) {
    console.error("[lifeshot] deleteEvent fallita:", error);
    return { ok: false, error: "Errore durante l'eliminazione dell'evento." };
  }
}
