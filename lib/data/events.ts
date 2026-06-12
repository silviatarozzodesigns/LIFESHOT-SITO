import { connectDB } from "@/lib/db";
import { Event } from "@/models/Event";

/**
 * DTO serializzabili: i documenti Mongoose non possono attraversare il
 * confine Server → Client Component, quindi le query restituiscono oggetti
 * piatti con id stringa e date ISO.
 */
export interface EventDTO {
  id: string;
  name: string;
  slug: string;
  date: string;
  location: string;
  description: string;
  coverImage: string;
  published: boolean;
  photoCount: number;
}

function toDTO(doc: {
  _id: unknown;
  name: string;
  slug: string;
  date: Date;
  location?: string;
  description?: string;
  coverImage?: string;
  published?: boolean;
  photoCount?: number;
}): EventDTO {
  return {
    id: String(doc._id),
    name: doc.name,
    slug: doc.slug,
    date: doc.date.toISOString(),
    location: doc.location ?? "",
    description: doc.description ?? "",
    coverImage: doc.coverImage ?? "",
    published: doc.published ?? true,
    photoCount: doc.photoCount ?? 0,
  };
}

/**
 * Le pagine pubbliche devono funzionare anche senza database configurato
 * (prima del setup di Atlas): in caso di errore di connessione si logga
 * e si restituisce il fallback invece di rompere la pagina.
 */
async function safe<T>(fallback: T, query: () => Promise<T>): Promise<T> {
  try {
    await connectDB();
    return await query();
  } catch (error) {
    console.error("[lifeshot] query eventi fallita:", error);
    return fallback;
  }
}

/** Eventi recenti pubblicati, per la griglia in homepage */
export async function getRecentEvents(limit = 6): Promise<EventDTO[]> {
  return safe([], async () => {
    const docs = await Event.find({ published: true })
      .sort({ date: -1 })
      .limit(limit)
      .lean();
    return docs.map(toDTO);
  });
}

/** Tutti gli eventi pubblicati (nome + slug), per la combobox dei filtri */
export async function getEventsForFilter(): Promise<EventDTO[]> {
  return safe([], async () => {
    const docs = await Event.find({ published: true })
      .sort({ date: -1 })
      .lean();
    return docs.map(toDTO);
  });
}

export async function getEventBySlug(slug: string): Promise<EventDTO | null> {
  return safe(null, async () => {
    const doc = await Event.findOne({ slug, published: true }).lean();
    return doc ? toDTO(doc) : null;
  });
}
