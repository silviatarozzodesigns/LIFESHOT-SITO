import type { MetadataRoute } from "next";

/** URL pubblico del sito (in dev NEXT_PUBLIC_SITE_URL è localhost: usa il dominio reale). */
const BASE =
  process.env.NEXT_PUBLIC_SITE_URL?.startsWith("https")
    ? process.env.NEXT_PUBLIC_SITE_URL
    : "https://lifeshotmedia.it";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Aree non pubbliche: pannello admin e API interne
      disallow: ["/admin", "/api"],
    },
    sitemap: `${BASE}/sitemap.xml`,
    host: BASE,
  };
}
