/**
 * Micro-CMS Lifeshot — definizione dei contenuti modificabili dal pannello
 * admin (testi, SEO, spaziature) con doppio stato Bozza/Pubblicato.
 *
 * I DEFAULT qui sotto sono anche il fallback: senza database (o prima
 * della prima pubblicazione) il sito mostra esattamente questi valori.
 */

export type SpacingLevel = 1 | 2 | 3 | 4 | 5;

export interface SeoContent {
  metaTitle: string;
  metaDescription: string;
  /** URL assoluto dell'immagine Open Graph (anteprima social) */
  ogImage: string;
}

export interface HeroContent {
  eyebrow: string;
  titleLine1: string;
  titleLine2: string;
  subtitle: string;
  searchPlaceholder: string;
}

export interface SectionContent {
  title: string;
  subtitle: string;
}

export interface SiteContentData {
  seo: SeoContent;
  hero: HeroContent;
  events: SectionContent;
  spacing: {
    /** Respiro verticale della Hero (1 = compatta … 5 = monumentale) */
    hero: SpacingLevel;
    /** Spazio sotto le sezioni della homepage */
    sections: SpacingLevel;
  };
}

/*
 * Mappa livello → classi Tailwind COME STRINGHE LETTERALI: il compilatore
 * JIT di Tailwind genera solo le classi che trova nel sorgente, quindi i
 * valori dinamici devono passare da una mappa statica, mai da template
 * string costruite a runtime (es. `py-${n}` NON funzionerebbe).
 */
export const HERO_SPACING: Record<SpacingLevel, string> = {
  1: "py-10 sm:py-14",
  2: "py-16 sm:py-20",
  3: "py-24 sm:py-32",
  4: "py-32 sm:py-40",
  5: "py-40 sm:py-52",
};

export const SECTION_SPACING: Record<SpacingLevel, string> = {
  1: "pb-8",
  2: "pb-12",
  3: "pb-16",
  4: "pb-24",
  5: "pb-32",
};

export const SPACING_LABELS: Record<SpacingLevel, string> = {
  1: "Compatta",
  2: "Ridotta",
  3: "Standard",
  4: "Ampia",
  5: "Monumentale",
};

export const DEFAULT_CONTENT: SiteContentData = {
  seo: {
    metaTitle: "Lifeshot — Fotografia, Video e Grafica",
    metaDescription:
      "Lifeshot è l'agenzia creativa specializzata in fotografia sportiva, video e grafica. Trova e acquista le foto dei tuoi eventi.",
    ogImage: "",
  },
  hero: {
    eyebrow: "Fotografia · Video · Grafica",
    titleLine1: "I tuoi momenti,",
    titleLine2: "scattati per durare.",
    subtitle:
      "Cerca le foto del tuo evento con il tuo numero di gara e portale a casa in pochi clic.",
    searchPlaceholder: "Il tuo numero di gara…",
  },
  events: {
    title: "Eventi recenti",
    subtitle: "Gli ultimi eventi coperti da Lifeshot.",
  },
  spacing: {
    hero: 3,
    sections: 4,
  },
};

function clampLevel(value: unknown, fallback: SpacingLevel): SpacingLevel {
  const n = Number(value);
  if (n >= 1 && n <= 5) return Math.round(n) as SpacingLevel;
  return fallback;
}

function cleanString(value: unknown, fallback: string, max: number): string {
  if (typeof value !== "string") return fallback;
  return value.slice(0, max);
}

/**
 * Normalizza dati grezzi (dal DB o dal client) nella forma completa:
 * campi mancanti → default, stringhe troncate, livelli forzati in 1–5.
 * Unica porta d'ingresso: né le action né le query si fidano dell'input.
 */
export function normalizeContent(
  raw?: Partial<SiteContentData> | null
): SiteContentData {
  const d = DEFAULT_CONTENT;
  return {
    seo: {
      metaTitle: cleanString(raw?.seo?.metaTitle, d.seo.metaTitle, 70),
      metaDescription: cleanString(
        raw?.seo?.metaDescription,
        d.seo.metaDescription,
        200
      ),
      ogImage: cleanString(raw?.seo?.ogImage, d.seo.ogImage, 500),
    },
    hero: {
      eyebrow: cleanString(raw?.hero?.eyebrow, d.hero.eyebrow, 80),
      titleLine1: cleanString(raw?.hero?.titleLine1, d.hero.titleLine1, 80),
      titleLine2: cleanString(raw?.hero?.titleLine2, d.hero.titleLine2, 80),
      subtitle: cleanString(raw?.hero?.subtitle, d.hero.subtitle, 300),
      searchPlaceholder: cleanString(
        raw?.hero?.searchPlaceholder,
        d.hero.searchPlaceholder,
        60
      ),
    },
    events: {
      title: cleanString(raw?.events?.title, d.events.title, 80),
      subtitle: cleanString(raw?.events?.subtitle, d.events.subtitle, 200),
    },
    spacing: {
      hero: clampLevel(raw?.spacing?.hero, d.spacing.hero),
      sections: clampLevel(raw?.spacing?.sections, d.spacing.sections),
    },
  };
}
