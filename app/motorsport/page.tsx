import type { Metadata } from "next";
import { HomeView } from "@/components/home/home-view";
import { getRecentEvents } from "@/lib/data/events";
import { getFeaturedPhotos } from "@/lib/data/photos";
import { getPublishedContent } from "@/lib/data/content";
import { getPublishedVideos } from "@/lib/data/videos";

// ISR: come l'ex homepage — servita da cache e rigenerata on-demand
// (ogni upload/pubblicazione chiama revalidatePath("/motorsport")).
export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const { seo } = (await getPublishedContent()).pages.home;
  return {
    title: { absolute: seo.metaTitle },
    description: seo.metaDescription,
    openGraph: {
      title: seo.metaTitle,
      description: seo.metaDescription,
      ...(seo.ogImage ? { images: [seo.ogImage] } : {}),
    },
  };
}

/**
 * MOTORSPORT — l'ex homepage al completo: hero evento 3D, ricerca per
 * numero di gara, slider scatti, eventi recenti, servizi, testimonianze
 * dei rider e scouting eventi. I contenuti CMS restano sullo slug "home"
 * → nessuna migrazione dei dati già pubblicati.
 */
export default async function MotorsportPage() {
  const [events, marquee, content, videos] = await Promise.all([
    getRecentEvents(6),
    getFeaturedPhotos(12, "motorsport"),
    getPublishedContent(),
    getPublishedVideos("motorsport", 4),
  ]);

  return (
    <HomeView
      content={content}
      events={events}
      marquee={marquee}
      videos={videos}
    />
  );
}
