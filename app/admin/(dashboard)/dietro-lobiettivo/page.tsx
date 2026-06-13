import { ImageIcon, Star } from "lucide-react";
import {
  getAllFeaturedPhotosAdmin,
  getOrCreateBehindLensEventId,
} from "@/lib/data/admin";
import { UploadDropzone } from "@/components/admin/upload-dropzone";
import { PhotoAdminGrid } from "@/components/admin/photo-admin-grid";
import { FadeIn } from "@/components/motion/fade-in";

export const metadata = { title: "Dietro l'obiettivo" };
export const dynamic = "force-dynamic";

/**
 * Sezione curata della homepage. Raccoglie:
 *  - le foto marcate con la STELLA dalla griglia di un evento, e
 *  - le foto caricate DIRETTAMENTE qui (entrano già come featured).
 * Se è vuota, la galleria homepage "Dietro l'obiettivo" non appare.
 */
export default async function BehindLensAdminPage() {
  const [eventId, photos] = await Promise.all([
    getOrCreateBehindLensEventId(),
    getAllFeaturedPhotosAdmin(),
  ]);

  return (
    <div className="space-y-12">
      <FadeIn>
        <h1 className="flex items-center gap-2 text-3xl font-semibold tracking-tight">
          <Star className="h-6 w-6 text-primary" />
          Dietro l&apos;obiettivo
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Questa è la galleria curata della homepage. Marca le foto con la
          stella ⭐ dalla pagina di un evento, oppure carica qui immagini
          dedicate. Se non c&apos;è nessuna foto, in homepage la sezione resta
          vuota.
        </p>
      </FadeIn>

      {/* Upload diretto → foto già "featured" */}
      <FadeIn delay={0.08}>
        <section>
          <h2 className="text-xl font-semibold tracking-tight">
            Carica immagini dedicate
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Vanno direttamente in &laquo;Dietro l&apos;obiettivo&raquo;, senza
            essere legate a un evento pubblico.
          </p>
          <div className="mt-4">
            <UploadDropzone eventId={eventId} featured />
          </div>
        </section>
      </FadeIn>

      {/* Griglia foto in vetrina */}
      <FadeIn delay={0.12}>
        <section>
          <h2 className="flex items-center gap-2 text-xl font-semibold tracking-tight">
            <ImageIcon className="h-5 w-5" />
            In vetrina
            <span className="text-base font-normal text-muted-foreground">
              ({photos.length})
            </span>
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Togli la stella per rimuovere uno scatto dalla galleria homepage.
          </p>
          <PhotoAdminGrid photos={photos} />
        </section>
      </FadeIn>
    </div>
  );
}
