import { NextResponse } from "next/server";
import { searchPhotosByQuery } from "@/lib/data/photos";

/**
 * Ricerca istantanea pubblica per la barra hero.
 * GET /api/search?q=<nome o numero> → risultati (foto) per anteprima inline.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q") ?? "";
  if (q.trim().length < 1) {
    return NextResponse.json({ ok: true, results: [] });
  }

  const photos = await searchPhotosByQuery(q, 12);
  return NextResponse.json({
    ok: true,
    results: photos.map((p) => ({
      id: p.id,
      raceNumber: p.raceNumber,
      pilotName: p.pilotName,
      eventName: p.event?.name ?? null,
    })),
  });
}
