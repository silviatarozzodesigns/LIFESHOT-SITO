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
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden px-6">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="glow-primary absolute left-1/2 top-[-25%] h-[30rem] w-[50rem] -translate-x-1/2" />
        <div className="glow-blue absolute bottom-[-35%] right-[-15%] h-[26rem] w-[40rem]" />
      </div>
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
