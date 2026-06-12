"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Instagram, Mail, Menu, X, Youtube } from "lucide-react";
import { Logo, LogoMark } from "@/components/brand/logo";
import { site } from "@/lib/site";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/galleria", label: "Galleria" },
  { href: "/video", label: "Video" },
  { href: "/chi-siamo", label: "Chi siamo" },
  { href: "/contatti", label: "Contatti" },
];

/**
 * Navbar cinematografica: trasparente in cima, vetro sfocato allo scroll.
 * Su mobile i link lasciano il posto a un menu a finestra a tutto schermo
 * con voci grandi, animazione fluida e canali social in fondo.
 */
export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Blocca lo scroll della pagina quando il menu è aperto
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <>
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

          {/* Nav desktop */}
          <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="transition-colors hover:text-primary"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Hamburger mobile */}
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Apri il menu"
            aria-expanded={menuOpen}
            className="flex h-10 w-10 items-center justify-center rounded-full text-foreground transition-colors hover:bg-accent md:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Menu a finestra (mobile) */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            key="mobile-menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="fixed inset-0 z-[60] flex flex-col bg-background/95 backdrop-blur-2xl md:hidden"
          >
            <div className="container flex h-16 shrink-0 items-center justify-between">
              <Link
                href="/"
                aria-label="Lifeshot — Home"
                onClick={() => setMenuOpen(false)}
              >
                <Logo />
              </Link>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                aria-label="Chiudi il menu"
                className="flex h-10 w-10 items-center justify-center rounded-full text-foreground transition-colors hover:bg-accent"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex flex-1 flex-col items-center justify-center gap-1 px-6">
              {NAV_LINKS.map((link, index) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.4,
                    delay: 0.08 + index * 0.06,
                    ease: [0.21, 0.47, 0.32, 0.98],
                  }}
                >
                  <Link
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className="block rounded-2xl px-6 py-3 text-3xl font-semibold tracking-tight transition-colors hover:text-primary"
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}
            </nav>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.4 }}
              className="flex shrink-0 flex-col items-center gap-4 pb-10"
            >
              <div className="flex items-center gap-3">
                <a
                  href={site.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/15 text-primary transition-transform hover:scale-105"
                >
                  <Instagram className="h-5 w-5" />
                </a>
                <a
                  href={site.youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="YouTube"
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/15 text-primary transition-transform hover:scale-105"
                >
                  <Youtube className="h-5 w-5" />
                </a>
                <a
                  href={`mailto:${site.email}`}
                  aria-label="Email"
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/15 text-primary transition-transform hover:scale-105"
                >
                  <Mail className="h-5 w-5" />
                </a>
              </div>
              <LogoMark className="h-5 w-auto text-muted-foreground/50" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
