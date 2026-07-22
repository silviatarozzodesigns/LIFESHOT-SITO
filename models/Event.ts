import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

/** Macrocategorie del sito: ogni evento/progetto appartiene a una sola. */
export const EVENT_CATEGORIES = [
  "motorsport",
  "ristorazione",
  "business",
] as const;
export type EventCategory = (typeof EVENT_CATEGORIES)[number];

/**
 * Evento — una gara motorsport o un "progetto" ristorazione/business.
 * Contiene le foto (modello Photo) tramite riferimento `event`.
 */
const EventSchema = new Schema(
  {
    // Macrocategoria: gli eventi storici (senza campo) sono motorsport.
    // Le query usano { $in: [cat, null] } per il fallback, senza migrazioni.
    category: {
      type: String,
      enum: EVENT_CATEGORIES,
      default: "motorsport",
      index: true,
    },
    name: {
      type: String,
      required: [true, "Il nome dell'evento è obbligatorio"],
      trim: true,
      maxlength: 200,
    },
    // Slug URL-friendly generato dal nome (es. "granfondo-modena-2026")
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    // Slug che questo evento ha avuto in passato (dopo una rinomina): i
    // link e i risultati Google col vecchio indirizzo ci rimandano al nuovo,
    // così non muoiono. Sono anche "in pensione": nessun altro evento può
    // riprenderli, per non far portare un vecchio link alla gara sbagliata.
    slugHistory: {
      type: [String],
      default: undefined,
      index: true,
    },
    // Facoltativa: i progetti vetrina spesso non hanno una data sensata,
    // e anche una gara può essere caricata prima di saperla.
    date: {
      type: Date,
      default: null,
    },
    location: {
      type: String,
      trim: true,
      maxlength: 200,
      default: "",
    },
    description: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: "",
    },
    // URL (o path locale) dell'immagine di copertina
    coverImage: {
      type: String,
      default: "",
    },
    // Progetto "menù sfogliabile": la pagina del progetto mostra un menù
    // realistico con fodera in pelle al posto della galleria a scorrimento.
    // Le pagine del menù sono le foto caricate sull'evento, in ordine.
    isMenu: {
      type: Boolean,
      default: false,
    },
    // Copertina personalizzata della fodera del menù (URL immagine).
    menuCoverImage: {
      type: String,
      default: "",
    },
    // Eventi non pubblicati restano visibili solo in dashboard
    published: {
      type: Boolean,
      default: true,
    },
    // Contatore denormalizzato, aggiornato all'upload/cancellazione foto
    photoCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Ricerca eventi per nome/luogo dalla barra di ricerca pubblica
EventSchema.index({ name: "text", location: "text" });
EventSchema.index({ date: -1 });

export type EventDoc = InferSchemaType<typeof EventSchema> & {
  _id: mongoose.Types.ObjectId;
};

// In dev con hot-reload il modello può già esistere: riusa quello registrato
export const Event: Model<EventDoc> =
  mongoose.models.Event ?? mongoose.model<EventDoc>("Event", EventSchema);
