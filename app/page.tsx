import { HomeView } from "@/components/home/home-view";
import { getRecentEvents } from "@/lib/data/events";
import { getFeaturedPhotos } from "@/lib/data/photos";
import { getPublishedContent } from "@/lib/data/content";

// ISR: la home è servita da cache (navigazione istantanea) e rigenerata
// on-demand — ogni upload/pubblicazione/eliminazione chiama revalidatePath("/").
// Il revalidate orario è solo una rete di sicurezza.
export const revalidate = 3600;

export default async function HomePage() {
  const [events, marquee, content] = await Promise.all([
    getRecentEvents(6),
    getFeaturedPhotos(12),
    getPublishedContent(),
  ]);

  return <HomeView content={content} events={events} marquee={marquee} />;
}
