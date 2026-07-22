import Link from "next/link";
import { Home, ImageIcon, Star } from "lucide-react";
import {
  getAllFeaturedPhotosAdmin,
  getAllHomeFeaturedPhotosAdmin,
  getOrCreateFeaturedContainerEventId,
} from "@/lib/data/admin";
import type { EventCategory } from "@/models/Event";
import { UploadDropzone } from "@/components/admin/upload-dropzone";
import { PhotoAdminGrid } from "@/components/admin/photo-admin-grid";
import { FadeIn } from "@/components/motion/fade-in";
import { cn } from "@/lib/utils";

export const metadata = { title: "Gallery" };
export const dynamic = "force-dynamic";

/** Le 3 sezioni GALLERY: dove finiscono le foto con la stella ⭐ */
const SECTIONS: Array<{
  id: EventCategory;
  label: string;
  title: string;
  where: string;
}> = [
  {
    id: "motorsport",
    label: "In Evidenza — Motorsport",
    title: "In Evidenza — Motorsport",
    where: "nella galleria della pagina Motorsport",
  },
  {
    id: "ristorazione",
    label: "In Evidenza — Ristorazione",
    title: "In Evidenza — Ristorazione",
    where: "nella sezione “In evidenza” di /ristorazione",
  },
  {
    id: "business",
    label: "In Evidenza — Business",
    title: "In Evidenza — Business",
    where: "nella sezione “In evidenza” di /business",
  },
];

function isCategory(v: string | undefined): v is EventCategory {
  return v === "motorsport" || v === "ristorazione" || v === "business";
}

export default async function AdminGalleryPage({
  searchParams,
}: {
  searchParams: Promise<{ sezione?: string }>;
}) {
  const { sezione } = await searchParams;
  const active: EventCategory = isCategory(sezione) ? sezione : "motorsport";
  const section = SECTIONS.find((s) => s.id === active)!;

  const [photos, homePhotos, containerEventId] = await Promise.all([
    getAllFeaturedPhotosAdmin(active),
    getAllHomeFeaturedPhotosAdmin(active),
    getOrCreateFeaturedContainerEventId(active),
  ]);

  return (
    <div className="space-y-10">
      <FadeIn>
        <h1 className="flex items-center gap-2 text-3xl font-semibold tracking-tight">
          <Star className="h-6 w-6 text-primary" />
          Gallery
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Le gallerie curate del sito. Marca le foto con la stella ⭐ dalla
          pagina di un evento o progetto: appariranno {section.where}.
        </p>
      </FadeIn>

      {/* Sezioni */}
      <FadeIn delay={0.05}>
        <div className="flex w-fit max-w-full flex-wrap items-center gap-1 rounded-full border bg-card p-1">
          {SECTIONS.map((s) => (
            <Link
              key={s.id}
              href={`/admin/gallery?sezione=${s.id}`}
              className={cn(
                "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                active === s.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {s.label}
            </Link>
          ))}
        </div>
      </FadeIn>

      {/* Upload diretto nell'evento-contenitore "In Evidenza" della categoria */}
      <FadeIn delay={0.08}>
        <section>
          <h2 className="text-xl font-semibold tracking-tight">
            Carica immagini dedicate
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Vanno direttamente in &laquo;{section.title}&raquo;, senza essere
            legate a un evento o progetto pubblico.
          </p>
          <div className="mt-4">
            <UploadDropzone
              eventId={containerEventId}
              featured
              category={active}
            />
          </div>
        </section>
      </FadeIn>

      {/* Galleria in homepage: la selezione (icona casa) che appare nelle
          card della home. Se vuota, in home va la galleria in evidenza. */}
      <FadeIn delay={0.1}>
        <section>
          <h2 className="flex items-center gap-2 text-xl font-semibold tracking-tight">
            <Home className="h-5 w-5" />
            Galleria in homepage
            <span className="text-base font-normal text-muted-foreground">
              ({homePhotos.length})
            </span>
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Le foto che scegli qui — con l&apos;icona <Home className="inline h-3.5 w-3.5" />{" "}
            sulla foto — sono le uniche a comparire nella card di questa
            categoria in homepage. Se non ne selezioni nessuna, in homepage va
            l&apos;intera galleria in evidenza qui sotto.
          </p>
          {homePhotos.length > 0 ? (
            <PhotoAdminGrid
              photos={homePhotos}
              sortable
              orderScope="home"
              category={active}
            />
          ) : (
            <div className="mt-4 flex flex-col items-center gap-3 rounded-2xl border border-dashed py-12 text-center">
              <Home className="h-7 w-7 text-muted-foreground" />
              <p className="max-w-md text-sm text-muted-foreground">
                Nessuna selezione: in homepage compare la galleria in evidenza.
                Passa il mouse su una foto qui sotto e premi l&apos;icona{" "}
                <Home className="inline h-3.5 w-3.5" /> per metterla in homepage.
              </p>
            </div>
          )}
        </section>
      </FadeIn>

      {/* Griglia foto in vetrina */}
      <FadeIn delay={0.12}>
        <section>
          <h2 className="flex items-center gap-2 text-xl font-semibold tracking-tight">
            <ImageIcon className="h-5 w-5" />
            {section.title}
            <span className="text-base font-normal text-muted-foreground">
              ({photos.length})
            </span>
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Togli la stella per rimuovere uno scatto dalla galleria. L&apos;ordine
            qui è lo stesso che vedono i visitatori.
          </p>
          {photos.length > 0 ? (
            <PhotoAdminGrid photos={photos} sortable category={active} />
          ) : (
            <div className="mt-4 flex flex-col items-center gap-3 rounded-2xl border border-dashed py-16 text-center">
              <Star className="h-8 w-8 text-muted-foreground" />
              <p className="font-medium">Nessuna foto in evidenza</p>
              <p className="max-w-sm text-sm text-muted-foreground">
                Apri un {active === "motorsport" ? "evento" : "progetto"} da{" "}
                <Link
                  href={`/admin?categoria=${active}`}
                  className="font-medium text-primary hover:opacity-80"
                >
                  Eventi
                </Link>{" "}
                e clicca la stella sulle foto che vuoi mettere in vetrina.
              </p>
            </div>
          )}
        </section>
      </FadeIn>
    </div>
  );
}
