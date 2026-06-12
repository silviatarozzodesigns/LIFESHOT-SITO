import { connectDB } from "@/lib/db";
import { Video } from "@/models/Video";
import type { VideoProvider } from "@/lib/video";

export interface VideoDTO {
  id: string;
  title: string;
  url: string;
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
    provider: doc.provider as VideoProvider,
    embedId: doc.embedId,
    description: doc.description ?? "",
    published: doc.published ?? true,
    createdAt: doc.createdAt?.toISOString() ?? new Date().toISOString(),
  };
}

/** Video pubblicati, per la pagina pubblica /video */
export async function getPublishedVideos(): Promise<VideoDTO[]> {
  try {
    await connectDB();
    const docs = await Video.find({ published: true })
      .sort({ createdAt: -1 })
      .lean();
    return docs.map(toDTO);
  } catch (error) {
    console.error("[lifeshot] query video fallita:", error);
    return [];
  }
}

/** Tutti i video, per la dashboard admin */
export async function getAllVideosAdmin(): Promise<VideoDTO[]> {
  try {
    await connectDB();
    const docs = await Video.find().sort({ createdAt: -1 }).lean();
    return docs.map(toDTO);
  } catch (error) {
    console.error("[lifeshot] getAllVideosAdmin fallita:", error);
    return [];
  }
}
