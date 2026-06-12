"use server";

import { revalidatePath } from "next/cache";
import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import { Event } from "@/models/Event";
import { Photo } from "@/models/Photo";
import { getStorage } from "@/lib/storage";
import { isAdmin } from "@/lib/auth";

export type PhotoActionResult = { ok: true } | { ok: false; error: string };

const UNAUTHORIZED = {
  ok: false as const,
  error: "Non autorizzato: effettua il login admin.",
};

function revalidatePublicPages() {
  revalidatePath("/");
  revalidatePath("/galleria");
}

/** Elimina una foto da MongoDB e dallo storage (locale o R2). */
export async function deletePhoto(id: string): Promise<PhotoActionResult> {
  if (!(await isAdmin())) return UNAUTHORIZED;
  if (!Types.ObjectId.isValid(id)) return { ok: false, error: "ID non valido." };

  try {
    await connectDB();
    const photo = await Photo.findById(id);
    if (!photo) return { ok: false, error: "Foto non trovata." };

    // Elimina sia la preview filigranata sia l'originale pulito
    const keys = [photo.storageKey, photo.originalKey].filter(
      (k): k is string => Boolean(k)
    );
    for (const key of keys) {
      try {
        await getStorage().delete(key);
      } catch (error) {
        // Il file potrebbe essere già stato rimosso: non blocca la pulizia del DB
        console.warn("[lifeshot] file non eliminato dallo storage:", error);
      }
    }

    await photo.deleteOne();
    await Event.updateOne({ _id: photo.event }, { $inc: { photoCount: -1 } });

    revalidatePublicPages();
    return { ok: true };
  } catch (error) {
    console.error("[lifeshot] deletePhoto fallita:", error);
    return { ok: false, error: "Errore durante l'eliminazione della foto." };
  }
}

/**
 * Corregge manualmente il numero di gara di una foto (per i file il cui
 * nome non seguiva la convenzione e sono rimasti senza tag).
 */
export async function updatePhotoRaceNumber(
  id: string,
  raceNumber: string
): Promise<PhotoActionResult> {
  if (!(await isAdmin())) return UNAUTHORIZED;
  if (!Types.ObjectId.isValid(id)) return { ok: false, error: "ID non valido." };

  const trimmed = raceNumber.trim();
  if (trimmed.length > 20)
    return { ok: false, error: "Numero di gara troppo lungo." };

  try {
    await connectDB();
    const updated = await Photo.findByIdAndUpdate(id, {
      raceNumber: trimmed || null,
    });
    if (!updated) return { ok: false, error: "Foto non trovata." };

    revalidatePublicPages();
    return { ok: true };
  } catch (error) {
    console.error("[lifeshot] updatePhotoRaceNumber fallita:", error);
    return { ok: false, error: "Errore durante l'aggiornamento." };
  }
}
