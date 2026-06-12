import Link from "next/link";
import { Logo } from "@/components/brand/logo";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/70 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" aria-label="Lifeshot — Home">
          <Logo />
        </Link>
        <nav className="flex items-center gap-6 text-sm text-muted-foreground">
          <Link href="/galleria" className="transition-colors hover:text-foreground">
            Galleria
          </Link>
          <Link
            href="/#eventi"
            className="transition-colors hover:text-foreground"
          >
            Eventi
          </Link>
        </nav>
      </div>
    </header>
  );
}
