"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Instagram, Mail, Menu, Phone, X, Youtube } from "lucide-react";
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
      {/* Barra FLUTTUANTE: non tocca i bordi, vetro sfocato, capsula stondata.
          pointer-events-none sul guscio così il padding trasparente non blocca
          i click sull'hero sottostante; la barra riattiva i puntatori. */}
      <header className="pointer-events-none sticky top-0 z-50 px-3 pt-3 sm:px-4 sm:pt-5">
        <div
          className={cn(
            "pointer-events-auto mx-auto flex max-w-6xl items-center justify-between gap-4 rounded-full border transition-all duration-500",
            "px-4 py-2.5 sm:px-6 sm:py-3",
            scrolled
              ? "border-border/60 bg-background/80 shadow-[0_12px_45px_-12px_rgba(0,0,0,0.6)] backdrop-blur-xl"
              : "border-white/10 bg-background/55 shadow-[0_8px_30px_-16px_rgba(0,0,0,0.5)] backdrop-blur-lg"
          )}
        >
          <Link
            href="/"
            aria-label="Lifeshot — Home"
            className="transition-opacity hover:opacity-80"
          >
            <Logo />
          </Link>

          {/* Nav desktop — font uniforme */}
          <nav className="hidden items-center gap-7 text-sm font-medium text-muted-foreground md:flex">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="transition-colors hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* CTA capsula (desktop) + hamburger (mobile) */}
          <div className="flex items-center gap-2">
            <a
              href={site.instagramDmUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:scale-[1.03] hover:shadow-primary/40 md:inline-flex"
            >
              <Phone className="h-4 w-4" />
              Contattaci
            </a>

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
