/**
 * Helper client per l'upload dei file dalla dashboard.
 *
 * Flusso in produzione (R2): presign → PUT diretto del browser su R2
 * (fino a 5 GB per file, senza passare dai limiti di Vercel) → complete
 * (il server filigrana e registra).
 * Flusso in locale: POST multipart classico su /api/admin/upload.
 */

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024 * 1024; // 5 GB

export interface UploadedPhoto {
  id?: string;
  url: string;
  raceNumber?: string | null;
  originalFilename?: string;
}

async function parseJson(response: Response) {
  const payload = await response.json().catch(() => null);
  if (!payload?.ok) {
    throw new Error(payload?.error ?? `Errore ${response.status}`);
  }
  return payload;
}

const VIDEO_TYPES = ["video/mp4", "video/webm"];

/**
 * Carica una clip video del portfolio (.mp4/.webm) e restituisce l'URL
 * pubblico da salvare sul documento Video. In produzione: PUT diretto
 * su R2 (fino a 5 GB); in locale: POST multipart.
 */
export async function uploadVideoFile(file: File): Promise<string> {
  if (!VIDEO_TYPES.includes(file.type)) {
    throw new Error("Formato non supportato: esporta la clip in .mp4 o .webm.");
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error("File troppo grande (max 5 GB).");
  }

  const presign = await parseJson(
    await fetch("/api/admin/presign", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        kind: "video",
        filename: file.name,
        contentType: file.type,
        size: file.size,
      }),
    })
  );

  if (presign.mode === "direct") {
    const formData = new FormData();
    formData.set("kind", "video");
    formData.set("file", file);
    const payload = await parseJson(
      await fetch("/api/admin/upload", { method: "POST", body: formData })
    );
    return payload.url;
  }

  const put = await fetch(presign.uploadUrl, {
    method: "PUT",
    headers: { "content-type": file.type },
    body: file,
  });
  if (!put.ok) {
    throw new Error(
      `Upload su storage fallito (${put.status}). Verifica la configurazione CORS del bucket R2.`
    );
  }
  return presign.publicUrl;
}

export async function uploadFile(
  eventId: string,
  file: File,
  kind: "photo" | "cover" = "photo"
): Promise<UploadedPhoto> {
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error("File troppo grande (max 5 GB).");
  }

  const presign = await parseJson(
    await fetch("/api/admin/presign", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        eventId,
        filename: file.name,
        contentType: file.type,
        size: file.size,
        kind,
      }),
    })
  );

  // Storage locale: upload diretto multipart
  if (presign.mode === "direct") {
    const formData = new FormData();
    formData.set("eventId", eventId);
    formData.set("kind", kind);
    formData.set("file", file);
    const payload = await parseJson(
      await fetch("/api/admin/upload", { method: "POST", body: formData })
    );
    return kind === "cover" ? { url: payload.url } : payload.photo;
  }

  // Storage R2: PUT diretto sul bucket, poi finalizzazione server-side
  const put = await fetch(presign.uploadUrl, {
    method: "PUT",
    headers: { "content-type": file.type },
    body: file,
  });
  if (!put.ok) {
    throw new Error(
      `Upload su storage fallito (${put.status}). Verifica la configurazione CORS del bucket R2.`
    );
  }

  const payload = await parseJson(
    await fetch("/api/admin/upload/complete", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        eventId,
        key: presign.key,
        filename: file.name,
        contentType: file.type,
        size: file.size,
        kind,
      }),
    })
  );
  return kind === "cover" ? { url: payload.url } : payload.photo;
}
