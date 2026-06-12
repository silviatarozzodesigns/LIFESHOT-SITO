import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import { Event } from "@/models/Event";
import { getStorage } from "@/lib/storage";
import { isAdmin } from "@/lib/auth";
import { buildStorageKey } from "@/lib/parse-filename";

/**
 * Step 1 dell'upload: prepara la destinazione.
 *
 * POST JSON: { eventId, filename, contentType, size, kind? }
 *
 * - Backend R2 → { mode: "presigned", uploadUrl, key }: il browser fa PUT
 *   del file DIRETTAMENTE su R2 (fino a 5 GB, senza passare da Vercel),
 *   poi chiama /api/admin/upload/complete.
 * - Backend locale → { mode: "direct" }: il browser usa il classico
 *   POST multipart su /api/admin/upload.
 */

export const runtime = "nodejs";

const MAX_FILE_BYTES = 5 * 1024 * 1024 * 1024; // 5 GB (limite PUT singolo R2)
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

  let body: {
    eventId?: string;
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

  const { eventId = "", filename = "", contentType = "", size = 0 } = body;
  const kind = body.kind === "cover" ? "cover" : "photo";

  if (!Types.ObjectId.isValid(eventId)) {
    return NextResponse.json(
      { ok: false, error: "ID evento non valido." },
      { status: 400 }
    );
  }
  if (!filename) {
    return NextResponse.json(
      { ok: false, error: "Nome file mancante." },
      { status: 400 }
    );
  }
  if (!ALLOWED_TYPES.has(contentType)) {
    return NextResponse.json(
      { ok: false, error: `Formato non supportato (${contentType || "sconosciuto"}).` },
      { status: 415 }
    );
  }
  if (size > MAX_FILE_BYTES) {
    return NextResponse.json(
      { ok: false, error: "File troppo grande (max 5 GB)." },
      { status: 413 }
    );
  }

  try {
    await connectDB();
    const event = await Event.findById(eventId).select("slug").lean();
    if (!event) {
      return NextResponse.json(
        { ok: false, error: "Evento non trovato." },
        { status: 404 }
      );
    }

    const key =
      kind === "cover"
        ? buildStorageKey(`cover-${event.slug}`, filename)
        : buildStorageKey(`${event.slug}/original`, filename);

    const uploadUrl = await getStorage().presignUpload(key, contentType);
    if (!uploadUrl) {
      // Storage locale: si procede con l'upload diretto via API route
      return NextResponse.json({ ok: true, mode: "direct" });
    }

    return NextResponse.json({ ok: true, mode: "presigned", uploadUrl, key });
  } catch (error) {
    console.error("[lifeshot] presign fallita:", error);
    return NextResponse.json(
      { ok: false, error: "Errore nella preparazione dell'upload." },
      { status: 500 }
    );
  }
}
