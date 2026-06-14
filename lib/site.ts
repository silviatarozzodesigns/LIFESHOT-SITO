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
} as const;

/**
 * Slug dell'evento di sistema "Dietro l'obiettivo": contenitore degli
 * scatti caricati direttamente nella sezione curata della homepage.
 * Non pubblicato → invisibile in liste/filtri pubblici. Prefisso "__"
 * per escluderlo anche dalla lista eventi dell'admin.
 */
export const BEHIND_LENS_SLUG = "__dietro-l-obiettivo";
