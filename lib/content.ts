/**
 * VISUAL CMS LIFESHOT — architettura dati multi-pagina.
 *
 * ┌─ REGISTRY (questo file) ──────────────────────────────────────────┐
 * │ Schema rigido di ciò che l'admin PUÒ modificare: campi di testo,  │
 * │ manopole di spaziatura (mappate SOLO alla scala Tailwind), SEO.   │
 * │ Font, colori e allineamenti restano blindati nel codice.          │
 * └───────────────────────────────────────────────────────────────────┘
 *
 * Struttura JSON di una pagina (salvata in draft/published su MongoDB):
 *
 *   {
 *     pages: {
 *       home: {
 *         seo:    { metaTitle, metaDescription, ogImage },
 *         texts:  { "hero.titleLine1": "I tuoi momenti,", ... },
 *         spacing:{ hero: 3, sections: 4 }   // livelli 1–5, mai pixel
 *       },
 *       video: { ... }, "chi-siamo": { ... }, contatti: { ... }
 *     }
 *   }
 *
 * `normalizeContent()` è l'unica porta d'ingresso: fonde i dati grezzi
 * col registry (default, lunghezze massime, livelli 1–5).
 */

export type SpacingLevel = 1 | 2 | 3 | 4 | 5;
export type PageSlug = "home" | "video" | "chi-siamo" | "contatti";

export interface SeoContent {
  metaTitle: string;
  metaDescription: string;
  ogImage: string;
}

export interface FieldDef {
  label: string;
  default: string;
  max: number;
  multiline?: boolean;
}

export interface SpacingDef {
  label: string;
  /** Livello → classi Tailwind LETTERALI (vincolo del design system) */
  classes: Record<SpacingLevel, string>;
  default: SpacingLevel;
}

export interface PageDef {
  label: string;
  path: string;
  seo: SeoContent;
  fields: Record<string, FieldDef>;
  spacing: Record<string, SpacingDef>;
}

export interface PageContent {
  seo: SeoContent;
  texts: Record<string, string>;
  spacing: Record<string, SpacingLevel>;
}

export interface CmsData {
  pages: Record<PageSlug, PageContent>;
}

/* ── Scale di spaziatura (stringhe letterali: requisito del JIT Tailwind) ── */

const HERO_SCALE: Record<SpacingLevel, string> = {
  1: "py-10 sm:py-14",
  2: "py-16 sm:py-20",
  3: "py-24 sm:py-32",
  4: "py-32 sm:py-40",
  5: "py-40 sm:py-52",
};

const SECTION_SCALE: Record<SpacingLevel, string> = {
  1: "py-4",
  2: "py-8",
  3: "py-12",
  4: "py-16",
  5: "py-24",
};

const BOTTOM_SCALE: Record<SpacingLevel, string> = {
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

/* ─────────────────────────── REGISTRY PAGINE ─────────────────────────── */

export const PAGES: Record<PageSlug, PageDef> = {
  home: {
    label: "Homepage",
    path: "/",
    seo: {
      metaTitle: "Lifeshot — Fotografia, Video e Grafica",
      metaDescription:
        "Lifeshot è l'agenzia creativa specializzata in fotografia sportiva, video e grafica. Trova e acquista le foto dei tuoi eventi.",
      ogImage: "",
    },
    fields: {
      "hero.eyebrow": {
        label: "Hero — occhiello",
        default: "Fotografia · Video · Grafica",
        max: 80,
      },
      "hero.titleLine1": {
        label: "Hero — titolo riga 1",
        default: "I tuoi momenti,",
        max: 80,
      },
      "hero.titleLine2": {
        label: "Hero — titolo riga 2",
        default: "scattati per durare.",
        max: 80,
      },
      "hero.subtitle": {
        label: "Hero — sottotitolo",
        default:
          "Cerca le foto del tuo evento con il tuo numero di gara e portale a casa in pochi clic.",
        max: 300,
        multiline: true,
      },
      "hero.searchPlaceholder": {
        label: "Hero — placeholder ricerca",
        default: "Il tuo numero di gara…",
        max: 60,
      },
      "events.title": {
        label: "Eventi — titolo sezione",
        default: "Eventi recenti",
        max: 80,
      },
      "events.subtitle": {
        label: "Eventi — sottotitolo",
        default: "Gli ultimi eventi coperti da Lifeshot.",
        max: 200,
      },
    },
    spacing: {
      hero: { label: "Respiro della Hero", classes: HERO_SCALE, default: 3 },
      sections: {
        label: "Spazio sezione eventi",
        classes: BOTTOM_SCALE,
        default: 4,
      },
    },
  },

  video: {
    label: "Video",
    path: "/video",
    seo: {
      metaTitle: "Video · Lifeshot",
      metaDescription:
        "Il portfolio video di Lifeshot: montaggi delle gare, reel e clip cinematiche.",
      ogImage: "",
    },
    fields: {
      "header.eyebrow": {
        label: "Occhiello",
        default: "Portfolio",
        max: 60,
      },
      "header.title": { label: "Titolo", default: "Video", max: 60 },
      "header.subtitle": {
        label: "Sottotitolo",
        default: "Montaggi delle gare, reel e clip cinematiche firmate Lifeshot.",
        max: 200,
        multiline: true,
      },
      "cta.label": {
        label: "Testo CTA sotto ogni video",
        default:
          "Vuoi un video personalizzato o una clip della tua prossima gara? Contattaci in DM!",
        max: 160,
        multiline: true,
      },
    },
    spacing: {
      header: {
        label: "Spazio d'apertura pagina",
        classes: SECTION_SCALE,
        default: 4,
      },
    },
  },

  "chi-siamo": {
    label: "Chi siamo",
    path: "/chi-siamo",
    seo: {
      metaTitle: "Chi siamo · Lifeshot",
      metaDescription:
        "Lifeshot è l'agenzia creativa di Alberto, Lorenzo e Silvia Tarozzo: fotografia, video e grafica con un'anima sola.",
      ogImage: "",
    },
    fields: {
      "intro.titleLine1": {
        label: "Intro — titolo riga 1",
        default: "Tre sguardi.",
        max: 80,
      },
      "intro.titleLine2": {
        label: "Intro — titolo riga 2",
        default: "Una sola visione.",
        max: 80,
      },
      "intro.subtitle": {
        label: "Intro — paragrafo",
        default:
          "Lifeshot nasce dalla passione di tre fratelli per l'immagine in tutte le sue forme. Dalla polvere delle piste da cross ai set più curati, raccontiamo storie attraverso fotografia, video e grafica — con la stessa ossessione per il dettaglio e per il momento giusto.",
        max: 500,
        multiline: true,
      },
      "team.title": { label: "Team — titolo", default: "Il team", max: 60 },
      "team.subtitle": {
        label: "Team — sottotitolo",
        default: "Le persone dietro ogni scatto, clip e pixel.",
        max: 160,
      },
    },
    spacing: {
      intro: {
        label: "Respiro dell'introduzione",
        classes: HERO_SCALE,
        default: 3,
      },
    },
  },

  contatti: {
    label: "Contatti",
    path: "/contatti",
    seo: {
      metaTitle: "Contatti · Lifeshot",
      metaDescription:
        "Scrivici dal form o su Instagram: foto degli eventi, video personalizzati e progetti grafici.",
      ogImage: "",
    },
    fields: {
      "intro.eyebrow": { label: "Occhiello", default: "Parliamone", max: 60 },
      "intro.titleLine1": {
        label: "Titolo riga 1",
        default: "Raccontaci cosa",
        max: 80,
      },
      "intro.titleLine2": {
        label: "Titolo riga 2",
        default: "vuoi raccontare.",
        max: 80,
      },
      "intro.subtitle": {
        label: "Sottotitolo",
        default:
          "Foto della tua gara, un video personalizzato o l'identità visiva del tuo progetto: compila il form e ti rispondiamo noi.",
        max: 300,
        multiline: true,
      },
    },
    spacing: {
      intro: {
        label: "Respiro d'apertura",
        classes: HERO_SCALE,
        default: 2,
      },
    },
  },
};

export const PAGE_SLUGS = Object.keys(PAGES) as PageSlug[];

/* ───────────────────────── default + normalizzazione ───────────────────── */

function buildDefaultPage(def: PageDef): PageContent {
  return {
    seo: { ...def.seo },
    texts: Object.fromEntries(
      Object.entries(def.fields).map(([key, field]) => [key, field.default])
    ),
    spacing: Object.fromEntries(
      Object.entries(def.spacing).map(([key, knob]) => [key, knob.default])
    ) as Record<string, SpacingLevel>,
  };
}

export const DEFAULT_CONTENT: CmsData = {
  pages: Object.fromEntries(
    PAGE_SLUGS.map((slug) => [slug, buildDefaultPage(PAGES[slug])])
  ) as Record<PageSlug, PageContent>,
};

function cleanString(value: unknown, fallback: string, max: number): string {
  if (typeof value !== "string") return fallback;
  return value.slice(0, max);
}

function clampLevel(value: unknown, fallback: SpacingLevel): SpacingLevel {
  const n = Number(value);
  if (n >= 1 && n <= 5) return Math.round(n) as SpacingLevel;
  return fallback;
}

interface RawPage {
  seo?: Partial<SeoContent>;
  texts?: Record<string, unknown>;
  spacing?: Record<string, unknown>;
}

export function normalizeContent(raw?: {
  pages?: Partial<Record<PageSlug, RawPage>>;
} | null): CmsData {
  const pages = {} as Record<PageSlug, PageContent>;
  for (const slug of PAGE_SLUGS) {
    const def = PAGES[slug];
    const rawPage = raw?.pages?.[slug];
    pages[slug] = {
      seo: {
        metaTitle: cleanString(rawPage?.seo?.metaTitle, def.seo.metaTitle, 70),
        metaDescription: cleanString(
          rawPage?.seo?.metaDescription,
          def.seo.metaDescription,
          200
        ),
        ogImage: cleanString(rawPage?.seo?.ogImage, def.seo.ogImage, 500),
      },
      texts: Object.fromEntries(
        Object.entries(def.fields).map(([key, field]) => [
          key,
          cleanString(rawPage?.texts?.[key], field.default, field.max),
        ])
      ),
      spacing: Object.fromEntries(
        Object.entries(def.spacing).map(([key, knob]) => [
          key,
          clampLevel(rawPage?.spacing?.[key], knob.default),
        ])
      ) as Record<string, SpacingLevel>,
    };
  }
  return { pages };
}

/* ───────────────────── accessor per le pagine pubbliche ─────────────────── */

export function getText(content: CmsData, slug: PageSlug, key: string): string {
  return content.pages[slug]?.texts[key] ?? PAGES[slug].fields[key]?.default ?? "";
}

export function getSpacingClass(
  content: CmsData,
  slug: PageSlug,
  knob: string
): string {
  const def = PAGES[slug].spacing[knob];
  if (!def) return "";
  const level = content.pages[slug]?.spacing[knob] ?? def.default;
  return def.classes[level];
}
