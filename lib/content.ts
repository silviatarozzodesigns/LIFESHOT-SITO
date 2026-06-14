/**
 * VISUAL CMS LIFESHOT — architettura dati multi-pagina.
 *
 * ┌─ REGISTRY (questo file) ──────────────────────────────────────────┐
 * │ Schema rigido di ciò che l'admin PUÒ modificare:                  │
 * │  • testi      → campi con lunghezza massima                        │
 * │  • immagini   → URL (upload dalla sidebar, anteprima istantanea)   │
 * │  • spaziature → slider 1–5 mappati SOLO a classi Tailwind          │
 * │  • tipografia → slider 1–5 mappati SOLO a scale Tailwind           │
 * │ Font, colori e allineamenti restano blindati nel codice.          │
 * └───────────────────────────────────────────────────────────────────┘
 *
 * `normalizeContent()` è l'unica porta d'ingresso: fonde i dati grezzi
 * col registry (default, lunghezze massime, livelli 1–5).
 */

export type Level = 1 | 2 | 3 | 4 | 5;
/** Alias storico per le spaziature */
export type SpacingLevel = Level;
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
  /** Knob tipografico collegato (click-to-edit: testo → controlli font) */
  typographyKnob?: string;
}

export interface ImageDef {
  label: string;
  default: string;
  hint?: string;
}

export interface ScaleDef {
  label: string;
  /** Livello → classi Tailwind LETTERALI (vincolo del design system) */
  classes: Record<Level, string>;
  default: Level;
}

export interface PageDef {
  label: string;
  path: string;
  seo: SeoContent;
  fields: Record<string, FieldDef>;
  images: Record<string, ImageDef>;
  spacing: Record<string, ScaleDef>;
  typography: Record<string, ScaleDef>;
}

/** Override di layout manuale per un'immagine (resize/posizione dal CMS) */
export interface ImageSettings {
  /** object-position orizzontale 0–100% (0 = sinistra, 100 = destra) */
  posX: number;
  /** object-position verticale 0–100% (0 = alto, 100 = basso) */
  posY: number;
  /** scala percentuale 100–280 (zoom dell'immagine nel contenitore) */
  scale: number;
  /** object-position CSS calcolato ("x% y%") — campo derivato per i consumatori */
  position: string;
}

/** object-position CSS da coordinate percentuali */
export function posToCss(posX: number, posY: number): string {
  return `${posX}% ${posY}%`;
}

/** Retrocompatibilità: mappa i vecchi nomi posizione → coordinate X/Y */
const NAMED_TO_XY: Record<string, [number, number]> = {
  "left top": [0, 0],
  "center top": [50, 0],
  "right top": [100, 0],
  "left center": [0, 50],
  center: [50, 50],
  "right center": [100, 50],
  "left bottom": [0, 100],
  "center bottom": [50, 100],
  "right bottom": [100, 100],
};

export interface PageContent {
  seo: SeoContent;
  texts: Record<string, string>;
  images: Record<string, string>;
  imageSettings: Record<string, ImageSettings>;
  spacing: Record<string, Level>;
  typography: Record<string, Level>;
}

export const DEFAULT_IMAGE_SETTINGS: ImageSettings = {
  posX: 50,
  posY: 50,
  scale: 100,
  position: "50% 50%",
};

/** Impostazioni globali del sito (non legate a una singola pagina) */
export interface SiteSettings {
  /** Applica la filigrana alle nuove foto caricate */
  watermarkEnabled: boolean;
}

export const DEFAULT_SETTINGS: SiteSettings = {
  watermarkEnabled: true,
};

export interface CmsData {
  pages: Record<PageSlug, PageContent>;
  settings: SiteSettings;
}

/* ── Scale (stringhe letterali: requisito del compilatore JIT di Tailwind) ── */

const HERO_SCALE: Record<Level, string> = {
  1: "py-10 sm:py-14",
  2: "py-16 sm:py-20",
  3: "py-24 sm:py-32",
  4: "py-32 sm:py-40",
  5: "py-40 sm:py-52",
};

const SECTION_SCALE: Record<Level, string> = {
  1: "py-6 sm:py-10",
  2: "py-10 sm:py-14",
  3: "py-14 sm:py-20",
  4: "py-20 sm:py-28",
  5: "py-24 sm:py-36",
};

const BOTTOM_SCALE: Record<Level, string> = {
  1: "pb-10 sm:pb-14",
  2: "pb-14 sm:pb-20",
  3: "pb-20 sm:pb-28",
  4: "pb-24 sm:pb-32",
  5: "pb-32 sm:pb-44",
};

/** Scala tipografica per i titoloni evento/hero (fluida ma vincolata) */
const DISPLAY_SCALE: Record<Level, string> = {
  1: "text-3xl sm:text-4xl",
  2: "text-4xl sm:text-5xl",
  3: "text-5xl sm:text-6xl",
  4: "text-5xl sm:text-7xl",
  5: "text-6xl sm:text-8xl",
};

/** Scala tipografica per i titoli di sezione */
const HEADING_SCALE: Record<Level, string> = {
  1: "text-xl sm:text-2xl",
  2: "text-2xl sm:text-3xl",
  3: "text-3xl sm:text-4xl",
  4: "text-4xl sm:text-5xl",
  5: "text-5xl sm:text-6xl",
};

export const SPACING_LABELS: Record<Level, string> = {
  1: "Compatta",
  2: "Ridotta",
  3: "Standard",
  4: "Ampia",
  5: "Monumentale",
};

export const TYPOGRAPHY_LABELS: Record<Level, string> = {
  1: "Piccolo",
  2: "Ridotto",
  3: "Standard",
  4: "Grande",
  5: "Enorme",
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
      // ── HERO 3D: prossimo evento coperto ──
      "hero.badge": {
        label: "Hero — etichetta evento",
        default: "Prossimo evento",
        max: 40,
      },
      "hero.eventName": {
        label: "Hero — nome evento",
        default: "Internazionali d'Italia",
        max: 80,
        typographyKnob: "hero.eventName",
      },
      "hero.eventDate": {
        label: "Hero — data evento",
        default: "16 SET 2026",
        max: 40,
        typographyKnob: "hero.date",
      },
      "hero.eventTime": {
        label: "Hero — orario",
        default: "09:00",
        max: 20,
      },
      "hero.eventLocation": {
        label: "Hero — luogo",
        default: "Crossodromo Il Ciglione, Mantova",
        max: 100,
      },
      "hero.subtitle": {
        label: "Hero — sottotitolo",
        default:
          "Saremo a bordo pista per immortalare ogni salto. Cerca i tuoi scatti per numero di gara.",
        max: 200,
        multiline: true,
      },
      "hero.searchPlaceholder": {
        label: "Hero — placeholder ricerca",
        // Corto di proposito: deve leggersi PER INTERO anche su telefoni stretti
        default: "Nome o numero di gara",
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
      // ── Sezione lead "Invita Lifeshot al tuo evento" ──
      "scout.title": {
        label: "Invito — titolo",
        default: "Vuoi che siamo al tuo evento?",
        max: 100,
      },
      "scout.subtitle": {
        label: "Invito — sottotitolo",
        default:
          "Scrivici dove corri la prossima gara e possiamo parlarne insieme.",
        max: 200,
        multiline: true,
      },
      "scout.button": {
        label: "Invito — testo bottone",
        default: "Segnala l'evento",
        max: 40,
      },
    },
    images: {
      // ── DESKTOP ──
      "hero.background": {
        label: "Hero Desktop — sfondo",
        // Asset vettoriale generato: paesaggio montano enduro, leggero e nitido
        default: "/hero/enduro-bg.svg",
        hint: "Foto orizzontale del tracciato o del paesaggio. ~2000px.",
      },
      "hero.foreground": {
        label: "Hero Desktop — PNG rider (overlay)",
        default: "",
        hint: "PNG con sfondo trasparente del pilota in azione.",
      },
      // ── TABLET ── (vuoti = usa lo sfondo desktop, senza rider)
      "hero.backgroundTablet": {
        label: "Hero Tablet — sfondo (opzionale)",
        default: "",
        hint: "Se vuoto usa lo sfondo desktop adattato. ~1500px.",
      },
      "hero.foregroundTablet": {
        label: "Hero Tablet — PNG rider (opzionale)",
        default: "",
        hint: "Il rider su tablet compare SOLO se carichi questo PNG.",
      },
      // ── MOBILE ── (vuoti = usa lo sfondo desktop, senza rider)
      "hero.backgroundMobile": {
        label: "Hero Mobile — sfondo (opzionale)",
        default: "",
        hint: "Immagine verticale per smartphone. Se vuota usa lo sfondo desktop.",
      },
      "hero.foregroundMobile": {
        label: "Hero Mobile — PNG rider (opzionale)",
        default: "",
        hint: "Il rider su mobile compare SOLO se carichi questo PNG.",
      },
    },
    spacing: {
      sections: {
        label: "Spazio sezione eventi",
        classes: BOTTOM_SCALE,
        default: 4,
      },
      scout: { label: "Spazio sezione invito", classes: SECTION_SCALE, default: 5 },
    },
    typography: {
      "hero.eventName": {
        label: "Dimensione nome evento",
        classes: HEADING_SCALE,
        default: 3,
      },
      "hero.date": {
        label: "Dimensione data evento",
        classes: DISPLAY_SCALE,
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
      "header.eyebrow": { label: "Occhiello", default: "Portfolio", max: 60 },
      "header.title": {
        label: "Titolo",
        default: "Video",
        max: 60,
        typographyKnob: "header.title",
      },
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
    images: {},
    spacing: {
      header: { label: "Spazio d'apertura pagina", classes: SECTION_SCALE, default: 4 },
    },
    typography: {
      "header.title": {
        label: "Dimensione titolo",
        classes: HEADING_SCALE,
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
        typographyKnob: "intro.title",
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
      // ── Schede team (nome, ruolo, bio — tutti editabili) ──
      "team.m1.name": { label: "Membro 1 — nome", default: "Alberto Tarozzo", max: 60 },
      "team.m1.role": { label: "Membro 1 — ruolo", default: "Fotografo", max: 40 },
      "team.m1.bio": {
        label: "Membro 1 — bio",
        default:
          "L'occhio dietro l'obiettivo. Vive il bordo pista come pochi: anticipa la traiettoria, congela il decimo di secondo che racconta tutta la gara. Ogni scatto è un istante che non torna — il suo lavoro è non lasciarselo scappare.",
        max: 400,
        multiline: true,
      },
      "team.m2.name": { label: "Membro 2 — nome", default: "Lorenzo Tarozzo", max: 60 },
      "team.m2.role": { label: "Membro 2 — ruolo", default: "Videomaker", max: 40 },
      "team.m2.bio": {
        label: "Membro 2 — bio",
        default:
          "Il movimento è la sua lingua. Dai reel che esplodono sui social ai montaggi cinematografici delle gare, Lorenzo trasforma ore di girato in storie che tengono gli occhi incollati allo schermo fino all'ultimo frame.",
        max: 400,
        multiline: true,
      },
      "team.m3.name": { label: "Membro 3 — nome", default: "Silvia Tarozzo", max: 60 },
      "team.m3.role": { label: "Membro 3 — ruolo", default: "Graphic Designer", max: 40 },
      "team.m3.bio": {
        label: "Membro 3 — bio",
        default:
          "La firma visiva di Lifeshot. Loghi, livree, grafiche social e identità di brand: Silvia dà forma e coerenza a tutto ciò che vedete — incluso questo sito. Se Lifeshot ha uno stile riconoscibile, è merito suo.",
        max: 400,
        multiline: true,
      },
    },
    images: {},
    spacing: {
      intro: { label: "Respiro dell'introduzione", classes: HERO_SCALE, default: 3 },
    },
    typography: {
      "intro.title": {
        label: "Dimensione titolo intro",
        classes: DISPLAY_SCALE,
        default: 4,
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
        typographyKnob: "intro.title",
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
    images: {},
    spacing: {
      intro: { label: "Respiro d'apertura", classes: HERO_SCALE, default: 2 },
    },
    typography: {
      "intro.title": {
        label: "Dimensione titolo",
        classes: DISPLAY_SCALE,
        default: 4,
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
      Object.entries(def.fields).map(([k, f]) => [k, f.default])
    ),
    images: Object.fromEntries(
      Object.entries(def.images).map(([k, f]) => [k, f.default])
    ),
    imageSettings: Object.fromEntries(
      Object.keys(def.images).map((k) => [k, { ...DEFAULT_IMAGE_SETTINGS }])
    ),
    spacing: Object.fromEntries(
      Object.entries(def.spacing).map(([k, s]) => [k, s.default])
    ) as Record<string, Level>,
    typography: Object.fromEntries(
      Object.entries(def.typography).map(([k, s]) => [k, s.default])
    ) as Record<string, Level>,
  };
}

export const DEFAULT_CONTENT: CmsData = {
  pages: Object.fromEntries(
    PAGE_SLUGS.map((slug) => [slug, buildDefaultPage(PAGES[slug])])
  ) as Record<PageSlug, PageContent>,
  settings: { ...DEFAULT_SETTINGS },
};

function cleanString(value: unknown, fallback: string, max: number): string {
  if (typeof value !== "string") return fallback;
  return value.slice(0, max);
}

function clampLevel(value: unknown, fallback: Level): Level {
  const n = Number(value);
  if (n >= 1 && n <= 5) return Math.round(n) as Level;
  return fallback;
}

interface RawPage {
  seo?: Partial<SeoContent>;
  texts?: Record<string, unknown>;
  images?: Record<string, unknown>;
  imageSettings?: Record<string, unknown>;
  spacing?: Record<string, unknown>;
  typography?: Record<string, unknown>;
}

function cleanImageSettings(raw: unknown): ImageSettings {
  const r = (raw ?? {}) as {
    posX?: unknown;
    posY?: unknown;
    scale?: unknown;
    position?: unknown;
  };
  const scaleNum = Number(r.scale);
  const scale =
    scaleNum >= 100 && scaleNum <= 280 ? scaleNum : DEFAULT_IMAGE_SETTINGS.scale;

  // Coordinate libere 0–100, con fallback ai vecchi nomi posizione salvati
  const named =
    typeof r.position === "string" ? NAMED_TO_XY[r.position] : undefined;
  const inRange = (v: number) => v >= 0 && v <= 100;
  const xNum = Number(r.posX);
  const yNum = Number(r.posY);
  const posX = inRange(xNum)
    ? Math.round(xNum)
    : named?.[0] ?? DEFAULT_IMAGE_SETTINGS.posX;
  const posY = inRange(yNum)
    ? Math.round(yNum)
    : named?.[1] ?? DEFAULT_IMAGE_SETTINGS.posY;

  return { posX, posY, scale, position: posToCss(posX, posY) };
}

export function normalizeContent(raw?: {
  pages?: Partial<Record<PageSlug, RawPage>>;
  settings?: Partial<SiteSettings>;
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
        Object.entries(def.fields).map(([k, f]) => [
          k,
          cleanString(rawPage?.texts?.[k], f.default, f.max),
        ])
      ),
      images: Object.fromEntries(
        Object.entries(def.images).map(([k, f]) => [
          k,
          cleanString(rawPage?.images?.[k], f.default, 500),
        ])
      ),
      imageSettings: Object.fromEntries(
        Object.keys(def.images).map((k) => [
          k,
          cleanImageSettings(rawPage?.imageSettings?.[k]),
        ])
      ),
      spacing: Object.fromEntries(
        Object.entries(def.spacing).map(([k, s]) => [
          k,
          clampLevel(rawPage?.spacing?.[k], s.default),
        ])
      ) as Record<string, Level>,
      typography: Object.fromEntries(
        Object.entries(def.typography).map(([k, s]) => [
          k,
          clampLevel(rawPage?.typography?.[k], s.default),
        ])
      ) as Record<string, Level>,
    };
  }
  const settings: SiteSettings = {
    watermarkEnabled:
      typeof raw?.settings?.watermarkEnabled === "boolean"
        ? raw.settings.watermarkEnabled
        : DEFAULT_SETTINGS.watermarkEnabled,
  };
  return { pages, settings };
}

/* ───────────────────── accessor per le pagine pubbliche ─────────────────── */

export function getText(content: CmsData, slug: PageSlug, key: string): string {
  return content.pages[slug]?.texts[key] ?? PAGES[slug].fields[key]?.default ?? "";
}

export function getImage(content: CmsData, slug: PageSlug, key: string): string {
  return content.pages[slug]?.images[key] ?? PAGES[slug].images[key]?.default ?? "";
}

export function getImageSettings(
  content: CmsData,
  slug: PageSlug,
  key: string
): ImageSettings {
  return content.pages[slug]?.imageSettings?.[key] ?? DEFAULT_IMAGE_SETTINGS;
}

export function getSpacingClass(
  content: CmsData,
  slug: PageSlug,
  knob: string
): string {
  const def = PAGES[slug].spacing[knob];
  if (!def) return "";
  return def.classes[content.pages[slug]?.spacing[knob] ?? def.default];
}

export function getTypographyClass(
  content: CmsData,
  slug: PageSlug,
  knob: string
): string {
  const def = PAGES[slug].typography[knob];
  if (!def) return "";
  return def.classes[content.pages[slug]?.typography[knob] ?? def.default];
}
