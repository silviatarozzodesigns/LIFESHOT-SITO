import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import { Event } from "@/models/Event";
import { Photo } from "@/models/Photo";
import type { EventDTO } from "@/lib/data/events";

/**
 * Query riservate alla dashboard admin: includono anche gli eventi
 * non pubblicati. Da usare SOLO dietro requireAdmin().
 */

function eventToDTO(doc: {
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

export async function getAllEventsAdmin(): Promise<EventDTO[]> {
  try {
    await connectDB();
    const docs = await Event.find().sort({ date: -1 }).lean();
    return docs.map(eventToDTO);
  } catch (error) {
    console.error("[lifeshot] getAllEventsAdmin fallita:", error);
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
  raceNumber: string | null;
  pilotName: string | null;
  originalFilename: string;
  createdAt: string;
}

export async function getPhotosByEventAdmin(
  eventId: string
): Promise<AdminPhotoDTO[]> {
  if (!Types.ObjectId.isValid(eventId)) return [];
  try {
    await connectDB();
    const docs = await Photo.find({ event: eventId })
      .sort({ createdAt: -1 })
      .lean();
    return docs.map((doc) => ({
      id: String(doc._id),
      url: doc.url,
      raceNumber: doc.raceNumber ?? null,
      pilotName: doc.pilotName ?? null,
      originalFilename: doc.originalFilename,
      createdAt: doc.createdAt?.toISOString() ?? new Date().toISOString(),
    }));
  } catch (error) {
    console.error("[lifeshot] getPhotosByEventAdmin fallita:", error);
    return [];
  }
}
