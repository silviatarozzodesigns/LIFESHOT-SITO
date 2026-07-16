/**
 * Canali ufficiali Lifeshot — un unico punto di modifica.
 */
export const site = {
  /** Profilo Instagram pubblico */
  instagramUrl: "https://www.instagram.com/lifeshot.media/",
  /** Link diretto ai DM Instagram */
  instagramDmUrl: "https://ig.me/m/lifeshot.media",
  /** Handle mostrato nelle pagine */
  instagramHandle: "@lifeshot.media",
  youtubeUrl: "https://www.youtube.com/@lifeshot-media",
  /** Email ufficiale unica */
  email: "lifeshotmedia@gmail.com",
  /** Telefono come si legge */
  phone: "338 969 5958",
  /** Telefono in formato internazionale, per il link che avvia la chiamata */
  phoneHref: "tel:+393389695958",
} as const;

/**
 * Dati fiscali/legali dell'agenzia (obblighi siti professionali IT).
 * Placeholder ben visibili: aggiornarli quando disponibili.
 */
export const company = {
  legalName: "Silvia Tarozzo Digital Creator",
  vat: "02828270039",
  address: "Via F.Peretti 55, 28075 Grignasco (NO)",
  email: "lifeshotmedia@gmail.com",
} as const;

/**
 * Slug dell'evento di sistema "Dietro l'obiettivo": contenitore degli
 * scatti caricati direttamente nella sezione curata della homepage.
 * Non pubblicato → invisibile in liste/filtri pubblici. Prefisso "__"
 * per escluderlo anche dalla lista eventi dell'admin.
 */
export const BEHIND_LENS_SLUG = "__dietro-l-obiettivo";
