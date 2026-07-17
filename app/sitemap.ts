import type { MetadataRoute } from "next";
import { getEventsForFilter, getRecentEvents } from "@/lib/data/events";
import { getPhotoSitemapEntries } from "@/lib/data/photos";
import { galleryHref } from "@/lib/gallery-url";

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

  // La pagina di ogni evento pubblicato: è quella che intercetta chi cerca
  // "foto <nome gara>" su Google, quindi ha priorità alta
  const events = await getEventsForFilter();
  const eventPages: MetadataRoute.Sitemap = events.map((e) => ({
    url: `${BASE}${galleryHref({ evento: e.slug })}`,
    lastModified: e.date ? new Date(e.date) : now,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  // Pagine progetto di ristorazione e business
  const [ristorazione, business] = await Promise.all([
    getRecentEvents(100, "ristorazione"),
    getRecentEvents(100, "business"),
  ]);
  const projectPages: MetadataRoute.Sitemap = [
    ...ristorazione.map((p) => ({ base: "ristorazione", p })),
    ...business.map((p) => ({ base: "business", p })),
  ].map(({ base, p }) => ({
    url: `${BASE}/${base}/${encodeURIComponent(p.slug)}`,
    lastModified: p.date ? new Date(p.date) : now,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  // Pagina di dettaglio di ogni foto pubblicata
  const photos = await getPhotoSitemapEntries();
  const photoPages: MetadataRoute.Sitemap = photos.map((p) => ({
    url: `${BASE}/foto/${p.id}`,
    lastModified: new Date(p.updatedAt),
    changeFrequency: "monthly",
    priority: 0.5,
  }));

  return [...staticPages, ...eventPages, ...projectPages, ...photoPages];
}
