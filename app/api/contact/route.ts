import { NextResponse } from "next/server";
import { site } from "@/lib/site";

/**
 * Invio del form di contatto come email via SMTP (nodemailer).
 *
 * Variabili richieste (vedi .env.example): SMTP_HOST, SMTP_PORT,
 * SMTP_USER, SMTP_PASS. Con Gmail: smtp.gmail.com:465 + App Password.
 * Il messaggio arriva a CONTACT_EMAIL (default: email ufficiale) con
 * reply-to impostato sul mittente, così si risponde con un clic.
 */

export const runtime = "nodejs";

const MAX = { name: 100, email: 200, message: 3000 } as const;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function POST(request: Request) {
  let body: {
    name?: string;
    email?: string;
    message?: string;
    website?: string; // honeypot anti-bot: i browser reali lo lasciano vuoto
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Richiesta non valida." },
      { status: 400 }
    );
  }

  // Honeypot compilato → quasi certamente un bot: si finge successo
  if (body.website) return NextResponse.json({ ok: true });

  const name = body.name?.trim() ?? "";
  const email = body.email?.trim() ?? "";
  const message = body.message?.trim() ?? "";

  if (name.length < 2 || name.length > MAX.name) {
    return NextResponse.json(
      { ok: false, error: "Inserisci il tuo nome." },
      { status: 400 }
    );
  }
  if (!EMAIL_RE.test(email) || email.length > MAX.email) {
    return NextResponse.json(
      { ok: false, error: "Inserisci un indirizzo email valido." },
      { status: 400 }
    );
  }
  if (message.length < 10 || message.length > MAX.message) {
    return NextResponse.json(
      { ok: false, error: "Il messaggio deve avere almeno 10 caratteri." },
      { status: 400 }
    );
  }

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    console.warn("[lifeshot] form contatti: SMTP non configurato.");
    return NextResponse.json(
      {
        ok: false,
        error: `Il modulo non è al momento disponibile: scrivici direttamente a ${site.email}.`,
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
      from: `"Sito Lifeshot" <${SMTP_USER}>`,
      to: process.env.CONTACT_EMAIL || site.email,
      replyTo: `"${name.replace(/"/g, "'")}" <${email}>`,
      subject: `Nuovo messaggio dal sito — ${name}`,
      text: `Nome: ${name}\nEmail: ${email}\n\n${message}`,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[lifeshot] invio email fallito:", error);
    return NextResponse.json(
      {
        ok: false,
        error: `Invio non riuscito. Riprova tra poco o scrivici a ${site.email}.`,
      },
      { status: 500 }
    );
  }
}
