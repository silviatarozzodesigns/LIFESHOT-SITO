import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  FileImage,
  Hash,
  Instagram,
  MapPin,
  User,
} from "lucide-react";
import { site } from "@/lib/site";
import { photoSrc } from "@/lib/utils";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { FadeIn } from "@/components/motion/fade-in";
import { getPhotoById } from "@/lib/data/photos";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface PhotoPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ritorno?: string }>;
}

export async function generateMetadata({
  params,
}: PhotoPageProps): Promise<Metadata> {
  const { id } = await params;
  const photo = await getPhotoById(id);
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
  const { ritorno } = await searchParams;
  const photo = await getPhotoById(id);
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

        <div className="mt-6 grid gap-10 lg:grid-cols-[1fr_360px]">
          {/* Immagine ingrandita con filigrana */}
          <FadeIn delay={0.05}>
            <div className="relative overflow-hidden rounded-2xl bg-muted">
              {/* Sempre la rotta watermark protetta, mai l'URL del bucket */}
              <Image
                src={photoSrc(photo.id)}
                alt={
                  photo.event ? `Foto — ${photo.event.name}` : "Foto Lifeshot"
                }
                width={photo.width ?? 1600}
                height={photo.height ?? 1067}
                priority
                sizes="(max-width: 1024px) 100vw, 70vw"
                className="h-auto w-full object-contain"
              />
            </div>
          </FadeIn>

          {/* Pannello informazioni + acquisto */}
          <FadeIn delay={0.12}>
            <aside className="lg:sticky lg:top-24">
              <div className="rounded-2xl border bg-card p-6">
                {photo.raceNumbers.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {photo.raceNumbers.map((n) => (
                      <span
                        key={n}
                        className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-3 py-1 text-sm font-semibold text-primary"
                      >
                        <Hash className="h-3.5 w-3.5" />
                        {n}
                      </span>
                    ))}
                  </div>
                )}

                <h1 className="mt-4 text-2xl font-semibold tracking-tight">
                  {photo.event?.name ?? "Foto Lifeshot"}
                </h1>

                <dl className="mt-4 space-y-2 text-sm text-muted-foreground">
                  {photo.pilotNames.length > 0 && (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 shrink-0" />
                      <dd>{photo.pilotNames.join(", ")}</dd>
                    </div>
                  )}
                  {photo.event && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 shrink-0" />
                      <dd>{formatDate(photo.event.date)}</dd>
                    </div>
                  )}
                  {photo.event?.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 shrink-0" />
                      <dd>{photo.event.location}</dd>
                    </div>
                  )}
                </dl>

                {/* Codice di riferimento: nome file mostrato al cliente,
                    da citare in DM per richiedere lo scatto giusto */}
                <div className="mt-5 rounded-xl border border-dashed bg-background/50 p-3">
                  <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    <FileImage className="h-3.5 w-3.5" />
                    Codice scatto
                  </p>
                  <p className="mt-1 break-all font-mono text-sm text-foreground">
                    {photo.originalFilename}
                  </p>
                </div>

                <div className="my-6 border-t" />

                <p className="text-sm text-muted-foreground">
                  Original ad alta risoluzione, senza filigrana. Scrivici in DM
                  con il codice qui sopra per riceverlo.
                </p>

                <a
                  href={site.instagramDmUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group mt-5 inline-flex h-auto min-h-12 w-full items-center justify-center gap-5 whitespace-nowrap rounded-2xl bg-primary px-5 py-3 text-center text-sm font-semibold leading-snug text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:scale-[1.02] hover:shadow-primary/40 active:scale-95"
                >
                  <Instagram className="h-6 w-6 shrink-0 transition-transform group-hover:rotate-[8deg]" />
                  <span className="leading-tight text-center"> 
                    Scrivici in DM per<br /> acquistare le tue foto 
                  </span>
                </a>
              </div>
            </aside>
          </FadeIn>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
