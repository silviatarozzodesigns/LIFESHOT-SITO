"use server";

import { revalidatePath } from "next/cache";
import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import { Video } from "@/models/Video";
import { parseVideoUrl } from "@/lib/video";
import { isAdmin } from "@/lib/auth";

export type VideoActionResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

const UNAUTHORIZED = {
  ok: false as const,
  error: "Non autorizzato: effettua il login admin.",
};

export async function createVideo(input: {
  title: string;
  url: string;
  description?: string;
}): Promise<VideoActionResult> {
  if (!(await isAdmin())) return UNAUTHORIZED;

  const title = input.title?.trim();
  if (!title) return { ok: false, error: "Il titolo è obbligatorio." };

  const parsed = parseVideoUrl(input.url ?? "");
  if (!parsed) {
    return {
      ok: false,
      error:
        "Link non riconosciuto. Sono supportati YouTube, Vimeo, Reel Instagram e file .webm/.mp4.",
    };
  }

  try {
    await connectDB();
    const video = await Video.create({
      title,
      url: input.url.trim(),
      provider: parsed.provider,
      embedId: parsed.embedId,
      description: input.description?.trim() ?? "",
      published: true,
    });
    revalidatePath("/video");
    return { ok: true, id: String(video._id) };
  } catch (error) {
    console.error("[lifeshot] createVideo fallita:", error);
    return { ok: false, error: "Errore durante il salvataggio del video." };
  }
}

export async function deleteVideo(id: string): Promise<VideoActionResult> {
  if (!(await isAdmin())) return UNAUTHORIZED;
  if (!Types.ObjectId.isValid(id)) return { ok: false, error: "ID non valido." };

  try {
    await connectDB();
    const deleted = await Video.findByIdAndDelete(id);
    if (!deleted) return { ok: false, error: "Video non trovato." };
    revalidatePath("/video");
    return { ok: true, id };
  } catch (error) {
    console.error("[lifeshot] deleteVideo fallita:", error);
    return { ok: false, error: "Errore durante l'eliminazione del video." };
  }
}
