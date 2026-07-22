"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { EVENTS_TAG } from "@/lib/data/events";
import { PHOTOS_TAG } from "@/lib/data/photos";
import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import {
  Event,
  EVENT_CATEGORIES,
  type EventCategory,
} from "@/models/Event";
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
  /** Data in formato ISO o yyyy-mm-dd (input type="date"). Facoltativa: "" = nessuna */
  date?: string;
  /** Macrocategoria (default motorsport per retro-compatibilità) */
  category?: EventCategory;
  location?: string;
  description?: string;
  coverImage?: string;
  published?: boolean;
  /** Progetto "menù sfogliabile" */
  isMenu?: boolean;
  /** Copertina personalizzata della fodera del menù (URL) */
  menuCoverImage?: string;
}

export type ActionResult =
  | { ok: true; id: string; slug: string }
  | { ok: false; error: string };

function validate(input: EventInput): string | null {
  if (!input.name?.trim()) return "Il nome dell'evento è obbligatorio.";
  if (input.name.trim().length > 200) return "Nome troppo lungo (max 200 caratteri).";
  // La data è facoltativa, ma se c'è dev'essere una data vera
  if (input.date && Number.isNaN(Date.parse(input.date)))
    return "Data dell'evento non valida.";
  if (input.category && !EVENT_CATEGORIES.includes(input.category))
    return "Categoria non valida.";
  return null;
}

/**
 * Genera uno slug univoco; in caso di collisione aggiunge un suffisso.
 * Controlla sia gli slug IN USO sia quelli IN PENSIONE (`slugHistory`): uno
 * slug già appartenuto a un evento non è più libero, così un vecchio link
 * non finirà mai per portare a una gara diversa da quella originale.
 */
async function uniqueSlug(name: string, excludeId?: string): Promise<string> {
  const base = slugify(name) || "evento";
  let slug = base;
  let attempt = 1;
  while (
    await Event.exists({
      $or: [{ slug }, { slugHistory: slug }],
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
  revalidatePath("/ristorazione");
  revalidatePath("/business");
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
      category: input.category ?? "motorsport",
      date: input.date ? new Date(input.date) : null,
      location: input.location?.trim() ?? "",
      description: input.description?.trim() ?? "",
      coverImage: input.coverImage ?? "",
      published: input.published ?? true,
      isMenu: input.isMenu ?? false,
      menuCoverImage: input.menuCoverImage ?? "",
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

    // Rinomina → nuovo slug. Il vecchio va in pensione (slugHistory), così
    // i link e i risultati Google col vecchio indirizzo rimandano al nuovo
    // invece di rompersi. Niente doppioni e mai lo slug corrente in storia.
    if (event.name !== input.name.trim()) {
      const oldSlug = event.slug;
      const newSlug = await uniqueSlug(input.name, id);
      if (newSlug !== oldSlug) {
        const history = new Set(event.slugHistory ?? []);
        history.add(oldSlug);
        history.delete(newSlug);
        event.slugHistory = [...history];
        event.slug = newSlug;
      }
    }
    event.name = input.name.trim();
    if (input.category) event.category = input.category;
    // Svuotare il campo nel form significa "nessuna data", non "non toccarla"
    event.date = input.date ? new Date(input.date) : null;
    event.location = input.location?.trim() ?? "";
    event.description = input.description?.trim() ?? "";
    // Cover sostituita/rimossa: elimina subito la vecchia da Cloudflare
    const previousCover = event.coverImage;
    if (input.coverImage !== undefined) event.coverImage = input.coverImage;
    if (input.published !== undefined) event.published = input.published;
    if (input.isMenu !== undefined) event.isMenu = input.isMenu;
    // Copertina del menù: come la cover, la vecchia va rimossa se sostituita
    const previousMenuCover = event.menuCoverImage;
    if (input.menuCoverImage !== undefined)
      event.menuCoverImage = input.menuCoverImage;
    await event.save();

    if (
      input.coverImage !== undefined &&
      previousCover &&
      previousCover !== input.coverImage
    ) {
      await deleteByPublicUrl(previousCover);
    }
    if (
      input.menuCoverImage !== undefined &&
      previousMenuCover &&
      previousMenuCover !== input.menuCoverImage
    ) {
      await deleteByPublicUrl(previousMenuCover);
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
