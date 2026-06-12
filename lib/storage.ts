import { promises as fs } from "fs";
import path from "path";

/**
 * Astrazione storage ibrida Locale / Cloudflare R2.
 *
 * - Senza chiavi R2 nel .env  → salva in `public/uploads` (sviluppo su PC).
 * - Con chiavi R2 configurate → usa Cloudflare R2 via SDK S3-compatibile
 *   (ambiente di produzione su Vercel, dove il filesystem è read-only).
 *
 * Tutto il resto dell'app usa solo `getStorage()` e l'interfaccia
 * `StorageAdapter`: cambiare backend non richiede modifiche altrove.
 */

export interface UploadResult {
  /** Chiave univoca nello storage (path relativo o key R2) */
  key: string;
  /** URL pubblico da salvare su MongoDB e usare nei componenti <Image> */
  url: string;
}

export interface StorageAdapter {
  upload(buffer: Buffer, key: string, contentType: string): Promise<UploadResult>;
  delete(key: string): Promise<void>;
  /** URL pubblico per una chiave esistente */
  getPublicUrl(key: string): string;
  /** Legge un file dallo storage (per post-processing server-side) */
  download(key: string): Promise<Buffer>;
  /**
   * URL prefirmato per upload diretto dal browser (PUT), bypassando il
   * limite di body (~4,5 MB) delle funzioni Vercel. R2 accetta fino a
   * 5 GB per singolo PUT. Restituisce null se il backend è locale
   * (in locale si usa l'upload diretto via API route).
   */
  presignUpload(key: string, contentType: string): Promise<string | null>;
}

function isR2Configured(): boolean {
  return Boolean(
    process.env.R2_ACCOUNT_ID &&
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY &&
      process.env.R2_BUCKET_NAME
  );
}

/* -------------------------------------------------------------------------- */
/*  Adapter locale — public/uploads (solo sviluppo)                           */
/* -------------------------------------------------------------------------- */

const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");

class LocalStorageAdapter implements StorageAdapter {
  async upload(buffer: Buffer, key: string): Promise<UploadResult> {
    const filePath = path.join(UPLOADS_DIR, key);
    // La key può contenere sottocartelle (es. "events/slug/foto.jpg")
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, buffer);
    return { key, url: this.getPublicUrl(key) };
  }

  async delete(key: string): Promise<void> {
    const filePath = path.join(UPLOADS_DIR, key);
    await fs.rm(filePath, { force: true });
  }

  getPublicUrl(key: string): string {
    return `/uploads/${key}`;
  }

  async download(key: string): Promise<Buffer> {
    return fs.readFile(path.join(UPLOADS_DIR, key));
  }

  async presignUpload(): Promise<null> {
    // In locale il browser non può scrivere sul filesystem: upload diretto
    return null;
  }
}

/* -------------------------------------------------------------------------- */
/*  Adapter Cloudflare R2 — SDK S3-compatibile (produzione su Vercel)         */
/* -------------------------------------------------------------------------- */

class R2StorageAdapter implements StorageAdapter {
  private client: import("@aws-sdk/client-s3").S3Client | null = null;
  private bucket = process.env.R2_BUCKET_NAME!;

  private async getClient() {
    if (!this.client) {
      // Import dinamico: l'SDK viene caricato solo quando R2 è attivo
      const { S3Client } = await import("@aws-sdk/client-s3");
      this.client = new S3Client({
        region: "auto",
        endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId: process.env.R2_ACCESS_KEY_ID!,
          secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
        },
      });
    }
    return this.client;
  }

  async upload(buffer: Buffer, key: string, contentType: string): Promise<UploadResult> {
    const { PutObjectCommand } = await import("@aws-sdk/client-s3");
    const client = await this.getClient();
    await client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      })
    );
    return { key, url: this.getPublicUrl(key) };
  }

  async delete(key: string): Promise<void> {
    const { DeleteObjectCommand } = await import("@aws-sdk/client-s3");
    const client = await this.getClient();
    await client.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: key })
    );
  }

  getPublicUrl(key: string): string {
    const base = process.env.R2_PUBLIC_URL?.replace(/\/$/, "");
    if (!base) {
      throw new Error(
        "R2_PUBLIC_URL non configurato: serve il dominio pubblico del bucket R2."
      );
    }
    return `${base}/${key}`;
  }

  async download(key: string): Promise<Buffer> {
    const { GetObjectCommand } = await import("@aws-sdk/client-s3");
    const client = await this.getClient();
    const response = await client.send(
      new GetObjectCommand({ Bucket: this.bucket, Key: key })
    );
    if (!response.Body) throw new Error(`Oggetto vuoto: ${key}`);
    return Buffer.from(await response.Body.transformToByteArray());
  }

  async presignUpload(key: string, contentType: string): Promise<string> {
    const { PutObjectCommand } = await import("@aws-sdk/client-s3");
    const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");
    const client = await this.getClient();
    return getSignedUrl(
      client,
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        ContentType: contentType,
      }),
      { expiresIn: 600 }
    );
  }
}

/* -------------------------------------------------------------------------- */

let adapter: StorageAdapter | null = null;

export function getStorage(): StorageAdapter {
  if (!adapter) {
    adapter = isR2Configured() ? new R2StorageAdapter() : new LocalStorageAdapter();
  }
  return adapter;
}

/** Nome del backend attivo, utile per log e dashboard */
export function getStorageBackend(): "r2" | "local" {
  return isR2Configured() ? "r2" : "local";
}
