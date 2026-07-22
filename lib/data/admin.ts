import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import { Event } from "@/models/Event";
import { Photo } from "@/models/Photo";
import {
  FEATURED_CONTAINER_NAMES,
  FEATURED_CONTAINER_SLUGS,
  FEATURED_CONTAINER_SLUG_LIST,
} from "@/lib/site";
import { normalizeTags } from "@/lib/data/photos";
import { categoryFilter, type EventDTO } from "@/lib/data/events";
import type { EventCategory } from "@/models/Event";

/**
 * Query riservate alla dashboard admin: includono anche gli eventi
 * non pubblicati. Da usare SOLO dietro requireAdmin().
 */

function eventToDTO(doc: {
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
  menuMaterialImage?: string;
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
    menuMaterialImage: doc.menuMaterialImage ?? "",
    menuSoftFlip: doc.menuSoftFlip ?? true,
  };
}

export async function getAllEventsAdmin(
  category?: EventCategory
): Promise<EventDTO[]> {
  try {
    await connectDB();
    // Esclude gli eventi-contenitore di sistema (In Evidenza) dalla lista
    const docs = await Event.find({
      slug: { $nin: FEATURED_CONTAINER_SLUG_LIST },
      ...(category ? categoryFilter(category) : {}),
    })
      .sort({ date: -1, createdAt: -1 })
      .lean();
    return docs.map(eventToDTO);
  } catch (error) {
    console.error("[lifeshot] getAllEventsAdmin fallita:", error);
    return [];
  }
}

/**
 * Ritorna (creandolo se serve) l'evento-contenitore di sistema "In Evidenza"
 * della categoria: raccoglie gli scatti curati caricati direttamente da
 * GALLERY, senza legarli a un evento/progetto pubblico.
 */
export async function getOrCreateFeaturedContainerEventId(
  category: EventCategory
): Promise<string> {
  await connectDB();
  const slug = FEATURED_CONTAINER_SLUGS[category];
  const existing = await Event.findOne({ slug }).select("_id").lean();
  if (existing) return String(existing._id);
  const created = await Event.create({
    name: FEATURED_CONTAINER_NAMES[category],
    slug,
    category,
    date: new Date(),
    published: false,
  });
  return String(created._id);
}

/**
 * Foto con la stella (featured) per la sezione GALLERY dell'admin,
 * filtrate per categoria dell'evento di appartenenza.
 */
export async function getAllFeaturedPhotosAdmin(
  category?: EventCategory
): Promise<AdminPhotoDTO[]> {
  try {
    await connectDB();
    const filter: Record<string, unknown> = { featured: true };
    if (category) {
      const events = await Event.find(categoryFilter(category))
        .select("_id")
        .lean();
      filter.event = { $in: events.map((e) => e._id) };
    }
    // Stesso ordine del sito: prima la posizione scelta a mano, poi le
    // mai-ordinate (0) in ordine di caricamento. Così l'admin è lo specchio
    // di ciò che vede il visitatore.
    const docs = await Photo.find(filter)
      .sort({ featuredOrder: 1, createdAt: -1 })
      .lean();
    return docs.map(photoToAdminDTO);
  } catch (error) {
    console.error("[lifeshot] getAllFeaturedPhotosAdmin fallita:", error);
    return [];
  }
}

/**
 * Foto marcate per la "Galleria in homepage" (icona casa), filtrate per
 * categoria dell'evento: la selezione che appare nelle card della home.
 */
export async function getAllHomeFeaturedPhotosAdmin(
  category?: EventCategory
): Promise<AdminPhotoDTO[]> {
  try {
    await connectDB();
    const filter: Record<string, unknown> = { homeFeatured: true };
    if (category) {
      const events = await Event.find(categoryFilter(category))
        .select("_id")
        .lean();
      filter.event = { $in: events.map((e) => e._id) };
    }
    const docs = await Photo.find(filter)
      .sort({ homeFeaturedOrder: 1, createdAt: -1 })
      .lean();
    return docs.map(photoToAdminDTO);
  } catch (error) {
    console.error("[lifeshot] getAllHomeFeaturedPhotosAdmin fallita:", error);
    return [];
  }
}

export async function getEventByIdAdmin(id: string): Promise<EventDTO | null> {
  if (!Types.ObjectId.isValid(id)) return null;
  try {
    await connectDB();
    const doc = await Event.findById(id).lean();
    return doc ? eventToDTO(doc) : null;
  } catch (error) {
    console.error("[lifeshot] getEventByIdAdmin fallita:", error);
    return null;
  }
}

export interface AdminPhotoDTO {
  id: string;
  url: string;
  raceNumbers: string[];
  pilotNames: string[];
  originalFilename: string;
  featured: boolean;
  /** Posizione scelta a mano nella gallery "In evidenza" (0 = mai ordinata) */
  featuredOrder: number;
  /** Scelta per la "Galleria in homepage" della categoria */
  homeFeatured: boolean;
  /** Posizione scelta a mano nella "Galleria in homepage" (0 = mai ordinata) */
  homeFeaturedOrder: number;
  createdAt: string;
}

function photoToAdminDTO(doc: {
  _id: unknown;
  url: string;
  raceNumbers?: string[] | null;
  pilotNames?: string[] | null;
  raceNumber?: string | null;
  pilotName?: string | null;
  originalFilename: string;
  featured?: boolean;
  featuredOrder?: number;
  homeFeatured?: boolean;
  homeFeaturedOrder?: number;
  createdAt?: Date;
}): AdminPhotoDTO {
  const { raceNumbers, pilotNames } = normalizeTags(doc);
  return {
    id: String(doc._id),
    url: doc.url,
    raceNumbers,
    pilotNames,
    originalFilename: doc.originalFilename,
    featured: Boolean(doc.featured),
    featuredOrder: doc.featuredOrder ?? 0,
    homeFeatured: Boolean(doc.homeFeatured),
    homeFeaturedOrder: doc.homeFeaturedOrder ?? 0,
    createdAt: doc.createdAt?.toISOString() ?? new Date().toISOString(),
  };
}

export async function getPhotosByEventAdmin(
  eventId: string
): Promise<AdminPhotoDTO[]> {
  if (!Types.ObjectId.isValid(eventId)) return [];
  try {
    await connectDB();
    const docs = await Photo.find({ event: eventId })
      // Stesso ordine del sito (order, poi caricamento): così il trascinamento
      // qui è lo specchio di come le foto appaiono nell'evento pubblicato.
      .sort({ order: 1, createdAt: 1 })
      .lean();
    return docs.map(photoToAdminDTO);
  } catch (error) {
    console.error("[lifeshot] getPhotosByEventAdmin fallita:", error);
    return [];
  }
}
