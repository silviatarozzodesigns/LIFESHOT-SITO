import { Types } from "mongoose";
import { unstable_cache } from "next/cache";
import { connectDB } from "@/lib/db";
import { Event, type EventCategory } from "@/models/Event";
import { EVENTS_TAG, categoryFilter } from "@/lib/data/events";
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
    category: EventCategory;
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
  /** Facoltativa: un evento può non avere una data */
  date?: Date | null;
  location?: string;
  category?: EventCategory;
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
          date: doc.event.date ? doc.event.date.toISOString() : "",
          location: doc.event.location ?? "",
          category: doc.event.category ?? "motorsport",
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
    // Galleria generale (ricerca motorsport): escludi l'evento di sistema
    // "Dietro l'obiettivo" e i progetti ristorazione/business
    const excluded = await Event.find({
      $or: [
        { slug: BEHIND_LENS_SLUG },
        { category: { $in: ["ristorazione", "business"] } },
      ],
    })
      .select("_id")
      .lean();
    if (excluded.length)
      filter.event = { $nin: excluded.map((e) => e._id) };
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
 * Foto curate (stella dell'admin): "Dietro l'obiettivo" su motorsport,
 * "In evidenza" su ristorazione/business. Senza categoria mostra i
 * preferiti di tutto il sito (slide della homepage agenzia).
 */
export const getFeaturedPhotos = unstable_cache(
  async (limit = 12, category?: EventCategory): Promise<PhotoDTO[]> => {
    try {
      await connectDB();
      const filter: Record<string, unknown> = { featured: true };
      if (category) {
        // Le foto non hanno categoria propria: la ereditano dall'evento
        const events = await Event.find(categoryFilter(category))
          .select("_id")
          .lean();
        filter.event = { $in: events.map((e) => e._id) };
      }
      // L'ordine lo decide l'admin da Gallery (featuredOrder); a pari merito
      // (mai ordinate = 0) valgono le più recenti.
      const docs = await Photo.find(filter)
        .sort({ featuredOrder: 1, createdAt: -1 })
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
  { tags: [PHOTOS_TAG, EVENTS_TAG], revalidate: 120 }
);

/**
 * Foto per le card della homepage, per categoria: prima la selezione
 * "Galleria in homepage" (icona casa); se per quella categoria non ce n'è
 * nessuna, ripiega sulla galleria delle stelle (featured). Così l'admin può
 * mostrare in home solo una selezione, o lasciare tutta la vetrina.
 */
export const getHomepagePhotos = unstable_cache(
  async (limit = 8, category?: EventCategory): Promise<PhotoDTO[]> => {
    try {
      await connectDB();
      let eventFilter: Record<string, unknown> = {};
      if (category) {
        const events = await Event.find(categoryFilter(category))
          .select("_id")
          .lean();
        eventFilter = { event: { $in: events.map((e) => e._id) } };
      }
      const pick = async (match: Record<string, unknown>, orderKey: string) =>
        Photo.find({ ...match, ...eventFilter })
          .sort({ [orderKey]: 1, createdAt: -1 })
          .limit(limit)
          .populate<{ event: PopulatedEvent }>(
            "event",
            "name slug date location"
          )
          .lean();
      const homeDocs = await pick({ homeFeatured: true }, "homeFeaturedOrder");
      const docs = homeDocs.length
        ? homeDocs
        : await pick({ featured: true }, "featuredOrder");
      return docs.map(toDTO);
    } catch (error) {
      console.error("[lifeshot] foto homepage fallito:", error);
      return [];
    }
  },
  ["homepage-photos"],
  { tags: [PHOTOS_TAG, EVENTS_TAG], revalidate: 120 }
);

/**
 * Tutte le foto di un progetto/evento pubblicato, in ordine di caricamento —
 * la galleria scorrevole della pagina progetto.
 */
export const getEventPhotos = unstable_cache(
  async (eventId: string, limit = 60): Promise<PhotoDTO[]> => {
    if (!Types.ObjectId.isValid(eventId)) return [];
    try {
      await connectDB();
      const docs = await Photo.find({ event: eventId })
        // Ordine scelto a mano (order) e, a pari merito o senza ordine,
        // per caricamento. Così il trascinamento nell'admin si riflette qui.
        .sort({ order: 1, createdAt: 1 })
        .limit(limit)
        .populate<{ event: PopulatedEvent }>("event", "name slug date location")
        .lean();
      return docs.map(toDTO);
    } catch (error) {
      console.error("[lifeshot] foto progetto fallito:", error);
      return [];
    }
  },
  ["event-photos"],
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

/**
 * Lettura grezza di una foto. NON cattura gli errori: un guasto momentaneo del
 * DB deve propagarsi, mai trasformarsi in "null" (che significherebbe "non
 * esiste"). È la differenza che causava i 404 a intermittenza: il null da
 * errore finiva in cache e la foto risultava inesistente per due minuti.
 */
async function readPhotoById(id: string): Promise<PhotoDTO | null> {
  if (!Types.ObjectId.isValid(id)) return null;
  await connectDB();
  const doc = await Photo.findById(id)
    .populate<{ event: PopulatedEvent }>(
      "event",
      "name slug date location category"
    )
    .lean();
  return doc ? toDTO(doc) : null;
}

/**
 * Lettura cache-ata. Solo un vero "non trovato" viene messo in cache: gli
 * errori rilanciano, così non restano congelati come 404.
 */
export const getPhotoById = unstable_cache(readPhotoById, ["photo-by-id"], {
  tags: [PHOTOS_TAG],
  revalidate: 120,
});

/**
 * Lettura fresca, mai dalla cache: serve a CONFERMARE un "non trovato" prima
 * di rispondere 404, così un null vecchio o un errore momentaneo non fanno
 * sparire una foto che esiste.
 */
export async function getPhotoByIdFresh(id: string): Promise<PhotoDTO | null> {
  try {
    return await readPhotoById(id);
  } catch (error) {
    console.error("[lifeshot] lettura foto (fresca) fallita:", error);
    return null;
  }
}

/** Limite ampio: la navigazione copre l'intera sequenza del contesto. */
const NAV_LIMIT = 2000;

/**
 * Sequenza ordinata di id per un "contesto" di navigazione, così il dettaglio
 * foto sa cosa c'è prima e dopo lo scatto aperto. Il contesto (`ctx`) dice da
 * quale lista si arriva:
 *   g            → galleria/evento: filtri ricostruiti dall'URL di ritorno
 *   e:<eventId>  → foto di un progetto (ristorazione/business)
 *   f:<cat>      → galleria "In evidenza" (stelle) di una categoria
 *   h:<cat>      → selezione "Galleria in homepage" di una categoria
 */
async function neighborOrder(
  ctx: string | undefined,
  ritorno: string | undefined
): Promise<string[]> {
  if (!ctx) return [];
  try {
    if (ctx === "g") {
      // Ricostruisce evento/numero/pilota dall'URL di ritorno della galleria
      if (!ritorno) return [];
      const url = new URL(ritorno, "https://x");
      const match = url.pathname.match(/^\/galleria\/([^/]+)/);
      const eventSlug = match ? decodeURIComponent(match[1]) : undefined;
      return getGalleryOrder({
        eventSlug,
        raceNumber: url.searchParams.get("numero") ?? undefined,
        pilotName: url.searchParams.get("pilota") ?? undefined,
      });
    }
    const [kind, arg] = ctx.split(":");
    if (kind === "e" && arg) {
      const photos = await getEventPhotos(arg, NAV_LIMIT);
      return photos.map((p) => p.id);
    }
    if (kind === "f" && isCategory(arg)) {
      const photos = await getFeaturedPhotos(NAV_LIMIT, arg);
      return photos.map((p) => p.id);
    }
    if (kind === "h" && isCategory(arg)) {
      const photos = await getHomepagePhotos(NAV_LIMIT, arg);
      return photos.map((p) => p.id);
    }
    return [];
  } catch (error) {
    console.error("[lifeshot] ordine navigazione fallito:", error);
    return [];
  }
}

function isCategory(v: string | undefined): v is EventCategory {
  return v === "motorsport" || v === "ristorazione" || v === "business";
}

/**
 * Sequenza ordinata completa di id per il contesto da cui si apre una foto:
 * il visore del dettaglio la usa per scorrere prev/next lato client (niente
 * navigazione di rotta, niente refresh).
 */
export async function getPhotoContextIds(
  ctx: string | undefined,
  ritorno: string | undefined
): Promise<string[]> {
  return neighborOrder(ctx, ritorno);
}

/**
 * Elenco leggero (id + data ultima modifica) di tutte le foto appartenenti a
 * eventi pubblicati, per la sitemap. Niente populate né tag: solo i campi che
 * servono a generare gli URL /foto/[id].
 */
export const getPhotoSitemapEntries = unstable_cache(
  async (): Promise<{ id: string; updatedAt: string }[]> => {
    try {
      await connectDB();
      // Solo eventi motorsport: le pagine /foto/[id] servono alla ricerca
      // e all'acquisto degli scatti gara, non ai progetti vetrina
      const events = await Event.find({
        published: true,
        ...categoryFilter("motorsport"),
      })
        .select("_id")
        .lean();
      const eventIds = events.map((e) => e._id);
      if (eventIds.length === 0) return [];
      const docs = await Photo.find({ event: { $in: eventIds } })
        .select("_id updatedAt")
        .lean();
      return docs.map((d) => ({
        id: String(d._id),
        updatedAt: (
          (d as { updatedAt?: Date }).updatedAt ?? new Date()
        ).toISOString(),
      }));
    } catch (error) {
      console.error("[lifeshot] sitemap foto fallita:", error);
      return [];
    }
  },
  ["photo-sitemap"],
  { tags: [PHOTOS_TAG, EVENTS_TAG], revalidate: 3600 }
);
