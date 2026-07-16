"use server";

import { revalidatePath } from "next/cache";
import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import { Video } from "@/models/Video";
import { EVENT_CATEGORIES, type EventCategory } from "@/models/Event";
import { parseVideoUrl } from "@/lib/video";
import { deleteByPublicUrl } from "@/lib/storage";
import { isAdmin } from "@/lib/auth";

export type VideoActionResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

const UNAUTHORIZED = {
  ok: false as const,
  error: "Non autorizzato: effettua il login admin.",
};

/** I video compaiono su /video e nella sezione video di ogni categoria */
function revalidateVideoPages() {
  revalidatePath("/video");
  revalidatePath("/motorsport");
  revalidatePath("/ristorazione");
  revalidatePath("/business");
}

export async function createVideo(input: {
  title: string;
  url: string;
  category?: EventCategory;
  description?: string;
}): Promise<VideoActionResult> {
  if (!(await isAdmin())) return UNAUTHORIZED;

  const title = input.title?.trim();
  if (!title) return { ok: false, error: "Il titolo è obbligatorio." };
  if (input.category && !EVENT_CATEGORIES.includes(input.category))
    return { ok: false, error: "Categoria non valida." };

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
      category: input.category ?? "motorsport",
      provider: parsed.provider,
      embedId: parsed.embedId,
      description: input.description?.trim() ?? "",
      published: true,
    });
    revalidateVideoPages();
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
    // Clip caricata da noi (provider "file") → togli anche il file dal cloud,
    // altrimenti resterebbe su R2 a occupare spazio per sempre. I link
    // esterni (YouTube/Vimeo/Instagram) non hanno nulla da cancellare.
    if (deleted.provider === "file") await deleteByPublicUrl(deleted.url);
    revalidateVideoPages();
    return { ok: true, id };
  } catch (error) {
    console.error("[lifeshot] deleteVideo fallita:", error);
    return { ok: false, error: "Errore durante l'eliminazione del video." };
  }
}
