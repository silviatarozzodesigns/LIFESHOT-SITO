import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

/**
 * Evento — es. una gara, un matrimonio, uno shooting.
 * Contiene le foto (modello Photo) tramite riferimento `event`.
 */
const EventSchema = new Schema(
  {
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
    date: {
      type: Date,
      required: [true, "La data dell'evento è obbligatoria"],
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
