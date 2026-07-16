import type { Metadata } from "next";
import { HomeView } from "@/components/home/home-view";
import { requireAdmin } from "@/lib/auth";
import { getRecentEvents } from "@/lib/data/events";
import { getFeaturedPhotos } from "@/lib/data/photos";
import { getDraftContent } from "@/lib/data/content";
import { getPublishedVideos } from "@/lib/data/videos";

// Anteprima riservata: contenuti BOZZA, sempre freschi, mai indicizzata.
export const dynamic = "force-dynamic";
export const metadata: Metadata = { robots: { index: false, follow: false } };

/**
 * Specchio 1:1 della pagina /motorsport con i contenuti in BOZZA del CMS.
 * Stesso identico componente del sito pubblico (HomeView).
 */
export default async function AnteprimaMotorsportPage() {
  await requireAdmin();
  const [events, marquee, content, videos] = await Promise.all([
    getRecentEvents(6),
    getFeaturedPhotos(12, "motorsport"),
    getDraftContent(),
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
