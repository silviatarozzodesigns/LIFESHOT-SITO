import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { LogoMark } from "@/components/brand/logo";
import { FadeIn } from "@/components/motion/fade-in";
import { LoginForm } from "@/components/admin/login-form";

export const metadata = { title: "Accesso amministratore" };
export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  if (await isAdmin()) redirect("/admin");

  return (
    <main className="flex min-h-dvh items-center justify-center px-6">
      <FadeIn className="w-full max-w-sm">
        <div className="flex flex-col items-center text-center">
          <LogoMark className="h-14 w-auto" />
          <h1 className="mt-8 text-2xl font-semibold tracking-tight">
            Area amministratore
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Inserisci la password per gestire eventi e foto.
          </p>
        </div>
        <LoginForm />
      </FadeIn>
    </main>
  );
}
