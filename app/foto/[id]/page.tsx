import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PhotoViewer } from "@/components/gallery/photo-viewer";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { FadeIn } from "@/components/motion/fade-in";
import { formatDate, photoSrc } from "@/lib/utils";
import {
  getPhotoById,
  getPhotoByIdFresh,
  getPhotoContextIds,
  type PhotoDTO,
} from "@/lib/data/photos";

export const dynamic = "force-dynamic";

/** URL pubblico del sito (in dev NEXT_PUBLIC_SITE_URL è localhost: usa il dominio reale). */
const BASE =
  process.env.NEXT_PUBLIC_SITE_URL?.startsWith("https")
    ? process.env.NEXT_PUBLIC_SITE_URL
    : "https://lifeshotmedia.it";

/**
 * Titolo e descrizione SEO di una foto, costruiti dai tag già presenti
 * (numero di gara, pilota, evento, luogo, data). NON compaiono sul sito:
 * finiscono nel <head> e servono a Google (snippet di ricerca, Google
 * Immagini) e alle anteprime dei link condivisi.
 */
function buildPhotoSeo(photo: PhotoDTO): { title: string; description: string } {
  const nums = photo.raceNumbers.map((n) => `#${n}`).join(", ");
  const pilots = photo.pilotNames.join(", ");
  const subject = ["Foto", nums, pilots ? `di ${pilots}` : ""]
    .filter(Boolean)
    .join(" ");

  const ev = photo.event;
  const context = ev
    ? [ev.name, ev.location, ev.date ? formatDate(ev.date) : ""]
        .filter(Boolean)
        .join(", ")
    : "";

  const title = ev ? `${subject} — ${ev.name}` : subject;
  const description =
    [subject, context].filter(Boolean).join(" — ") + ". Scatto Lifeshot.";
  return { title, description };
}

export async function generateMetadata({
  params,
}: PhotoPageProps): Promise<Metadata> {
  const { id } = await params;
  const photo = await getPhotoById(id).catch(() => null);
  if (!photo) return { title: "Foto non trovata" };

  const { title, description } = buildPhotoSeo(photo);
  const image = {
    url: photoSrc(photo.id),
    ...(photo.width ? { width: photo.width } : {}),
    ...(photo.height ? { height: photo.height } : {}),
    alt: title,
  };
  return {
    title,
    description,
    // La pagina "pulita" è quella canonica: i parametri di ritorno/contesto
    // (?ritorno, ?ctx) sono solo di navigazione e non vanno indicizzati.
    alternates: { canonical: `/foto/${photo.id}` },
    openGraph: {
      title,
      description,
      type: "article",
      url: `${BASE}/foto/${photo.id}`,
      images: [image],
    },
    twitter: { card: "summary_large_image", title, description, images: [image.url] },
  };
}

interface PhotoPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ritorno?: string; ctx?: string }>;
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

  // Dati strutturati (JSON-LD) che descrivono lo scatto a Google: aiutano la
  // foto a comparire su Google Immagini con il giusto contesto e credito.
  const { title, description } = buildPhotoSeo(photo);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ImageObject",
    contentUrl: `${BASE}${photoSrc(photo.id)}`,
    url: `${BASE}/foto/${photo.id}`,
    name: title,
    description,
    creditText: "Lifeshot",
    creator: { "@type": "Organization", name: "Lifeshot" },
    copyrightNotice: "© Lifeshot",
    datePublished: photo.createdAt,
    representativeOfPage: true,
    ...(photo.width ? { width: photo.width } : {}),
    ...(photo.height ? { height: photo.height } : {}),
  };

  return (
    <div className="flex min-h-dvh flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
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
