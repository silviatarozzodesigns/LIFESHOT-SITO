import { unstable_cache } from "next/cache";
import { connectDB } from "@/lib/db";
import { Event, type EventCategory } from "@/models/Event";

export type { EventCategory };

/** Tag cache eventi pubblici (rivalidato a upload/modifica/eliminazione) */
export const EVENTS_TAG = "events";

/**
 * Filtro Mongo per categoria: gli eventi storici non hanno il campo
 * `category`, quindi per motorsport si accetta anche il campo assente
 * ($in con null matcha i documenti senza campo).
 */
export function categoryFilter(
  category: EventCategory
): Record<string, unknown> {
  return category === "motorsport"
    ? { category: { $in: ["motorsport", null] } }
    : { category };
}

/**
 * DTO serializzabili: i documenti Mongoose non possono attraversare il
 * confine Server → Client Component, quindi le query restituiscono oggetti
 * piatti con id stringa e date ISO.
 */
export interface EventDTO {
  id: string;
  name: string;
  slug: string;
  category: EventCategory;
  /** Data ISO, oppure "" se l'evento non ne ha una (è facoltativa) */
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
  category?: EventCategory;
  date?: Date | null;
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
    category: doc.category ?? "motorsport",
    date: doc.date ? doc.date.toISOString() : "",
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

/**
 * Eventi/progetti recenti pubblicati di una categoria (cache-ati):
 * griglia eventi su /motorsport, "Progetti recenti" su ristorazione/business.
 */
export const getRecentEvents = unstable_cache(
  async (limit = 6, category: EventCategory = "motorsport"): Promise<EventDTO[]> =>
    safe([], async () => {
      const docs = await Event.find({
        published: true,
        ...categoryFilter(category),
      })
        .sort({ date: -1, createdAt: -1 })
        .limit(limit)
        .lean();
      return docs.map(toDTO);
    }),
  ["recent-events"],
  { tags: [EVENTS_TAG], revalidate: 120 }
);

/** Eventi motorsport pubblicati (nome + slug), per la combobox dei filtri */
export const getEventsForFilter = unstable_cache(
  async (): Promise<EventDTO[]> =>
    safe([], async () => {
      const docs = await Event.find({
        published: true,
        ...categoryFilter("motorsport"),
      })
        .sort({ date: -1, createdAt: -1 })
        .lean();
      return docs.map(toDTO);
    }),
  ["events-for-filter"],
  { tags: [EVENTS_TAG], revalidate: 120 }
);

export async function getEventBySlug(slug: string): Promise<EventDTO | null> {
  return safe(null, async () => {
    const doc = await Event.findOne({ slug, published: true }).lean();
    return doc ? toDTO(doc) : null;
  });
}

/**
 * Progetto pubblicato di una categoria per slug — pagina progetto
 * (/ristorazione/[slug] e /business/[slug]).
 */
export async function getProjectBySlug(
  category: EventCategory,
  slug: string
): Promise<EventDTO | null> {
  return safe(null, async () => {
    const doc = await Event.findOne({
      slug,
      published: true,
      ...categoryFilter(category),
    }).lean();
    return doc ? toDTO(doc) : null;
  });
}
