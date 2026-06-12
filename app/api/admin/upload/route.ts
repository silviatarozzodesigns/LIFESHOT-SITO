import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import { Event } from "@/models/Event";
import { Photo } from "@/models/Photo";
import { getStorage } from "@/lib/storage";
import { isAdmin } from "@/lib/auth";
import { buildStorageKey, extractRaceNumber } from "@/lib/parse-filename";

/**
 * Upload admin (bulk foto + copertina evento).
 *
 * POST multipart/form-data:
 *   - eventId: id MongoDB dell'evento
 *   - kind:    "photo" (default) | "cover"
 *   - file:    immagine
 *
 * Workflow Nome File → Numero di Gara: per kind="photo" il numero viene
 * estratto dal nome del file (es. "evento_45_01.jpg" → tag "45").
 * Route Handler (non Server Action) per consentire alla dashboard upload
 * paralleli con stato per singolo file.
 */

export const runtime = "nodejs";

const MAX_FILE_BYTES = 30 * 1024 * 1024; // 30 MB
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);

export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json(
      { ok: false, error: "Non autorizzato." },
      { status: 401 }
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Richiesta non valida." },
      { status: 400 }
    );
  }

  const eventId = String(form.get("eventId") ?? "");
  const kind = String(form.get("kind") ?? "photo");
  const file = form.get("file");

  if (!Types.ObjectId.isValid(eventId)) {
    return NextResponse.json(
      { ok: false, error: "ID evento non valido." },
      { status: 400 }
    );
  }
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json(
      { ok: false, error: "Nessun file ricevuto." },
      { status: 400 }
    );
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json(
      { ok: false, error: `Formato non supportato (${file.type || "sconosciuto"}).` },
      { status: 415 }
    );
  }
  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json(
      { ok: false, error: "File troppo grande (max 30 MB)." },
      { status: 413 }
    );
  }

  try {
    await connectDB();
    const event = await Event.findById(eventId);
    if (!event) {
      return NextResponse.json(
        { ok: false, error: "Evento non trovato." },
        { status: 404 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const prefix = kind === "cover" ? `cover-${event.slug}` : event.slug;
    const key = buildStorageKey(prefix, file.name);
    const { url } = await getStorage().upload(buffer, key, file.type);

    if (kind === "cover") {
      event.coverImage = url;
      await event.save();
      revalidatePath("/");
      return NextResponse.json({ ok: true, url });
    }

    // kind === "photo": estrazione automatica del numero di gara dal nome file
    const raceNumber = extractRaceNumber(file.name);
    const photo = await Photo.create({
      event: event._id,
      originalFilename: file.name,
      storageKey: key,
      url,
      raceNumber,
      sizeBytes: file.size,
      mimeType: file.type,
    });
    await Event.updateOne({ _id: event._id }, { $inc: { photoCount: 1 } });

    revalidatePath("/");
    revalidatePath("/galleria");

    return NextResponse.json({
      ok: true,
      photo: {
        id: String(photo._id),
        url,
        raceNumber,
        originalFilename: file.name,
      },
    });
  } catch (error) {
    console.error("[lifeshot] upload fallito:", error);
    return NextResponse.json(
      { ok: false, error: "Errore durante il caricamento." },
      { status: 500 }
    );
  }
}
