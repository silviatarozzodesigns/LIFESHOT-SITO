import { connectDB } from "@/lib/db";
import { Video } from "@/models/Video";
import { categoryFilter } from "@/lib/data/events";
import type { EventCategory } from "@/models/Event";
import type { VideoProvider } from "@/lib/video";

export interface VideoDTO {
  id: string;
  title: string;
  url: string;
  category: EventCategory;
  provider: VideoProvider;
  embedId: string;
  description: string;
  published: boolean;
  createdAt: string;
}

function toDTO(doc: {
  _id: unknown;
  title: string;
  url: string;
  category?: EventCategory;
  provider: string;
  embedId: string;
  description?: string;
  published?: boolean;
  createdAt?: Date;
}): VideoDTO {
  return {
    id: String(doc._id),
    title: doc.title,
    url: doc.url,
    category: doc.category ?? "motorsport",
    provider: doc.provider as VideoProvider,
    embedId: doc.embedId,
    description: doc.description ?? "",
    published: doc.published ?? true,
    createdAt: doc.createdAt?.toISOString() ?? new Date().toISOString(),
  };
}

/**
 * Video pubblicati: tutti per la pagina /video, oppure quelli di una
 * categoria per la sezione video della sua pagina.
 */
export async function getPublishedVideos(
  category?: EventCategory,
  limit?: number
): Promise<VideoDTO[]> {
  try {
    await connectDB();
    const query = Video.find({
      published: true,
      ...(category ? categoryFilter(category) : {}),
    }).sort({ createdAt: -1 });
    if (limit) query.limit(limit);
    const docs = await query.lean();
    return docs.map(toDTO);
  } catch (error) {
    console.error("[lifeshot] query video fallita:", error);
    return [];
  }
}

/** Tutti i video (anche non pubblicati) di una categoria, per la dashboard */
export async function getAllVideosAdmin(
  category?: EventCategory
): Promise<VideoDTO[]> {
  try {
    await connectDB();
    const docs = await Video.find(category ? categoryFilter(category) : {})
      .sort({ createdAt: -1 })
      .lean();
    return docs.map(toDTO);
  } catch (error) {
    console.error("[lifeshot] getAllVideosAdmin fallita:", error);
    return [];
  }
}
