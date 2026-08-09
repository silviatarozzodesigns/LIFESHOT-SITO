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
      // Le foto sono servite da /api/images: vanno lasciate leggere a Google
      // (compaiono su Google Immagini). Regola più specifica di "/api",
      // quindi ha la precedenza (i crawler usano il match più lungo).
      allow: ["/", "/api/images"],
      // Aree non pubbliche: pannello admin e altre API interne
      disallow: ["/admin", "/api"],
    },
    sitemap: `${BASE}/sitemap.xml`,
    host: BASE,
  };
}
