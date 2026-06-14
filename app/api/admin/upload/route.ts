import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import { Event } from "@/models/Event";
import { Photo } from "@/models/Photo";
import { getStorage, deleteByPublicUrl } from "@/lib/storage";
import { isAdmin } from "@/lib/auth";
import { buildStorageKey, extractRaceNumber } from "@/lib/parse-filename";
import { createCoverImage, getPreviewDimensions } from "@/lib/watermark";
import { getPublishedContent } from "@/lib/data/content";

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

// Route usata solo con storage LOCALE (in produzione i file salgono
// direttamente su R2 via presigned URL, vedi /api/admin/presign)
const MAX_FILE_BYTES = 200 * 1024 * 1024; // 200 MB
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);
const ALLOWED_VIDEO_TYPES = new Set(["video/mp4", "video/webm"]);

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

  // kind === "asset": immagine del CMS (hero, OG) — nessun watermark
  if (kind === "asset") {
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
    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      const key = buildStorageKey("cms", file.name);
      const { url } = await getStorage().upload(buffer, key, file.type);
      return NextResponse.json({ ok: true, url });
    } catch (error) {
      console.error("[lifeshot] upload asset fallito:", error);
      return NextResponse.json(
        { ok: false, error: "Errore durante il caricamento." },
        { status: 500 }
      );
    }
  }

  // kind === "video": clip del portfolio (nessun evento, nessun watermark)
  if (kind === "video") {
    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json(
        { ok: false, error: "Nessun file ricevuto." },
        { status: 400 }
      );
    }
    if (!ALLOWED_VIDEO_TYPES.has(file.type)) {
      return NextResponse.json(
        { ok: false, error: "Formato non supportato: usa .mp4 o .webm." },
        { status: 415 }
      );
    }
    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json(
        { ok: false, error: "File troppo grande (max 200 MB in locale)." },
        { status: 413 }
      );
    }
    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      const key = buildStorageKey("videos", file.name);
      const { url } = await getStorage().upload(buffer, key, file.type);
      return NextResponse.json({ ok: true, url });
    } catch (error) {
      console.error("[lifeshot] upload video fallito:", error);
      return NextResponse.json(
        { ok: false, error: "Errore durante il caricamento." },
        { status: 500 }
      );
    }
  }

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
      { ok: false, error: "File troppo grande (max 200 MB in locale)." },
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
    const storage = getStorage();

    if (kind === "cover") {
      const previousCover = event.coverImage;
      const coverBuffer = await createCoverImage(buffer);
      const key = buildStorageKey(`cover-${event.slug}`, file.name).replace(
        /\.[^.]+$/,
        ".jpg"
      );
      const { url } = await storage.upload(coverBuffer, key, "image/jpeg");
      event.coverImage = url;
      await event.save();
      if (previousCover && previousCover !== url) {
        await deleteByPublicUrl(previousCover);
      }
      revalidatePath("/");
      return NextResponse.json({ ok: true, url });
    }

    // Su R2 resta SOLO l'originale pulito: la preview con filigrana è generata
    // al volo da /api/images/<id> (nessun duplicato salvato sul cloud).
    const originalKey = buildStorageKey(`${event.slug}/original`, file.name);
    await storage.upload(buffer, originalKey, file.type);

    const dimensions = await getPreviewDimensions(buffer);
    const raceNumber = extractRaceNumber(file.name);
    // Filigrana: valore esplicito dal form, altrimenti default globale dal CMS
    const wmField = form.get("watermark");
    const watermark =
      wmField === "true" || wmField === "false"
        ? wmField === "true"
        : (await getPublishedContent()).settings.watermarkEnabled;
    const featured = form.get("featured") === "true";

    const photoId = new Types.ObjectId();
    const photo = await Photo.create({
      _id: photoId,
      event: event._id,
      originalFilename: file.name,
      storageKey: originalKey,
      url: `/api/images/${photoId}`,
      originalKey,
      raceNumber,
      width: dimensions.width,
      height: dimensions.height,
      sizeBytes: file.size,
      mimeType: file.type,
      watermark,
      featured,
    });
    await Event.updateOne({ _id: event._id }, { $inc: { photoCount: 1 } });

    revalidatePath("/");
    revalidatePath("/galleria");

    return NextResponse.json({
      ok: true,
      photo: {
        id: String(photo._id),
        url: photo.url,
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
