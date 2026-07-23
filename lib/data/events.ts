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
  /** Progetto "menù sfogliabile" (fodera in pelle + pagine caricate) */
  isMenu: boolean;
  /** Copertina (fronte) della fodera del menù, a tutta pagina */
  menuCoverImage: string;
  /** Fondo (retro) della fodera del menù, a tutta pagina */
  menuBackImage: string;
  /** Colore della pelle quando non c'è un'immagine (esadecimale) */
  menuLeatherColor: string;
  /** Sfoglio pagine: true = morbido, false = rigido */
  menuSoftFlip: boolean;
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
  isMenu?: boolean;
  menuCoverImage?: string;
  menuBackImage?: string;
  menuLeatherColor?: string;
  menuSoftFlip?: boolean;
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
    isMenu: doc.isMenu ?? false,
    menuCoverImage: doc.menuCoverImage ?? "",
    menuBackImage: doc.menuBackImage ?? "",
    menuLeatherColor: doc.menuLeatherColor ?? "#8a5a2b",
    menuSoftFlip: doc.menuSoftFlip ?? true,
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
 * Come `safe`, ma pensato per le query CACHE-ATE: l'errore va catturato FUORI
 * dalla cache, altrimenti la lista vuota di un guasto momentaneo resta
 * memorizzata per minuti e la sezione appare vuota anche a DB tornato a posto.
 */
async function safeCached<T>(promise: Promise<T>, fallback: T): Promise<T> {
  try {
    return await promise;
  } catch (error) {
    console.error("[lifeshot] query eventi (cache) fallita:", error);
    return fallback;
  }
}

/**
 * Eventi/progetti recenti pubblicati di una categoria (cache-ati):
 * griglia eventi su /motorsport, "Progetti recenti" su ristorazione/business.
 */
const getRecentEventsCached = unstable_cache(
  async (
    limit = 6,
    category: EventCategory = "motorsport"
  ): Promise<EventDTO[]> => {
    await connectDB();
    const docs = await Event.find({
      published: true,
      ...categoryFilter(category),
    })
      .sort({ date: -1, createdAt: -1 })
      .limit(limit)
      .lean();
    return docs.map(toDTO);
  },
  ["recent-events"],
  { tags: [EVENTS_TAG], revalidate: 120 }
);

export async function getRecentEvents(
  limit = 6,
  category: EventCategory = "motorsport"
): Promise<EventDTO[]> {
  return safeCached(getRecentEventsCached(limit, category), []);
}

/** Eventi motorsport pubblicati (nome + slug), per la combobox dei filtri */
const getEventsForFilterCached = unstable_cache(
  async (): Promise<EventDTO[]> => {
    await connectDB();
    const docs = await Event.find({
      published: true,
      ...categoryFilter("motorsport"),
    })
      .sort({ date: -1, createdAt: -1 })
      .lean();
    return docs.map(toDTO);
  },
  ["events-for-filter"],
  { tags: [EVENTS_TAG], revalidate: 120 }
);

export async function getEventsForFilter(): Promise<EventDTO[]> {
  return safeCached(getEventsForFilterCached(), []);
}

export async function getEventBySlug(slug: string): Promise<EventDTO | null> {
  return safe(null, async () => {
    const doc = await Event.findOne({ slug, published: true }).lean();
    return doc ? toDTO(doc) : null;
  });
}

/**
 * Trova un evento anche da uno slug IN PENSIONE (dopo una rinomina). Serve
 * al rimando: `/galleria/<slug-vecchio>` → il nuovo indirizzo dell'evento.
 * Se lo slug è quello attuale, `redirect` è null (nessun rimando da fare).
 */
export async function getEventByAnySlug(
  slug: string
): Promise<{ event: EventDTO; redirect: string | null } | null> {
  return safe(null, async () => {
    const doc = await Event.findOne({
      $or: [{ slug }, { slugHistory: slug }],
      published: true,
    }).lean();
    if (!doc) return null;
    const event = toDTO(doc);
    return { event, redirect: event.slug === slug ? null : event.slug };
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
