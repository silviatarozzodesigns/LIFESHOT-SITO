import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar, Hash, MapPin, ShoppingBag } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { WatermarkOverlay } from "@/components/gallery/watermark-overlay";
import { FadeIn } from "@/components/motion/fade-in";
import { Button } from "@/components/ui/button";
import { getPhotoById } from "@/lib/data/photos";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface PhotoPageProps {
  params: Promise<{ id: string }>;
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

export default async function PhotoPage({ params }: PhotoPageProps) {
  const { id } = await params;
  const photo = await getPhotoById(id);
  if (!photo) notFound();

  const backHref = photo.event
    ? `/galleria?evento=${photo.event.slug}${photo.raceNumber ? `&numero=${photo.raceNumber}` : ""}`
    : "/galleria";

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
            Torna alla galleria
          </Link>
        </FadeIn>

        <div className="mt-6 grid gap-10 lg:grid-cols-[1fr_360px]">
          {/* Immagine ingrandita con filigrana */}
          <FadeIn delay={0.05}>
            <div className="relative overflow-hidden rounded-2xl bg-muted">
              <Image
                src={photo.url}
                alt={
                  photo.event ? `Foto — ${photo.event.name}` : "Foto Lifeshot"
                }
                width={photo.width ?? 1600}
                height={photo.height ?? 1067}
                priority
                sizes="(max-width: 1024px) 100vw, 70vw"
                className="h-auto w-full object-contain"
              />
              <WatermarkOverlay />
            </div>
          </FadeIn>

          {/* Pannello informazioni + acquisto */}
          <FadeIn delay={0.12}>
            <aside className="lg:sticky lg:top-24">
              <div className="rounded-2xl border bg-card p-6">
                {photo.raceNumber && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-3 py-1 text-sm font-semibold text-primary">
                    <Hash className="h-3.5 w-3.5" />
                    {photo.raceNumber}
                  </span>
                )}

                <h1 className="mt-4 text-2xl font-semibold tracking-tight">
                  {photo.event?.name ?? "Foto Lifeshot"}
                </h1>

                <dl className="mt-4 space-y-2 text-sm text-muted-foreground">
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

                <div className="my-6 border-t" />

                <p className="text-sm text-muted-foreground">
                  File ad alta risoluzione, senza filigrana, consegnato via
                  download dopo l&apos;acquisto.
                </p>

                {/*
                  PLACEHOLDER ACQUISTO — da collegare al futuro flusso di
                  checkout (es. Stripe). Il prezzo arriverà da photo.priceCents.
                */}
                <Button size="lg" className="mt-5 w-full" disabled>
                  <ShoppingBag />
                  Acquista — presto disponibile
                </Button>
              </div>
            </aside>
          </FadeIn>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
