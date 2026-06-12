import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import { Event } from "@/models/Event";
import { Photo } from "@/models/Photo";

export interface PhotoDTO {
  id: string;
  url: string;
  raceNumber: string | null;
  originalFilename: string;
  width: number | null;
  height: number | null;
  createdAt: string;
  event: {
    id: string;
    name: string;
    slug: string;
    date: string;
    location: string;
  } | null;
}

export interface PhotoSearchParams {
  /** Slug dell'evento selezionato nella combobox */
  eventSlug?: string;
  /** Numero di gara digitato dall'utente */
  raceNumber?: string;
  page?: number;
  perPage?: number;
}

export interface PhotoSearchResult {
  photos: PhotoDTO[];
  total: number;
  page: number;
  totalPages: number;
}

const EMPTY_RESULT: PhotoSearchResult = {
  photos: [],
  total: 0,
  page: 1,
  totalPages: 0,
};

interface PopulatedEvent {
  _id: unknown;
  name: string;
  slug: string;
  date: Date;
  location?: string;
}

function toDTO(doc: {
  _id: unknown;
  url: string;
  raceNumber?: string | null;
  originalFilename: string;
  width?: number | null;
  height?: number | null;
  createdAt?: Date;
  event?: PopulatedEvent | Types.ObjectId | null;
}): PhotoDTO {
  const event =
    doc.event && typeof doc.event === "object" && "name" in doc.event
      ? {
          id: String(doc.event._id),
          name: doc.event.name,
          slug: doc.event.slug,
          date: doc.event.date.toISOString(),
          location: doc.event.location ?? "",
        }
      : null;
  return {
    id: String(doc._id),
    url: doc.url,
    raceNumber: doc.raceNumber ?? null,
    originalFilename: doc.originalFilename,
    width: doc.width ?? null,
    height: doc.height ?? null,
    createdAt: doc.createdAt?.toISOString() ?? new Date().toISOString(),
    event,
  };
}

/**
 * Motore di ricerca della galleria: filtra per evento e/o numero di gara,
 * con paginazione. Sfrutta l'indice composto { event, raceNumber }.
 */
export async function searchPhotos({
  eventSlug,
  raceNumber,
  page = 1,
  perPage = 24,
}: PhotoSearchParams): Promise<PhotoSearchResult> {
  try {
    await connectDB();

    const filter: Record<string, unknown> = {};

    if (eventSlug) {
      const event = await Event.findOne({ slug: eventSlug, published: true })
        .select("_id")
        .lean();
      if (!event) return EMPTY_RESULT;
      filter.event = event._id;
    }

    if (raceNumber?.trim()) {
      // "45" trova anche "045": confronto sul valore numerico quando possibile,
      // altrimenti match esatto (per pettorali alfanumerici tipo "A12")
      const trimmed = raceNumber.trim();
      if (/^\d+$/.test(trimmed)) {
        filter.raceNumber = {
          $in: [trimmed, String(Number(trimmed)), trimmed.padStart(3, "0")],
        };
      } else {
        filter.raceNumber = trimmed;
      }
    }

    const currentPage = Math.max(1, page);
    const [total, docs] = await Promise.all([
      Photo.countDocuments(filter),
      Photo.find(filter)
        .sort({ createdAt: -1 })
        .skip((currentPage - 1) * perPage)
        .limit(perPage)
        .populate<{ event: PopulatedEvent }>("event", "name slug date location")
        .lean(),
    ]);

    return {
      photos: docs.map(toDTO),
      total,
      page: currentPage,
      totalPages: Math.ceil(total / perPage),
    };
  } catch (error) {
    console.error("[lifeshot] ricerca foto fallita:", error);
    return EMPTY_RESULT;
  }
}

export async function getPhotoById(id: string): Promise<PhotoDTO | null> {
  if (!Types.ObjectId.isValid(id)) return null;
  try {
    await connectDB();
    const doc = await Photo.findById(id)
      .populate<{ event: PopulatedEvent }>("event", "name slug date location")
      .lean();
    return doc ? toDTO(doc) : null;
  } catch (error) {
    console.error("[lifeshot] lettura foto fallita:", error);
    return null;
  }
}
