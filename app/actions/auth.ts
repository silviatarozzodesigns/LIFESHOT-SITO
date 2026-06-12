"use server";

import { redirect } from "next/navigation";
import { createSession, destroySession, verifyPassword } from "@/lib/auth";

export interface LoginState {
  error: string;
}

export async function login(
  _prev: LoginState | null,
  formData: FormData
): Promise<LoginState> {
  if (!process.env.ADMIN_PASSWORD) {
    return {
      error:
        "ADMIN_PASSWORD non configurata sul server. Aggiungila al file .env.local (o alle variabili Vercel).",
    };
  }

  const password = String(formData.get("password") ?? "");
  if (!verifyPassword(password)) {
    return { error: "Password errata." };
  }

  await createSession();
  redirect("/admin");
}

export async function logout(): Promise<void> {
  await destroySession();
  redirect("/admin/login");
}
