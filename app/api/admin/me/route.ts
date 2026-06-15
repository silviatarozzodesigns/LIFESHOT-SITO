import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";

// Stato admin per il client (il cookie di sessione è httpOnly e non leggibile
// da JS). Usato dall'EditModeProvider per attivare l'editing in-place.
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(
    { admin: await isAdmin() },
    { headers: { "Cache-Control": "no-store" } }
  );
}
