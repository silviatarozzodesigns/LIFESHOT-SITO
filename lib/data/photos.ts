import { Types } from "mongoose";
import { unstable_cache } from "next/cache";
import { connectDB } from "@/lib/db";
import { Event } from "@/models/Event";
import { Photo } from "@/models/Photo";
import { BEHIND_LENS_SLUG } from "@/lib/site";
import { shuffle, interleaveByKey } from "@/lib/shuffle";
import { isNoNumberQuery, NO_NUMBER_REGEX } from "@/lib/tag-match";

/** Tag cache foto pubbliche (rivalidato a upload/modifica/eliminazione) */
export const PHOTOS_TAG = "photos";

export interface PhotoDTO {
  id: string;
  /** Tutti i numeri di gara taggati (multi-tag) */
  raceNumbers: string[];
  /** Tutti i nomi pilota taggati (multi-tag) */
  pilotNames: string[];
  /** Primo numero di gara — comodo per badge/anteprime (retro-compat) */
  raceNumber: string | null;
  /** Primo pilota — comodo per anteprime (retro-compat) */
  pilotName: string | null;
  url: string;
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

/**
 * Normalizza i tag di una foto: usa gli array multi-tag se presenti,
 * altrimenti ricade sul vecchio campo singolo (retro-compatibilità).
 */
export function normalizeTags(doc: {
  raceNumbers?: string[] | null;
  pilotNames?: string[] | null;
  raceNumber?: string | null;
  pilotName?: string | null;
}): { raceNumbers: string[]; pilotNames: string[] } {
  const raceNumbers =
    doc.raceNumbers && doc.raceNumbers.length
      ? doc.raceNumbers
      : doc.raceNumber
        ? [doc.raceNumber]
        : [];
  const pilotNames =
    doc.pilotNames && doc.pilotNames.length
      ? doc.pilotNames
      : doc.pilotName
        ? [doc.pilotName]
        : [];
  return { raceNumbers, pilotNames };
}

/**
 * Chiave-soggetto per l'interleave dello shuffle: identifica "chi" è nello
 * scatto. Nelle gare il numero coincide col pilota, quindi alternando sul
 * primo numero (poi pilota, poi id) si evitano sia numeri sia piloti
 * consecutivi uguali.
 */
function subjectKey(doc: {
  _id: unknown;
  raceNumbers?: string[] | null;
  pilotNames?: string[] | null;
  raceNumber?: string | null;
  pilotName?: string | null;
}): string {
  const { raceNumbers, pilotNames } = normalizeTags(doc);
  const key = raceNumbers[0] ?? pilotNames[0];
  return key ? key.trim().toLowerCase() : String(doc._id);
}

export interface PhotoSearchParams {
  /** Slug dell'evento selezionato nella combobox */
  eventSlug?: string;
  /** Numero di gara digitato dall'utente */
  raceNumber?: string;
  /** Nome (anche parziale) del pilota */
  pilotName?: string;
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
  raceNumbers?: string[] | null;
  pilotNames?: string[] | null;
  raceNumber?: string | null;
  pilotName?: string | null;
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
  const { raceNumbers, pilotNames } = normalizeTags(doc);
  return {
    id: String(doc._id),
    raceNumbers,
    pilotNames,
    raceNumber: raceNumbers[0] ?? null,
    pilotName: pilotNames[0] ?? null,
    url: doc.url,
    originalFilename: doc.originalFilename,
    width: doc.width ?? null,
    height: doc.height ?? null,
    createdAt: doc.createdAt?.toISOString() ?? new Date().toISOString(),
    event,
  };
}

/** Forma Mongo della regex "senza numero" (stesso pattern di lib/tag-match). */
const NO_NUMBER_MONGO = { $regex: NO_NUMBER_REGEX.source, $options: "i" };

/**
 * Costruisce il filtro Mongo per un numero di gara digitato, considerando
 * sia i nuovi array (`raceNumbers`) sia il vecchio campo singolo
 * (`raceNumber`). Per i numeri puri matcha anche le varianti con zeri
 * ("45" → "045"); "senza numero"/"SN"/"S/N" matcha tutte le forme del tag
 * (anche se finito per errore tra i piloti); per il resto del testo libero
 * ("A12") usa un match parziale.
 */
function raceNumberOr(input: string): Record<string, unknown>[] {
  const trimmed = input.trim();
  // "senza numero" e varianti → matcha tutte le diciture, in numeri E piloti
  if (isNoNumberQuery(trimmed)) {
    return [
      { raceNumbers: NO_NUMBER_REGEX },
      { raceNumber: NO_NUMBER_REGEX },
      { pilotNames: NO_NUMBER_REGEX },
      { pilotName: NO_NUMBER_REGEX },
    ];
  }
  if (/^\d+$/.test(trimmed)) {
    const variants = [trimmed, String(Number(trimmed)), trimmed.padStart(3, "0")];
    return [{ raceNumbers: { $in: variants } }, { raceNumber: { $in: variants } }];
  }
  const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const rx = { $regex: escaped, $options: "i" };
  return [{ raceNumbers: rx }, { raceNumber: rx }];
}

/** Filtro Mongo per un nome pilota (parziale, case-insensitive), array + legacy. */
function pilotNameOr(input: string): Record<string, unknown>[] {
  const escaped = input.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const rx = { $regex: escaped, $options: "i" };
  return [{ pilotNames: rx }, { pilotName: rx }];
}

/** Costruisce il filtro Mongo (evento + numero + pilota) per la galleria. */
async function buildPhotoFilter({
  eventSlug,
  raceNumber,
  pilotName,
}: PhotoSearchParams): Promise<Record<string, unknown> | null> {
  const filter: Record<string, unknown> = {};

  if (eventSlug) {
    const event = await Event.findOne({ slug: eventSlug, published: true })
      .select("_id")
      .lean();
    if (!event) return null; // evento inesistente → zero risultati
    filter.event = event._id;
  } else {
    // Galleria generale: escludi l'evento di sistema "Dietro l'obiettivo"
    const sys = await Event.findOne({ slug: BEHIND_LENS_SLUG })
      .select("_id")
      .lean();
    if (sys) filter.event = { $ne: sys._id };
  }

  // Più condizioni (numero E pilota) vanno combinate in $and: ciascuna è già
  // un $or interno (array + campo legacy), quindi non si possono fondere.
  const and: Record<string, unknown>[] = [];
  if (raceNumber?.trim()) and.push({ $or: raceNumberOr(raceNumber) });
  if (pilotName?.trim()) and.push({ $or: pilotNameOr(pilotName) });
  if (and.length) filter.$and = and;

  return filter;
}

/**
 * Ordine "shuffle intelligente" della galleria per una combinazione di filtri.
 * Calcola UNA volta (cache-ato, senza `page`) la sequenza completa di id:
 * mischia tutte le foto del filtro e le alterna per soggetto così che la
 * paginazione resti coerente tra le pagine.
 */
const getGalleryOrder = unstable_cache(
  async (params: Omit<PhotoSearchParams, "page" | "perPage">): Promise<string[]> => {
    try {
      await connectDB();
      const filter = await buildPhotoFilter(params);
      if (!filter) return [];

      const docs = await Photo.find(filter)
        .select("_id raceNumbers pilotNames raceNumber pilotName")
        .lean();

      return interleaveByKey(shuffle(docs), subjectKey).map((d) =>
        String(d._id)
      );
    } catch (error) {
      console.error("[lifeshot] ordine galleria fallito:", error);
      return [];
    }
  },
  ["gallery-order"],
  { tags: [PHOTOS_TAG], revalidate: 120 }
);

/**
 * Motore di ricerca della galleria: filtra per evento / numero / pilota,
 * applica lo shuffle intelligente e pagina sull'ordine così calcolato.
 */
async function searchPhotosUncached({
  eventSlug,
  raceNumber,
  pilotName,
  page = 1,
  perPage = 24,
}: PhotoSearchParams): Promise<PhotoSearchResult> {
  try {
    await connectDB();

    const orderedIds = await getGalleryOrder({ eventSlug, raceNumber, pilotName });
    const total = orderedIds.length;
    if (total === 0) return EMPTY_RESULT;

    const currentPage = Math.max(1, page);
    const slice = orderedIds.slice(
      (currentPage - 1) * perPage,
      currentPage * perPage
    );

    const docs = await Photo.find({ _id: { $in: slice } })
      .populate<{ event: PopulatedEvent }>("event", "name slug date location")
      .lean();

    // Rispetta l'ordine dello shuffle (il $in non garantisce l'ordine).
    const byId = new Map(docs.map((d) => [String(d._id), d]));
    const photos = slice
      .map((id) => byId.get(id))
      .filter((d): d is NonNullable<typeof d> => Boolean(d))
      .map(toDTO);

    return {
      photos,
      total,
      page: currentPage,
      totalPages: Math.ceil(total / perPage),
    };
  } catch (error) {
    console.error("[lifeshot] ricerca foto fallita:", error);
    return EMPTY_RESULT;
  }
}

/**
 * Ricerca istantanea: una sola stringa che matcha numero di gara OPPURE
 * nome pilota (usata dalla barra hero). Numerico → match anche su "045".
 */
/** Ricerca galleria — cache-ata per combinazione di filtri (tag PHOTOS_TAG) */
export const searchPhotos = unstable_cache(
  searchPhotosUncached,
  ["search-photos"],
  { tags: [PHOTOS_TAG], revalidate: 120 }
);

export async function searchPhotosByQuery(
  q: string,
  limit = 12
): Promise<PhotoDTO[]> {
  const trimmed = q.trim();
  if (trimmed.length < 1) return [];
  try {
    await connectDB();
    // Una sola stringa matcha numero di gara OPPURE pilota (array + legacy);
    // il testo libero (es. "senza numero") rientra nel ramo non-numerico.
    const or = [...raceNumberOr(trimmed), ...pilotNameOr(trimmed)];
    const docs = await Photo.find({ $or: or })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate<{ event: PopulatedEvent }>("event", "name slug date location")
      .lean();
    return docs.map(toDTO);
  } catch (error) {
    console.error("[lifeshot] ricerca istantanea fallita:", error);
    return [];
  }
}

/**
 * Foto curate per la sezione homepage "Dietro l'obiettivo".
 * Mostra ESCLUSIVAMENTE gli scatti marcati come `featured` dall'admin
 * (stella o upload diretto): se non ce n'è nessuno la sezione resta vuota.
 */
export const getFeaturedPhotos = unstable_cache(
  async (limit = 12): Promise<PhotoDTO[]> => {
    try {
      await connectDB();
      const docs = await Photo.find({ featured: true })
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate<{ event: PopulatedEvent }>("event", "name slug date location")
        .lean();
      return docs.map(toDTO);
    } catch (error) {
      console.error("[lifeshot] foto featured fallito:", error);
      return [];
    }
  },
  ["featured-photos"],
  { tags: [PHOTOS_TAG], revalidate: 120 }
);

/** Foto più recenti, per il marquee auto-scroll della homepage. */
export async function getMarqueePhotos(limit = 16): Promise<PhotoDTO[]> {
  try {
    await connectDB();
    const docs = await Photo.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate<{ event: PopulatedEvent }>("event", "name slug date location")
      .lean();
    return docs.map(toDTO);
  } catch (error) {
    console.error("[lifeshot] marquee foto fallito:", error);
    return [];
  }
}

export const getPhotoById = unstable_cache(
  async (id: string): Promise<PhotoDTO | null> => {
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
  },
  ["photo-by-id"],
  { tags: [PHOTOS_TAG], revalidate: 120 }
);
