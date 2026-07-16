import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

/**
 * Foto — appartiene a un Evento ed è ricercabile per numero di gara.
 * Il numero di gara (`raceNumber`) viene estratto automaticamente dal nome
 * del file in fase di upload (vedi lib/parse-filename.ts).
 */
const PhotoSchema = new Schema(
  {
    event: {
      type: Schema.Types.ObjectId,
      ref: "Event",
      required: true,
      index: true,
    },
    // Nome file originale caricato dal fotografo (es. "evento_45_01.jpg")
    originalFilename: {
      type: String,
      required: true,
      trim: true,
    },
    // Chiave della PREVIEW pubblica filigranata (path locale o key R2)
    storageKey: {
      type: String,
      required: true,
      unique: true,
    },
    // URL pubblico della preview filigranata
    url: {
      type: String,
      required: true,
    },
    // Chiave dell'ORIGINALE pulito ad alta risoluzione (consegnato
    // dopo l'acquisto; mai esposto pubblicamente)
    originalKey: {
      type: String,
      default: null,
    },
    // Chiave della PREVIEW già processata su R2 (filigrana impressa al volo
    // dell'upload). Se presente, /api/images la serve così com'è: la filigrana
    // è quindi baked e non può fallire al serve.
    previewKey: {
      type: String,
      default: null,
    },
    // Numeri di gara (multi-tag). Stringhe libere per supportare "045", "A12"
    // e anche testo come "senza numero" per le moto senza pettorale.
    raceNumbers: {
      type: [String],
      default: undefined,
      index: true,
    },
    // Nomi piloti (multi-tag), taggati liberamente dalla dashboard.
    pilotNames: {
      type: [String],
      default: undefined,
      index: true,
    },
    // [LEGACY] Campi singoli pre multi-tag: mantenuti per retro-compatibilità
    // (foto taggate prima del passaggio agli array). In lettura/ricerca fanno
    // da fallback agli array; le nuove modifiche scrivono su raceNumbers/pilotNames.
    raceNumber: {
      type: String,
      trim: true,
      default: null,
      index: true,
    },
    pilotName: {
      type: String,
      trim: true,
      default: null,
      index: true,
    },
    width: { type: Number, default: null },
    height: { type: Number, default: null },
    sizeBytes: { type: Number, default: null },
    mimeType: { type: String, default: "image/jpeg" },
    // Se true, la preview pubblica viene servita con la filigrana impressa.
    // Impostato all'upload dal toggle globale del CMS (settings.watermarkEnabled).
    watermark: { type: Boolean, default: true },
    // Variante filigrana: true = scura (foto chiare), false = chiara/bianca
    // (foto scure). Scelta all'upload per garantire sempre la visibilità.
    watermarkDark: { type: Boolean, default: true },
    // Marca le foto curate per la sezione homepage "Dietro l'obiettivo"
    featured: { type: Boolean, default: false, index: true },
    // Posizione scelta a mano nella gallery "In evidenza" (admin → Gallery).
    // 0 = mai ordinata: quelle a pari merito restano in ordine di
    // caricamento, e una foto appena messa in vetrina compare per prima.
    featuredOrder: { type: Number, default: 0, index: true },
    // Prezzo in centesimi per il futuro flusso d'acquisto (placeholder)
    priceCents: {
      type: Number,
      default: null,
    },
  },
  { timestamps: true }
);

// Query principale del motore di ricerca: evento + numeri di gara
PhotoSchema.index({ event: 1, raceNumbers: 1 });
PhotoSchema.index({ event: 1, pilotNames: 1 });
PhotoSchema.index({ event: 1, raceNumber: 1 }); // legacy
PhotoSchema.index({ event: 1, createdAt: -1 });

export type PhotoDoc = InferSchemaType<typeof PhotoSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Photo: Model<PhotoDoc> =
  mongoose.models.Photo ?? mongoose.model<PhotoDoc>("Photo", PhotoSchema);
