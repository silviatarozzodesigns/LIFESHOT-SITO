import { redirect } from "next/navigation";

/** Route storica: la sezione vive ora in GALLERY → Dietro l'obiettivo. */
export default function BehindLensRedirect() {
  redirect("/admin/gallery?sezione=motorsport");
}
