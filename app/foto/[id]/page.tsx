import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PhotoViewer } from "@/components/gallery/photo-viewer";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { FadeIn } from "@/components/motion/fade-in";
import {
  getPhotoById,
  getPhotoByIdFresh,
  getPhotoContextIds,
} from "@/lib/data/photos";

export const dynamic = "force-dynamic";

interface PhotoPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ritorno?: string; ctx?: string }>;
}

export async function generateMetadata({
  params,
}: PhotoPageProps): Promise<Metadata> {
  const { id } = await params;
  const photo = await getPhotoById(id).catch(() => null);
  if (!photo) return { title: "Foto non trovata" };
  return {
    title: photo.event
      ? `Foto ${photo.raceNumber ? `#${photo.raceNumber} ` : ""}— ${photo.event.name}`
      : "Foto",
  };
}

export default async function PhotoPage({
  params,
  searchParams,
}: PhotoPageProps) {
  const { id } = await params;
  const { ritorno, ctx } = await searchParams;
  const [cached, ids] = await Promise.all([
    getPhotoById(id).catch(() => null),
    getPhotoContextIds(ctx, ritorno),
  ]);
  // Un "non trovato" può venire da un guasto momentaneo finito in cache:
  // riconferma con una lettura fresca prima di rispondere 404.
  const photo = cached ?? (await getPhotoByIdFresh(id));
  if (!photo) notFound();

  // Ritorno contestuale: rispetta da dove arriva l'utente (homepage o
  // galleria con/senza filtri). Accettiamo solo path interni (anti open-redirect).
  const safeReturn =
    ritorno && ritorno.startsWith("/") && !ritorno.startsWith("//")
      ? ritorno
      : null;
  const backHref = safeReturn ?? "/galleria";
  const backLabel =
    safeReturn === "/" ? "Torna alla homepage" : "Torna alla galleria";

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />

      <main className="container flex-1 py-10 sm:py-14">
        <FadeIn>
          <Link
            href={backHref}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" />
            {backLabel}
          </Link>
        </FadeIn>

        <FadeIn delay={0.05} className="mt-6">
          <PhotoViewer
            initial={photo}
            ids={ids}
            ctx={ctx}
            ritorno={safeReturn ?? undefined}
          />
        </FadeIn>
      </main>

      <SiteFooter />
    </div>
  );
}
