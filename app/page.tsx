import Link from "next/link";
import { ArrowRight, Search } from "lucide-react";
import { Logo } from "@/components/brand/logo";

/**
 * Homepage — versione iniziale (architettura).
 * Prossimi step: griglia "Eventi Recenti" da MongoDB, barra di ricerca
 * funzionante (evento + numero di gara), animazioni Framer Motion.
 */
export default function HomePage() {
  return (
    <div className="flex min-h-dvh flex-col">
      {/* Header */}
      <header className="container flex h-16 items-center justify-between">
        <Logo />
        <nav className="flex items-center gap-6 text-sm text-muted-foreground">
          <Link href="/" className="transition-colors hover:text-foreground">
            Eventi
          </Link>
          <Link href="/" className="transition-colors hover:text-foreground">
            Galleria
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <main className="container flex flex-1 flex-col items-center justify-center py-24 text-center">
        <p className="mb-4 text-sm font-medium uppercase tracking-[0.3em] text-muted-foreground">
          Fotografia · Video · Grafica
        </p>
        <h1 className="max-w-3xl text-balance text-5xl font-semibold tracking-tight sm:text-7xl">
          I tuoi momenti,
          <br />
          <span className="text-muted-foreground">scattati per durare.</span>
        </h1>
        <p className="mt-6 max-w-xl text-balance text-lg text-muted-foreground">
          Cerca le foto del tuo evento con il tuo numero di gara e portale a
          casa in pochi clic.
        </p>

        {/* Barra di ricerca — placeholder, verrà collegata al motore di ricerca */}
        <div className="mt-10 flex w-full max-w-md items-center gap-3 rounded-full border bg-card px-5 py-3.5 text-left text-muted-foreground shadow-sm transition-colors hover:border-foreground/30">
          <Search className="h-4 w-4 shrink-0" />
          <span className="flex-1 text-sm">
            Cerca evento o numero di gara…
          </span>
          <ArrowRight className="h-4 w-4 shrink-0" />
        </div>
      </main>

      <footer className="container flex h-16 items-center justify-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Lifeshot — Agenzia creativa
      </footer>
    </div>
  );
}
