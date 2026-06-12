"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { cn } from "@/lib/utils";

/**
 * Navbar cinematografica: trasparente in cima alla pagina, guadagna
 * vetro sfocato (backdrop-blur) e bordo quando si scorre verso il basso.
 */
export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-all duration-500",
        scrolled
          ? "border-b border-border/60 bg-background/70 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.45)] backdrop-blur-xl"
          : "border-b border-transparent bg-transparent"
      )}
    >
      <div className="container flex h-16 items-center justify-between">
        <Link
          href="/"
          aria-label="Lifeshot — Home"
          className="transition-opacity hover:opacity-80"
        >
          <Logo />
        </Link>
        <nav className="flex items-center gap-4 text-sm text-muted-foreground sm:gap-6">
          <Link href="/galleria" className="transition-colors hover:text-primary">
            Galleria
          </Link>
          <Link href="/video" className="transition-colors hover:text-primary">
            Video
          </Link>
          <Link
            href="/chi-siamo"
            className="transition-colors hover:text-primary"
          >
            Chi siamo
          </Link>
          <Link
            href="/contatti"
            className="transition-colors hover:text-primary"
          >
            Contatti
          </Link>
        </nav>
      </div>
    </header>
  );
}
