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

import { SERVICE_IDS, SERVICES } from "@/lib/services";

export type Level = 1 | 2 | 3 | 4 | 5;
/** Alias storico per le spaziature */
export type SpacingLevel = Level;
export type PageSlug =
  | "agenzia"
  | "home"
  | "ristorazione"
  | "business"
  | "video"
  | "chi-siamo"
  | "contatti";

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

/** Stile per-testo modificabile in-place: allineamento + scala dimensione */
export interface TextStyle {
  align?: "left" | "center" | "right";
  size?: Level;
}

export interface PageContent {
  seo: SeoContent;
  texts: Record<string, string>;
  /** Override stile (allineamento/dimensione) per chiave di testo */
  textStyles: Record<string, TextStyle>;
  images: Record<string, string>;
  imageSettings: Record<string, ImageSettings>;
  spacing: Record<string, Level>;
  typography: Record<string, Level>;
}

/** Scala dimensione testo 1–5 → moltiplicatore em (1=originale, design-safe) */
export const TEXT_SIZE_EM: Record<Level, string> = {
  1: "0.85em",
  2: "0.93em",
  3: "1em",
  4: "1.12em",
  5: "1.28em",
};

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
  /**
   * Override liberi per QUALSIASI testo "fisso" dei componenti (etichette,
   * titoli sezione, ecc.), keyati con un id stabile. Il default è il testo
   * scritto nel codice; se qui c'è un override, vince. Stile per-id in
   * `customStyles`. Rende editabile ogni testo senza gonfiare il registro.
   */
  custom: Record<string, string>;
  customStyles: Record<string, TextStyle>;
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

/* ────────── TESTIMONIANZE: campi condivisi fra le pagine categoria ────────── */

/** Le tre voci mostrate dal componente testimonianze */
export const REVIEW_IDS = ["r1", "r2", "r3"] as const;

/**
 * Titolo, sottotitolo e le tre testimonianze di una pagina. Stessi nomi di
 * chiave della homepage (`reviews.*`), così il componente è uno solo e
 * legge dalla pagina che lo ospita.
 */
function reviewFields(
  subtitle: string,
  voci: ReadonlyArray<{ quote: string; name: string; meta: string }>
): Record<string, FieldDef> {
  const fields: Record<string, FieldDef> = {
    "reviews.title": {
      label: "Testimonianze — titolo",
      default: "Dicono di noi",
      max: 80,
    },
    "reviews.subtitle": {
      label: "Testimonianze — sottotitolo",
      default: subtitle,
      max: 160,
    },
  };
  voci.forEach((voce, i) => {
    const id = REVIEW_IDS[i];
    fields[`reviews.${id}.quote`] = {
      label: `Testimonianza ${i + 1} — testo`,
      default: voce.quote,
      max: 240,
      multiline: true,
    };
    fields[`reviews.${id}.name`] = {
      label: `Testimonianza ${i + 1} — nome`,
      default: voce.name,
      max: 60,
    };
    fields[`reviews.${id}.meta`] = {
      label: `Testimonianza ${i + 1} — dettaglio`,
      default: voce.meta,
      max: 60,
    };
  });
  return fields;
}

/* ───────────── SEZIONE VIDEO: campi condivisi fra le categorie ───────────── */

/**
 * Titolo e sottotitolo della sezione video di una pagina categoria.
 * I video stessi si caricano dalla sezione VIDEO dell'admin.
 */
function videoSectionFields(subtitle: string): Record<string, FieldDef> {
  return {
    "videos.title": {
      label: "Video — titolo sezione",
      default: "Video",
      max: 80,
    },
    "videos.subtitle": {
      label: "Video — sottotitolo",
      default: subtitle,
      max: 200,
      multiline: true,
    },
  };
}

/* ───────────────── SERVIZI: campi testo dell'overlay hero ───────────────── */

/**
 * Titolo + descrizione di ogni servizio, generati dalla fonte unica
 * `SERVICES`: si modificano dall'EDITOR come ogni altro testo.
 */
function serviceFieldDefs(): Record<string, FieldDef> {
  const fields: Record<string, FieldDef> = {};
  for (const id of SERVICE_IDS) {
    const def = SERVICES[id];
    fields[`svc.${id}.title`] = {
      label: `Servizio ${def.label} — titolo`,
      default: def.title,
      max: 60,
    };
    fields[`svc.${id}.body`] = {
      label: `Servizio ${def.label} — descrizione`,
      default: def.body,
      max: 400,
      multiline: true,
    };
  }
  return fields;
}

/** Testi di un servizio pronti per la hero (default CMS inclusi) */
export interface ServiceCopy {
  id: string;
  title: string;
  body: string;
}

/** Legge dal CMS i testi di tutti i servizi, nell'ordine della fonte unica */
export function getServiceCopy(content: CmsData): Record<string, ServiceCopy> {
  const out: Record<string, ServiceCopy> = {};
  for (const id of SERVICE_IDS) {
    out[id] = {
      id,
      title: getText(content, "agenzia", `svc.${id}.title`),
      body: getText(content, "agenzia", `svc.${id}.body`),
    };
  }
  return out;
}

/* ────────────────── HERO 3D: chiavi immagine condivise ────────────────── */

/**
 * Set di immagini della hero 3D (sfondo + soggetto in overlay, per i 4
 * dispositivi). Usato da Motorsport e, con etichette adattate, da
 * Ristorazione e Business.
 */
/**
 * Regole del video di sfondo, scritte una volta sola: compaiono identiche
 * in tutte le hero del CMS. La durata è un consiglio pratico — il video va
 * a ciclo continuo, quindi oltre i ~15s si nota lo stacco e pesa e basta.
 */
export const HERO_VIDEO_RULES =
  "Durata consigliata 8–15 secondi (va a ciclo continuo). Senza audio, .mp4 o .webm, possibilmente sotto i 10 MB per non pesare su chi naviga da telefono.";

/** Le due caselle video di una hero, uguali per tutte le pagine */
export function heroVideoDefs(): Record<string, ImageDef> {
  return {
    "hero.videoLandscape": {
      label: "Video di sfondo — orizzontale (computer e tablet orizzontale)",
      default: "",
      hint: `Gira in orizzontale (16:9). ${HERO_VIDEO_RULES}`,
    },
    "hero.videoPortrait": {
      label: "Video di sfondo — verticale (telefono e tablet verticale)",
      default: "",
      hint: `Gira in verticale (9:16). ${HERO_VIDEO_RULES}`,
    },
  };
}

export function heroImageDefs(subject: string): Record<string, ImageDef> {
  return {
    // ── VIDEO DI SFONDO ── (facoltativi: se c'è, copre la foto di sfondo
    // del dispositivo corrispondente; la foto resta come prima immagine)
    ...heroVideoDefs(),
    // ── DESKTOP ──
    "hero.background": {
      label: "Hero Desktop — sfondo",
      default: "",
      hint: "Foto orizzontale d'ambiente. ~2000px.",
    },
    "hero.foreground": {
      label: `Hero Desktop — PNG ${subject} (overlay)`,
      default: "",
      hint: `PNG con sfondo trasparente: ${subject} in primo piano.`,
    },
    // ── TABLET VERTICALE ── (vuoti = usa lo sfondo desktop, senza overlay)
    "hero.backgroundTablet": {
      label: "Hero Tablet verticale — sfondo (opzionale)",
      default: "",
      hint: "iPad/tablet in verticale. Se vuoto usa lo sfondo desktop. ~1500px.",
    },
    "hero.foregroundTablet": {
      label: `Hero Tablet verticale — PNG ${subject} (opzionale)`,
      default: "",
      hint: "L'overlay su tablet verticale compare SOLO se carichi questo PNG.",
    },
    // ── TABLET ORIZZONTALE ── (vuoti = usa la versione verticale, poi desktop)
    "hero.backgroundTabletLandscape": {
      label: "Hero Tablet orizzontale — sfondo (opzionale)",
      default: "",
      hint: "iPad/tablet in orizzontale. Se vuoto usa il tablet verticale, poi il desktop. ~2000px.",
    },
    "hero.foregroundTabletLandscape": {
      label: `Hero Tablet orizzontale — PNG ${subject} (opzionale)`,
      default: "",
      hint: "Se vuoto usa l'overlay del tablet verticale (se caricato).",
    },
    // ── MOBILE ── (vuoti = usa lo sfondo desktop, senza overlay)
    "hero.backgroundMobile": {
      label: "Hero Mobile — sfondo (opzionale)",
      default: "",
      hint: "Immagine verticale per smartphone. Se vuota usa lo sfondo desktop.",
    },
    "hero.foregroundMobile": {
      label: `Hero Mobile — PNG ${subject} (opzionale)`,
      default: "",
      hint: "L'overlay su mobile compare SOLO se carichi questo PNG.",
    },
  };
}

/** Un asset hero pronto per il rendering: URL + inquadratura dal CMS */
export interface HeroAsset {
  url: string;
  position: string;
  scale: number;
}

/** Tutti gli asset della hero 3D di una pagina (sfondo + overlay ×4 device) */
export interface HeroAssets {
  background: HeroAsset;
  backgroundTablet: HeroAsset;
  backgroundTabletLandscape: HeroAsset;
  backgroundMobile: HeroAsset;
  foreground: HeroAsset;
  foregroundTablet: HeroAsset;
  foregroundTabletLandscape: HeroAsset;
  foregroundMobile: HeroAsset;
  /** Video di sfondo (URL): se presenti sostituiscono la foto di sfondo */
  videoLandscape: string;
  videoPortrait: string;
}

/** Legge dal CMS gli 8 asset hero di una pagina, con inquadrature */
export function getHeroAssets(content: CmsData, slug: PageSlug): HeroAssets {
  const asset = (key: string): HeroAsset => {
    const s = getImageSettings(content, slug, key);
    return { url: getImage(content, slug, key), position: s.position, scale: s.scale };
  };
  return {
    background: asset("hero.background"),
    backgroundTablet: asset("hero.backgroundTablet"),
    backgroundTabletLandscape: asset("hero.backgroundTabletLandscape"),
    backgroundMobile: asset("hero.backgroundMobile"),
    foreground: asset("hero.foreground"),
    foregroundTablet: asset("hero.foregroundTablet"),
    foregroundTabletLandscape: asset("hero.foregroundTabletLandscape"),
    foregroundMobile: asset("hero.foregroundMobile"),
    videoLandscape: getImage(content, slug, "hero.videoLandscape"),
    videoPortrait: getImage(content, slug, "hero.videoPortrait"),
  };
}

/* ─────────────────────────── REGISTRY PAGINE ─────────────────────────── */

export const PAGES: Record<PageSlug, PageDef> = {
  /* ── HOMEPAGE AGENZIA — vetrina "un'unica agenzia per ogni bisogno" ── */
  agenzia: {
    label: "Homepage",
    path: "/",
    seo: {
      metaTitle: "Lifeshot — Un'unica agenzia per il tuo digitale",
      metaDescription:
        "Siti web, grafiche, loghi, branding, social, foto e video professionali: Lifeshot è l'agenzia media unica per tutta la tua immagine digitale.",
      ogImage: "",
    },
    fields: {
      "hero.sloganLine1": {
        label: "Hero — slogan riga 1",
        default: "Tutto il tuo digitale.",
        max: 60,
        typographyKnob: "hero.slogan",
      },
      "hero.sloganLine2": {
        label: "Hero — slogan riga 2",
        default: "Un'unica agenzia.",
        max: 60,
      },
      "hero.ctaLabel": {
        label: "Hero — testo bottone",
        default: "Lavora con noi",
        max: 40,
      },
      "ribbon.items": {
        label: "Nastro servizi (voci separate da ·)",
        default:
          "Siti web · Grafiche · Loghi · Tipografia · Branding · Social media · Video · Foto",
        max: 300,
      },
      // Testi dell'overlay che si apre cliccando i cursori della hero
      ...serviceFieldDefs(),
      "categories.title": {
        label: "Categorie — titolo sezione",
        default: "Un solo team, tanti mondi",
        max: 80,
      },
      "categories.subtitle": {
        label: "Categorie — sottotitolo",
        default:
          "Scorri i mondi che seguiamo ogni giorno: dentro ognuno trovi il nostro lavoro.",
        max: 200,
        multiline: true,
      },
      "cat.ristorazione.title": {
        label: "Ristorazione — titolo",
        default: "Ristorazione",
        max: 40,
      },
      "cat.ristorazione.description": {
        label: "Ristorazione — descrizione",
        default:
          "Shooting dei piatti, menù, sito e social per far venire fame prima ancora di sedersi al tavolo.",
        max: 300,
        multiline: true,
      },
      "cat.motorsport.title": {
        label: "Motorsport — titolo",
        default: "Motorsport",
        max: 40,
      },
      "cat.motorsport.description": {
        label: "Motorsport — descrizione",
        default:
          "Foto e video a bordo pista, ricerca degli scatti per numero di gara e contenuti su misura per team e piloti.",
        max: 300,
        multiline: true,
      },
      "cat.business.title": {
        label: "Business — titolo",
        default: "Business",
        max: 40,
      },
      "cat.business.description": {
        label: "Business — descrizione",
        default:
          "Identità visiva, siti web e contenuti professionali per aziende, professionisti e progetti in crescita.",
        max: 300,
        multiline: true,
      },
      "reviews.title": {
        label: "Testimonianze — titolo",
        default: "Dicono di noi",
        max: 80,
      },
      "reviews.subtitle": {
        label: "Testimonianze — sottotitolo",
        default: "Chi ha lavorato con Lifeshot, in pista e fuori.",
        max: 160,
      },
      "reviews.r1.quote": {
        label: "Testimonianza 1 — testo",
        default:
          "Foto pazzesche, sembrano uscite da una rivista. Ho trovato i miei scatti in un attimo col numero di gara.",
        max: 240,
        multiline: true,
      },
      "reviews.r1.name": {
        label: "Testimonianza 1 — nome",
        default: "Luca B.",
        max: 60,
      },
      "reviews.r1.meta": {
        label: "Testimonianza 1 — categoria",
        default: "#42 · Motorsport",
        max: 60,
      },
      "reviews.r2.quote": {
        label: "Testimonianza 2 — testo",
        default:
          "Le foto dei piatti e il nuovo menù hanno dato un'altra faccia al locale: ora i clienti ordinano con gli occhi.",
        max: 240,
        multiline: true,
      },
      "reviews.r2.name": {
        label: "Testimonianza 2 — nome",
        default: "Osteria del Corso",
        max: 60,
      },
      "reviews.r2.meta": {
        label: "Testimonianza 2 — categoria",
        default: "Ristorazione",
        max: 60,
      },
      "reviews.r3.quote": {
        label: "Testimonianza 3 — testo",
        default:
          "Dal logo al sito, finalmente tutta la nostra immagine parla la stessa lingua. Un unico interlocutore, zero caos.",
        max: 240,
        multiline: true,
      },
      "reviews.r3.name": {
        label: "Testimonianza 3 — nome",
        default: "Elisa R.",
        max: 60,
      },
      "reviews.r3.meta": {
        label: "Testimonianza 3 — categoria",
        default: "Business · Branding",
        max: 60,
      },
      "contact.title": {
        label: "Contatti — titolo",
        default: "Parliamo del tuo progetto",
        max: 80,
      },
      "contact.subtitle": {
        label: "Contatti — sottotitolo",
        default:
          "Un'idea, un evento, un brand da far crescere: scrivici e ti rispondiamo in giornata.",
        max: 200,
        multiline: true,
      },
    },
    images: {
      // Video di sfondo: se c'è, copre le slide (che restano come riserva)
      ...heroVideoDefs(),
      "hero.slide1": {
        label: "Hero — slide 1 (opzionale)",
        default: "",
        hint: "Le slide si alternano in dissolvenza dietro lo slogan, una ogni 5 secondi. Senza slide né video la hero resta tipografica, con la costellazione dei servizi.",
      },
      "hero.slide2": { label: "Hero — slide 2 (opzionale)", default: "" },
      "hero.slide3": { label: "Hero — slide 3 (opzionale)", default: "" },
      "hero.slide4": { label: "Hero — slide 4 (opzionale)", default: "" },
      // Le anteprime delle categorie in home leggono i "lavori" caricati
      // sulle pagine Ristorazione e Business: un'unica fonte, zero doppioni.
    },
    spacing: {
      categories: {
        label: "Spazio sezione categorie",
        classes: SECTION_SCALE,
        default: 4,
      },
      reviews: {
        label: "Spazio testimonianze",
        classes: SECTION_SCALE,
        default: 3,
      },
      contact: {
        label: "Spazio sezione contatti",
        classes: SECTION_SCALE,
        default: 4,
      },
    },
    typography: {
      "hero.slogan": {
        label: "Dimensione slogan",
        classes: DISPLAY_SCALE,
        default: 3,
      },
    },
  },

  /* ── MOTORSPORT — l'ex homepage: eventi, ricerca per numero di gara ── */
  home: {
    label: "Motorsport",
    path: "/motorsport",
    seo: {
      metaTitle: "Motorsport · Lifeshot — Foto e video dagli eventi",
      metaDescription:
        "Lifeshot a bordo pista: cerca e acquista le foto dei tuoi eventi motorsport per numero di gara, con video e reel su misura.",
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
      ...videoSectionFields("Montaggi delle gare, reel e clip dal bordo pista."),
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
      // ── TABLET VERTICALE ── (vuoti = usa lo sfondo desktop, senza rider)
      "hero.backgroundTablet": {
        label: "Hero Tablet verticale — sfondo (opzionale)",
        default: "",
        hint: "iPad/tablet in verticale. Se vuoto usa lo sfondo desktop. ~1500px.",
      },
      "hero.foregroundTablet": {
        label: "Hero Tablet verticale — PNG rider (opzionale)",
        default: "",
        hint: "Il rider su tablet verticale compare SOLO se carichi questo PNG.",
      },
      // ── TABLET ORIZZONTALE ── (vuoti = usa la versione verticale, poi desktop)
      "hero.backgroundTabletLandscape": {
        label: "Hero Tablet orizzontale — sfondo (opzionale)",
        default: "",
        hint: "iPad/tablet in orizzontale. Se vuoto usa il tablet verticale, poi il desktop. ~2000px.",
      },
      "hero.foregroundTabletLandscape": {
        label: "Hero Tablet orizzontale — PNG rider (opzionale)",
        default: "",
        hint: "Se vuoto usa il rider del tablet verticale (se caricato).",
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

  /* ── RISTORAZIONE — pagina categoria con galleria lavori interna ── */
  ristorazione: {
    label: "Ristorazione",
    path: "/ristorazione",
    seo: {
      metaTitle: "Ristorazione · Lifeshot — Foto, menù e social per il food",
      metaDescription:
        "Shooting dei piatti, menù, siti web e social per ristoranti e locali: Lifeshot racconta il tuo locale così com'è quando profuma di buono.",
      ogImage: "",
    },
    fields: {
      "hero.title": {
        label: "Titolo pagina",
        default: "Ristorazione",
        max: 60,
        typographyKnob: "hero.title",
      },
      "hero.subtitle": {
        label: "Sottotitolo",
        default:
          "Shooting dei piatti, menù, siti web e social: raccontiamo il tuo locale così com'è quando profuma di buono.",
        max: 220,
        multiline: true,
      },
      "hero.cta": {
        label: "Testo bottone lavori",
        default: "Guarda i nostri lavori",
        max: 40,
      },
      "gallery.title": {
        label: "In evidenza — titolo",
        default: "In evidenza",
        max: 80,
      },
      "gallery.subtitle": {
        label: "In evidenza — sottotitolo",
        default:
          "Una selezione di scatti e progetti per il mondo della ristorazione.",
        max: 200,
        multiline: true,
      },
      "projects.title": {
        label: "Progetti recenti — titolo",
        default: "Progetti recenti",
        max: 80,
      },
      "projects.subtitle": {
        label: "Progetti recenti — sottotitolo",
        default: "Gli ultimi progetti firmati Lifeshot per la ristorazione.",
        max: 200,
        multiline: true,
      },
      ...videoSectionFields("Il gusto del tuo locale, in movimento."),
      ...reviewFields("Chi ci ha aperto la cucina, e come è andata.", [
        {
          quote:
            "Le foto dei piatti e il nuovo menù hanno dato un'altra faccia al locale: ora i clienti ordinano con gli occhi.",
          name: "Osteria del Corso",
          meta: "Ristorante · Menù e shooting",
        },
        {
          quote:
            "Hanno lavorato durante il servizio senza farsi sentire, e il risultato sembra girato in un altro locale. Il nostro, però.",
          name: "Trattoria da Ivo",
          meta: "Trattoria · Foto e social",
        },
        {
          quote:
            "Il reel del weekend ci ha riempito le serate. Prima pubblicavo foto col telefono e non succedeva niente.",
          name: "Bistrot 47",
          meta: "Bistrot · Reel e social",
        },
      ]),
    },
    images: {
      ...heroImageDefs("soggetto"),
      work1: {
        label: "Lavoro 1",
        default: "",
        hint: "I primi 4 lavori appaiono anche nell'anteprima in homepage.",
      },
      work2: { label: "Lavoro 2", default: "" },
      work3: { label: "Lavoro 3", default: "" },
      work4: { label: "Lavoro 4", default: "" },
      work5: { label: "Lavoro 5", default: "" },
      work6: { label: "Lavoro 6", default: "" },
      work7: { label: "Lavoro 7", default: "" },
      work8: { label: "Lavoro 8", default: "" },
    },
    spacing: {
      hero: { label: "Respiro d'apertura", classes: HERO_SCALE, default: 2 },
      gallery: {
        label: "Spazio galleria",
        classes: SECTION_SCALE,
        default: 3,
      },
    },
    typography: {
      "hero.title": {
        label: "Dimensione titolo",
        classes: DISPLAY_SCALE,
        default: 4,
      },
    },
  },

  /* ── BUSINESS — pagina categoria con galleria lavori interna ── */
  business: {
    label: "Business",
    path: "/business",
    seo: {
      metaTitle: "Business · Lifeshot — Branding, siti e contenuti aziendali",
      metaDescription:
        "Identità visiva, loghi, siti web e contenuti professionali per aziende e professionisti: un'unica firma per tutta la tua immagine.",
      ogImage: "",
    },
    fields: {
      "hero.title": {
        label: "Titolo pagina",
        default: "Business",
        max: 60,
        typographyKnob: "hero.title",
      },
      "hero.subtitle": {
        label: "Sottotitolo",
        default:
          "Identità visiva, siti web e contenuti professionali: un'unica firma per tutta l'immagine della tua azienda.",
        max: 220,
        multiline: true,
      },
      "hero.cta": {
        label: "Testo bottone lavori",
        default: "Guarda i nostri lavori",
        max: 40,
      },
      "gallery.title": {
        label: "In evidenza — titolo",
        default: "In evidenza",
        max: 80,
      },
      "gallery.subtitle": {
        label: "In evidenza — sottotitolo",
        default:
          "Loghi, siti e progetti di branding realizzati per aziende e professionisti.",
        max: 200,
        multiline: true,
      },
      "projects.title": {
        label: "Progetti recenti — titolo",
        default: "Progetti recenti",
        max: 80,
      },
      "projects.subtitle": {
        label: "Progetti recenti — sottotitolo",
        default: "Gli ultimi progetti firmati Lifeshot per aziende e brand.",
        max: 200,
        multiline: true,
      },
      ...videoSectionFields("Spot, presentazioni e contenuti video per il tuo brand."),
      ...reviewFields("Aziende e professionisti che ci hanno affidato la loro immagine.", [
        {
          quote:
            "Dal logo al sito, finalmente tutta la nostra immagine parla la stessa lingua. Un unico interlocutore, zero caos.",
          name: "Elisa R.",
          meta: "Studio professionale · Branding",
        },
        {
          quote:
            "Il sito nuovo si apre in un lampo e lo aggiorno da solo. Prima dovevo scrivere a qualcuno per cambiare una riga.",
          name: "Nordwind srl",
          meta: "Azienda · Sito web",
        },
        {
          quote:
            "Le foto del team e dei prodotti hanno cambiato le nostre presentazioni: sembriamo quello che siamo davvero.",
          name: "Marco T.",
          meta: "Manifattura · Foto e grafiche",
        },
      ]),
    },
    images: {
      ...heroImageDefs("soggetto"),
      work1: {
        label: "Lavoro 1",
        default: "",
        hint: "I primi 4 lavori appaiono anche nell'anteprima in homepage.",
      },
      work2: { label: "Lavoro 2", default: "" },
      work3: { label: "Lavoro 3", default: "" },
      work4: { label: "Lavoro 4", default: "" },
      work5: { label: "Lavoro 5", default: "" },
      work6: { label: "Lavoro 6", default: "" },
      work7: { label: "Lavoro 7", default: "" },
      work8: { label: "Lavoro 8", default: "" },
    },
    spacing: {
      hero: { label: "Respiro d'apertura", classes: HERO_SCALE, default: 2 },
      gallery: {
        label: "Spazio galleria",
        classes: SECTION_SCALE,
        default: 3,
      },
    },
    typography: {
      "hero.title": {
        label: "Dimensione titolo",
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
    textStyles: {},
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
  custom: {},
  customStyles: {},
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
  textStyles?: Record<string, unknown>;
  images?: Record<string, unknown>;
  imageSettings?: Record<string, unknown>;
  spacing?: Record<string, unknown>;
  typography?: Record<string, unknown>;
}

function cleanTextStyle(raw: unknown): TextStyle {
  const r = (raw ?? {}) as { align?: unknown; size?: unknown };
  const out: TextStyle = {};
  if (r.align === "left" || r.align === "center" || r.align === "right") {
    out.align = r.align;
  }
  const n = Number(r.size);
  if (n >= 1 && n <= 5) out.size = Math.round(n) as Level;
  return out;
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
  custom?: Record<string, unknown>;
  customStyles?: Record<string, unknown>;
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
      textStyles: Object.fromEntries(
        Object.keys(def.fields)
          .map((k) => [k, cleanTextStyle(rawPage?.textStyles?.[k])] as const)
          .filter(([, v]) => v.align || v.size)
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
  // Override liberi: max ~800 voci, valori ≤ 600 char (anti-abuso)
  const custom: Record<string, string> = {};
  const rawCustom = raw?.custom ?? {};
  for (const key of Object.keys(rawCustom).slice(0, 800)) {
    const v = rawCustom[key];
    if (typeof v === "string") custom[key] = v.slice(0, 600);
  }
  const customStyles: Record<string, TextStyle> = {};
  const rawCS = raw?.customStyles ?? {};
  for (const key of Object.keys(rawCS).slice(0, 800)) {
    const s = cleanTextStyle(rawCS[key]);
    if (s.align || s.size) customStyles[key] = s;
  }
  return { pages, settings, custom, customStyles };
}

/* ───────────────────── accessor per le pagine pubbliche ─────────────────── */

export function getText(content: CmsData, slug: PageSlug, key: string): string {
  return content.pages[slug]?.texts[key] ?? PAGES[slug].fields[key]?.default ?? "";
}

/** Override di un testo "fisso" (id arbitrario): se assente usa il fallback */
export function getCustom(
  content: CmsData,
  id: string,
  fallback: string
): string {
  const v = content.custom?.[id];
  return typeof v === "string" && v.length > 0 ? v : fallback;
}

/** Stile di un testo custom (id arbitrario) */
export function getCustomStyle(content: CmsData, id: string): TextStyle {
  return content.customStyles?.[id] ?? {};
}

/** Stile (allineamento/dimensione) di un testo modificabile in-place */
export function getTextStyle(
  content: CmsData,
  slug: PageSlug,
  key: string
): TextStyle {
  return content.pages[slug]?.textStyles?.[key] ?? {};
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
