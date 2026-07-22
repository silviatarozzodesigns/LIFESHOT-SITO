import { NextResponse } from "next/server";
import { getPhotoById } from "@/lib/data/photos";

/**
 * Metadati pubblici di una foto (evento, numeri, pilota, nome file) in JSON.
 * Serve al visore del dettaglio per aggiornare il pannello quando si scorre
 * con le frecce, senza ricaricare la pagina. Solo dati già pubblici, quelli
 * che la pagina /foto/[id] mostra comunque.
 */
export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const photo = await getPhotoById(id);
  if (!photo) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }
  return NextResponse.json({ ok: true, photo });
}
