import type { MetadataRoute } from "next";
import { getEventsForFilter } from "@/lib/data/events";
import { getPhotoSitemapEntries } from "@/lib/data/photos";

/** URL pubblico del sito (in dev NEXT_PUBLIC_SITE_URL è localhost: usa il dominio reale). */
const BASE =
  process.env.NEXT_PUBLIC_SITE_URL?.startsWith("https")
    ? process.env.NEXT_PUBLIC_SITE_URL
    : "https://lifeshotmedia.it";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // Pagine statiche pubbliche (priorità decrescente)
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${BASE}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE}/motorsport`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE}/ristorazione`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE}/business`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE}/galleria`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE}/video`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE}/chi-siamo`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/contatti`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/privacy-policy`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${BASE}/cookie-policy`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
  ];

  // Galleria filtrata per ogni evento pubblicato
  const events = await getEventsForFilter();
  const eventPages: MetadataRoute.Sitemap = events.map((e) => ({
    url: `${BASE}/galleria?evento=${encodeURIComponent(e.slug)}`,
    lastModified: e.date ? new Date(e.date) : now,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  // Pagina di dettaglio di ogni foto pubblicata
  const photos = await getPhotoSitemapEntries();
  const photoPages: MetadataRoute.Sitemap = photos.map((p) => ({
    url: `${BASE}/foto/${p.id}`,
    lastModified: new Date(p.updatedAt),
    changeFrequency: "monthly",
    priority: 0.5,
  }));

  return [...staticPages, ...eventPages, ...photoPages];
}
