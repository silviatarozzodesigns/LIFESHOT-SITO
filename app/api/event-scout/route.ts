import { NextResponse } from "next/server";
import { site } from "@/lib/site";

/**
 * "Invita Lifeshot al tuo evento" — segnalazioni eventi dai rider.
 * Invia il lead via email (stessa configurazione SMTP del form contatti).
 */

export const runtime = "nodejs";

const MAX = { name: 100, event: 150, location: 150, date: 40, note: 1000 } as const;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function POST(request: Request) {
  let body: {
    name?: string;
    email?: string;
    eventName?: string;
    location?: string;
    date?: string;
    note?: string;
    website?: string; // honeypot
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Richiesta non valida." }, { status: 400 });
  }

  if (body.website) return NextResponse.json({ ok: true });

  const name = body.name?.trim() ?? "";
  const email = body.email?.trim() ?? "";
  const eventName = body.eventName?.trim() ?? "";
  const location = body.location?.trim() ?? "";
  const date = body.date?.trim() ?? "";
  const note = body.note?.trim() ?? "";

  if (name.length < 2 || name.length > MAX.name) {
    return NextResponse.json({ ok: false, error: "Inserisci il tuo nome." }, { status: 400 });
  }
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json(
      { ok: false, error: "Inserisci un'email valida." },
      { status: 400 }
    );
  }
  if (eventName.length < 2 || eventName.length > MAX.event) {
    return NextResponse.json(
      { ok: false, error: "Dicci il nome dell'evento." },
      { status: 400 }
    );
  }
  if (location.length > MAX.location || date.length > MAX.date || note.length > MAX.note) {
    return NextResponse.json({ ok: false, error: "Campi troppo lunghi." }, { status: 400 });
  }

  const { SMTP_HOST, SMTP_USER, SMTP_PASS, SMTP_PORT } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    console.warn("[lifeshot] event-scout: SMTP non configurato.");
    return NextResponse.json(
      {
        ok: false,
        error: `Modulo non disponibile al momento: scrivici a ${site.email}.`,
      },
      { status: 503 }
    );
  }

  try {
    const nodemailer = await import("nodemailer");
    const port = Number(SMTP_PORT) || 465;
    const transport = nodemailer.createTransport({
      host: SMTP_HOST,
      port,
      secure: port === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });

    await transport.sendMail({
      from: `"Lifeshot — Segnalazione evento" <${SMTP_USER}>`,
      to: process.env.CONTACT_EMAIL || site.email,
      replyTo: `"${name.replace(/"/g, "'")}" <${email}>`,
      subject: `Nuovo evento segnalato: ${eventName}`,
      text:
        `Segnalato da: ${name} (${email})\n` +
        `Evento: ${eventName}\n` +
        `Luogo: ${location || "—"}\n` +
        `Data: ${date || "—"}\n\n` +
        `Note:\n${note || "—"}`,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[lifeshot] invio segnalazione fallito:", error);
    return NextResponse.json(
      { ok: false, error: `Invio non riuscito. Riprova o scrivici a ${site.email}.` },
      { status: 500 }
    );
  }
}
