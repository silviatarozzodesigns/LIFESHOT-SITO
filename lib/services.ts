/**
 * I SERVIZI DELL'AGENZIA — fonte unica.
 *
 * Alimentano i cursori della hero (etichette), l'overlay che li spiega e i
 * campi testo del CMS (titolo + descrizione, generati dal registry).
 *
 * Su desktop ogni cursore apre il suo servizio; su touch i cursori sono 4
 * (Grafiche, Social, Foto, Video) e gli altri si raggiungono da "Vedi anche"
 * (`related`) → nessun servizio resta irraggiungibile.
 */

export const SERVICE_IDS = [
  "sitiweb",
  "grafiche",
  "branding",
  "video",
  "social",
  "foto",
] as const;

export type ServiceId = (typeof SERVICE_IDS)[number];

export interface ServiceDef {
  /** Etichetta breve della pillola-cursore nella hero */
  label: string;
  /** Titolo dell'overlay (default CMS) */
  title: string;
  /** Descrizione del servizio (default CMS) */
  body: string;
  /** Servizi collegati, mostrati come "Vedi anche" */
  related: ServiceId[];
}

export const SERVICES: Record<ServiceId, ServiceDef> = {
  foto: {
    label: "Foto",
    title: "Servizio Fotografico",
    body: "Dalla polvere del bordo pista ai piatti sotto le luci del locale: scattiamo dove succede. Reportage di gara, ritratti, food, prodotto e still life — con la consegna rapida e scatti pronti sia per la stampa sia per i social.",
    related: ["video", "social"],
  },
  video: {
    label: "Video",
    title: "Video & Reel",
    body: "Reel che tengono gli occhi incollati e montaggi cinematografici della gara o del tuo locale. Riprese, montaggio, color e musica: ti arriva la clip finita, pronta da pubblicare.",
    related: ["foto", "social"],
  },
  social: {
    label: "Social",
    title: "Social Media",
    body: "Piano editoriale, contenuti e pubblicazione. Diamo al tuo profilo una voce riconoscibile e una presenza costante, senza che tu debba pensarci ogni mattina.",
    related: ["grafiche", "foto"],
  },
  grafiche: {
    label: "Grafiche",
    title: "Grafica & Design",
    body: "Menù, locandine, livree, post e materiali stampati. Ogni pezzo parla la stessa lingua del tuo brand, con la cura di chi il visivo lo fa di mestiere.",
    related: ["branding", "sitiweb"],
  },
  branding: {
    label: "Branding",
    title: "Branding & Identità",
    body: "Logo, colori, caratteri e tono di voce: costruiamo l'identità che ti rende riconoscibile ovunque, dall'insegna del locale al profilo Instagram.",
    related: ["grafiche", "sitiweb"],
  },
  sitiweb: {
    label: "Siti web",
    title: "Siti Web",
    body: "Siti veloci, curati e su misura — proprio come questo. Design, sviluppo e messa online, con i contenuti che poi aggiorni da solo quando vuoi.",
    related: ["grafiche", "branding"],
  },
};

/* ───────────────── disposizione dei cursori nella hero ───────────────── */

export interface HeroChip {
  id: ServiceId;
  /** Posizione finale (% della hero, riferita al centro della pillola) */
  x: number;
  y: number;
  /** Lato dello schermo da cui entra */
  from: "left" | "right" | "top" | "bottom";
  delay: number;
}

/** Desktop: tutti e sei i servizi attorno allo slogan */
export const HERO_CHIPS_DESKTOP: HeroChip[] = [
  { id: "sitiweb", x: 13, y: 24, from: "left", delay: 0.3 },
  { id: "grafiche", x: 82, y: 20, from: "top", delay: 0.65 },
  { id: "branding", x: 86, y: 55, from: "right", delay: 1.0 },
  { id: "video", x: 10, y: 52, from: "left", delay: 1.35 },
  { id: "social", x: 17, y: 78, from: "bottom", delay: 1.7 },
  { id: "foto", x: 79, y: 81, from: "right", delay: 2.05 },
];

/** Tablet e mobile: 4 settori (gli altri si aprono da "Vedi anche") */
export const HERO_CHIPS_TOUCH: HeroChip[] = [
  { id: "grafiche", x: 24, y: 18, from: "left", delay: 0.3 },
  { id: "social", x: 72, y: 24, from: "right", delay: 0.65 },
  { id: "foto", x: 26, y: 80, from: "left", delay: 1.0 },
  { id: "video", x: 70, y: 89, from: "bottom", delay: 1.35 },
];

/** Servizi con un cursore proprio anche su telefono/tablet */
export const TOUCH_SERVICE_IDS: ServiceId[] = HERO_CHIPS_TOUCH.map((c) => c.id);
