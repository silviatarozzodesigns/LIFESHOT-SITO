import mongoose, { Schema, type Model } from "mongoose";
import type { CmsData } from "@/lib/content";

/**
 * Documento singleton (key: "site") con il doppio stato del micro-CMS:
 * - `draft`: la bozza su cui lavora l'admin (visibile solo in dashboard)
 * - `published`: ciò che il sito pubblico mostra davvero
 * "Salva e pubblica" copia la bozza dentro `published`.
 */
const SiteContentSchema = new Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      default: "site",
    },
    draft: {
      type: Schema.Types.Mixed,
      default: null,
    },
    published: {
      type: Schema.Types.Mixed,
      default: null,
    },
  },
  { timestamps: true, minimize: false }
);

export interface SiteContentDoc {
  _id: mongoose.Types.ObjectId;
  key: string;
  draft: CmsData | null;
  published: CmsData | null;
}

export const SiteContent: Model<SiteContentDoc> =
  mongoose.models.SiteContent ??
  mongoose.model<SiteContentDoc>("SiteContent", SiteContentSchema);
