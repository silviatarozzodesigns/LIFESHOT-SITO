import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import { Photo } from "@/models/Photo";
import { getStorage } from "@/lib/storage";
import { createCoverImage, createWatermarkedPreview } from "@/lib/watermark";

/**
 * Watermark protetto "on-the-fly".
 *
 * GET /api/images/<photoId>
 * 1. recupera l'ORIGINALE in modo privato da R2 (credenziali server,
 *    mai URL pubblici del bucket);
 * 2. lo elabora al volo con sharp imprimendo il wordmark Lifeshot
 *    in semitrasparenza ripetuto in diagonale;
 * 3. restituisce il buffer JPEG con header di cache aggressivi: la CDN
 *    di Vercel serve le richieste successive senza rielaborare nulla.
 *
 * La galleria pubblica punta SOLO a questa rotta: l'URL diretto del
 * file originale non viene mai esposto al browser.
 */

export const runtime = "nodejs";
export const maxDuration = 30;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!Types.ObjectId.isValid(id)) {
    return new Response("Not found", { status: 404 });
  }

  try {
    await connectDB();
    const photo = await Photo.findById(id)
      .select("originalKey storageKey mimeType watermark")
      .lean();
    if (!photo) return new Response("Not found", { status: 404 });

    const storage = getStorage();
    let body: Buffer;
    let contentType = "image/jpeg";

    if (photo.originalKey) {
      // Originale privato → preview ridimensionata per il web.
      // Con filigrana (default) o pulita se il flag è disattivato sulla foto.
      const original = await storage.download(photo.originalKey);
      body =
        photo.watermark === false
          ? await createCoverImage(original)
          : (await createWatermarkedPreview(original)).buffer;
    } else {
      // Foto legacy senza originale separato: si serve il file salvato
      body = await storage.download(photo.storageKey);
      contentType = photo.mimeType ?? "image/jpeg";
    }

    return new Response(new Uint8Array(body), {
      headers: {
        "Content-Type": contentType,
        // Cache lunga su CDN e browser: la foto non cambia mai (id immutabile)
        "Cache-Control": "public, max-age=86400, s-maxage=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("[lifeshot] /api/images fallita:", error);
    return new Response("Image processing error", { status: 500 });
  }
}
