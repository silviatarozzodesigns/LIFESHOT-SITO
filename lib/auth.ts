import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

/**
 * Autenticazione admin minimale basata su ADMIN_PASSWORD.
 *
 * Al login viene impostato un cookie httpOnly contenente un token HMAC
 * derivato dalla password: non è la password in chiaro, e cambia se la
 * password viene ruotata (invalidando le sessioni esistenti).
 * Sufficiente per una dashboard mono-operatore; evolvibile in futuro
 * verso un sistema multi-utente (es. Auth.js).
 */

const COOKIE_NAME = "lifeshot_admin";
const SESSION_DAYS = 7;

function expectedToken(): string | null {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return null;
  return createHmac("sha256", password)
    .update("lifeshot-admin-session-v1")
    .digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}

export function verifyPassword(input: string): boolean {
  const password = process.env.ADMIN_PASSWORD;
  if (!password || !input) return false;
  return safeEqual(input, password);
}

export async function isAdmin(): Promise<boolean> {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  const expected = expectedToken();
  if (!token || !expected) return false;
  return safeEqual(token, expected);
}

/** Da usare nelle pagine/layout admin: redirige al login se non autenticati */
export async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) redirect("/admin/login");
}

/** Da chiamare dentro Server Action e Route Handler (set cookie consentito) */
export async function createSession(): Promise<void> {
  const token = expectedToken();
  if (!token) throw new Error("ADMIN_PASSWORD non configurata.");
  (await cookies()).set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * SESSION_DAYS,
  });
}

export async function destroySession(): Promise<void> {
  (await cookies()).delete(COOKIE_NAME);
}
