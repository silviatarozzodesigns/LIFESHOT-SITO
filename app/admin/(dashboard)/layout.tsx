import Link from "next/link";
import { ExternalLink, LogOut } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { logout } from "@/app/actions/auth";
import { Logo } from "@/components/brand/logo";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await requireAdmin();

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/70 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between">
          <Link
            href="/admin"
            className="inline-flex items-center gap-3"
            aria-label="Dashboard admin"
          >
            <Logo />
            <span className="rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-semibold text-primary">
              Admin
            </span>
          </Link>
          <nav className="flex items-center gap-5 text-sm text-muted-foreground">
            <Link
              href="/admin"
              className="transition-colors hover:text-primary"
            >
              Eventi
            </Link>
            <Link
              href="/admin/video"
              className="transition-colors hover:text-primary"
            >
              Video
            </Link>
            <Link
              href="/"
              target="_blank"
              className="inline-flex items-center gap-1.5 transition-colors hover:text-primary"
            >
              Vedi sito
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
            <form action={logout}>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 transition-colors hover:text-primary"
              >
                <LogOut className="h-3.5 w-3.5" />
                Esci
              </button>
            </form>
          </nav>
        </div>
      </header>

      <main className="container flex-1 py-10">{children}</main>
    </div>
  );
}
