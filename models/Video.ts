import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

/**
 * Video del portfolio — solo metadati e link esterni (YouTube, Vimeo,
 * Reel Instagram o micro-clip .webm): zero spazio occupato su R2.
 */
const VideoSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, "Il titolo del video è obbligatorio"],
      trim: true,
      maxlength: 200,
    },
    url: {
      type: String,
      required: [true, "Il link del video è obbligatorio"],
      trim: true,
    },
    // Rilevato dal parser al salvataggio: youtube | vimeo | instagram | file
    provider: {
      type: String,
      required: true,
      enum: ["youtube", "vimeo", "instagram", "file"],
    },
    // ID/shortcode per l'embed (o URL del file per le micro-clip)
    embedId: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
    published: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

VideoSchema.index({ createdAt: -1 });

export type VideoDoc = InferSchemaType<typeof VideoSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Video: Model<VideoDoc> =
  mongoose.models.Video ?? mongoose.model<VideoDoc>("Video", VideoSchema);
