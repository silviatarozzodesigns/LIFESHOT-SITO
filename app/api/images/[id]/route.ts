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
      .select("originalKey storageKey watermark watermarkDark")
      .lean();
    if (!photo) return new Response("Not found", { status: 404 });

    const storage = getStorage();

    // Sul cloud c'è SOLO l'originale pulito: la filigrana è SEMPRE applicata
    // al volo qui, uniforme per tutto il catalogo. Mai un serve "pulito"
    // silenzioso: in caso di errore la richiesta risale al catch → 500.
    const sourceKey = photo.originalKey ?? photo.storageKey;
    if (!sourceKey) return new Response("Not found", { status: 404 });
    const original = await storage.download(sourceKey);
    // Variante: scura (default) per foto chiare, chiara/bianca per foto scure
    const wmOptions =
      photo.watermarkDark === false
        ? { color: "#ffffff", opacity: 0.5 }
        : { color: "#0a0e1a", opacity: 0.42 };
    const body =
      photo.watermark === false
        ? await createCoverImage(original)
        : (await createWatermarkedPreview(original, wmOptions)).buffer;

    return new Response(new Uint8Array(body), {
      headers: {
        "Content-Type": "image/jpeg",
        // Cache lunga su CDN e browser: la foto non cambia mai (id immutabile)
        "Cache-Control": "public, max-age=86400, s-maxage=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("[lifeshot] /api/images fallita:", error);
    return new Response("Image processing error", { status: 500 });
  }
}
