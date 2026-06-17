"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import { Event } from "@/models/Event";
import { Photo } from "@/models/Photo";
import { getStorage } from "@/lib/storage";
import { isAdmin } from "@/lib/auth";
import { PHOTOS_TAG } from "@/lib/data/photos";
import { EVENTS_TAG } from "@/lib/data/events";

export type PhotoActionResult = { ok: true } | { ok: false; error: string };

const UNAUTHORIZED = {
  ok: false as const,
  error: "Non autorizzato: effettua il login admin.",
};

function revalidatePublicPages() {
  revalidateTag(PHOTOS_TAG);
  revalidateTag(EVENTS_TAG);
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

    // Elimina la preview filigranata, l'originale pulito e la preview baked
    const keys = [photo.storageKey, photo.originalKey, photo.previewKey].filter(
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
 * Marca/smarca una foto come "Dietro l'obiettivo" (featured): è la curatela
 * della galleria in homepage, che mostra solo gli scatti scelti dall'admin.
 */
export async function togglePhotoFeatured(
  id: string,
  featured: boolean
): Promise<PhotoActionResult> {
  if (!(await isAdmin())) return UNAUTHORIZED;
  if (!Types.ObjectId.isValid(id)) return { ok: false, error: "ID non valido." };

  try {
    await connectDB();
    const updated = await Photo.findByIdAndUpdate(id, { featured });
    if (!updated) return { ok: false, error: "Foto non trovata." };
    revalidateTag(PHOTOS_TAG);
    revalidatePath("/");
    return { ok: true };
  } catch (error) {
    console.error("[lifeshot] togglePhotoFeatured fallita:", error);
    return { ok: false, error: "Errore durante l'aggiornamento." };
  }
}

/** Massimi per evitare abusi/payload enormi dai campi multi-tag. */
const MAX_TAGS = 20;
const MAX_TAG_LEN = 100;

/**
 * Pulisce una lista di tag liberi: trim, scarta i vuoti, taglia quelli
 * troppo lunghi, deduplica (case-insensitive) preservando l'ordine.
 */
function cleanTags(tags: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of tags) {
    const value = String(raw).trim().slice(0, MAX_TAG_LEN);
    if (!value) continue;
    const key = value.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(value);
    if (out.length >= MAX_TAGS) break;
  }
  return out;
}

/**
 * Aggiorna i tag di una foto: numeri di gara e nomi pilota (multi-tag,
 * testo libero — es. "senza numero"). Scrive sugli array `raceNumbers` /
 * `pilotNames` e azzera i vecchi campi singoli per evitare doppioni.
 */
export async function updatePhotoMeta(
  id: string,
  meta: { raceNumbers?: string[]; pilotNames?: string[] }
): Promise<PhotoActionResult> {
  if (!(await isAdmin())) return UNAUTHORIZED;
  if (!Types.ObjectId.isValid(id)) return { ok: false, error: "ID non valido." };

  const set: Record<string, string[]> = {};
  const unset: Record<string, "" > = {};
  if (meta.raceNumbers !== undefined) {
    set.raceNumbers = cleanTags(meta.raceNumbers);
    unset.raceNumber = ""; // rimuovi il campo legacy: ora vale l'array
  }
  if (meta.pilotNames !== undefined) {
    set.pilotNames = cleanTags(meta.pilotNames);
    unset.pilotName = "";
  }
  if (Object.keys(set).length === 0) return { ok: true };

  try {
    await connectDB();
    const updated = await Photo.findByIdAndUpdate(id, { $set: set, $unset: unset });
    if (!updated) return { ok: false, error: "Foto non trovata." };

    revalidatePublicPages();
    return { ok: true };
  } catch (error) {
    console.error("[lifeshot] updatePhotoMeta fallita:", error);
    return { ok: false, error: "Errore durante l'aggiornamento." };
  }
}
