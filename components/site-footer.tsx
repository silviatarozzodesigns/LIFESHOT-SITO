import Link from "next/link";
import { LogoWordmark } from "@/components/brand/logo";
import { CookieSettingsButton } from "@/components/legal/cookie-settings-button";
import { company } from "@/lib/site";

const linkClass =
  "transition-colors hover:text-primary focus-visible:text-primary focus-visible:outline-none";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/50">
      <div className="container flex flex-col items-center gap-4 py-8 text-center text-xs leading-relaxed text-muted-foreground">
        {/* Link legali */}
        <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 font-medium">
          <Link href="/privacy-policy" className={linkClass}>
            Privacy Policy
          </Link>
          <Link href="/cookie-policy" className={linkClass}>
            Cookie Policy
          </Link>
          <CookieSettingsButton className={linkClass} />
        </nav>

        {/* Dati fiscali (obbligo siti professionali IT) */}
        <p className="max-w-2xl text-balance text-muted-foreground/80">
          {company.legalName} · Sede legale: {company.address} · P. IVA{" "}
          {company.vat}
        </p>

        {/* Copyright + brand */}
        <p className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
          <span className="inline-flex items-center gap-2">
            © {new Date().getFullYear()}
            <LogoWordmark className="h-2.5 w-auto text-foreground/80" />
          </span>
          <span>— Agenzia creativa · Fotografia, Video e Grafica</span>
        </p>
      </div>
    </footer>
  );
}
