import type { EventCategory } from "@/models/Event";

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
 * Eventi di sistema "contenitore" per la galleria in evidenza di ogni
 * categoria: raccolgono gli scatti caricati direttamente da GALLERY (senza
 * legarli a un evento/progetto pubblico). Non pubblicati → invisibili in
 * liste/filtri pubblici. Prefisso "__" per escluderli dalla lista eventi
 * dell'admin. Lo slug del motorsport resta quello storico ("Dietro
 * l'obiettivo") per continuità dei dati già caricati.
 */
export const FEATURED_CONTAINER_SLUGS: Record<EventCategory, string> = {
  motorsport: "__dietro-l-obiettivo",
  ristorazione: "__in-evidenza-ristorazione",
  business: "__in-evidenza-business",
};

/** Nome interno dell'evento-contenitore (non mostrato nelle liste pubbliche). */
export const FEATURED_CONTAINER_NAMES: Record<EventCategory, string> = {
  motorsport: "In Evidenza — Motorsport",
  ristorazione: "In Evidenza — Ristorazione",
  business: "In Evidenza — Business",
};

/** Tutti gli slug contenitore, per escluderli in blocco dalle query. */
export const FEATURED_CONTAINER_SLUG_LIST = Object.values(
  FEATURED_CONTAINER_SLUGS
);

/** @deprecated Alias storico: usa FEATURED_CONTAINER_SLUGS.motorsport */
export const BEHIND_LENS_SLUG = FEATURED_CONTAINER_SLUGS.motorsport;
