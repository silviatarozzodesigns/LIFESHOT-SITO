import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import { Event } from "@/models/Event";
import { Photo } from "@/models/Photo";
import { getStorage } from "@/lib/storage";
import { isAdmin } from "@/lib/auth";
import { extractRaceNumber } from "@/lib/parse-filename";
import { createCoverImage, getPreviewDimensions } from "@/lib/watermark";
import { getPublishedContent } from "@/lib/data/content";

/**
 * Step 2 dell'upload presigned: il file originale è già su R2; qui viene
 * scaricato, filigranato (sharp) e registrato su MongoDB.
 *
 * POST JSON: { eventId, key, filename, contentType, size, kind? }
 */

export const runtime = "nodejs";
// La generazione della preview su foto pesanti può superare i 10s di default
export const maxDuration = 60;

// Oltre questa soglia la filigrana in memoria non è praticabile in serverless
const MAX_PROCESS_BYTES = 200 * 1024 * 1024; // 200 MB

export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json(
      { ok: false, error: "Non autorizzato." },
      { status: 401 }
    );
  }

  let body: {
    eventId?: string;
    key?: string;
    filename?: string;
    contentType?: string;
    size?: number;
    kind?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Richiesta non valida." },
      { status: 400 }
    );
  }

  const { eventId = "", key = "", filename = "", size = 0 } = body;
  const kind = body.kind === "cover" ? "cover" : "photo";

  if (!Types.ObjectId.isValid(eventId) || !key || !filename) {
    return NextResponse.json(
      { ok: false, error: "Parametri mancanti." },
      { status: 400 }
    );
  }
  if (size > MAX_PROCESS_BYTES) {
    return NextResponse.json(
      {
        ok: false,
        error: "File oltre i 200 MB: la filigrana automatica non è disponibile.",
      },
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

    // La chiave deve appartenere all'evento dichiarato (niente path arbitrari)
    const expectedPrefix =
      kind === "cover"
        ? `events/cover-${event.slug}/`
        : `events/${event.slug}/original/`;
    if (!key.startsWith(expectedPrefix)) {
      return NextResponse.json(
        { ok: false, error: "Chiave storage non valida per questo evento." },
        { status: 400 }
      );
    }

    const storage = getStorage();
    const original = await storage.download(key);

    if (kind === "cover") {
      const coverBuffer = await createCoverImage(original);
      const coverKey = key.replace(/\.[^.]+$/, "") + "-web.jpg";
      const { url } = await storage.upload(coverBuffer, coverKey, "image/jpeg");
      // L'upload grezzo della copertina non serve più: resta solo la versione web
      await storage.delete(key).catch(() => {});
      event.coverImage = url;
      await event.save();
      revalidatePath("/");
      return NextResponse.json({ ok: true, url });
    }

    // kind === "photo": l'originale resta privato su R2; la versione
    // pubblica filigranata viene generata al volo da /api/images/<id>
    const dimensions = await getPreviewDimensions(original);
    const raceNumber = extractRaceNumber(filename);
    const { settings } = await getPublishedContent();
    const photoId = new Types.ObjectId();
    const photo = await Photo.create({
      _id: photoId,
      event: event._id,
      originalFilename: filename,
      storageKey: key,
      url: `/api/images/${photoId}`,
      originalKey: key,
      raceNumber,
      width: dimensions.width,
      height: dimensions.height,
      sizeBytes: size || original.length,
      mimeType: body.contentType ?? "image/jpeg",
      watermark: settings.watermarkEnabled,
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
        originalFilename: filename,
      },
    });
  } catch (error) {
    console.error("[lifeshot] upload/complete fallito:", error);
    return NextResponse.json(
      { ok: false, error: "Errore durante l'elaborazione del file." },
      { status: 500 }
    );
  }
}
