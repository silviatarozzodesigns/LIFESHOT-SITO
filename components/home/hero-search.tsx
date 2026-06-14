"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowRight, Hash, Loader2, Search, User } from "lucide-react";
import { cn, photoSrc } from "@/lib/utils";

interface Result {
  id: string;
  raceNumber: string | null;
  pilotName: string | null;
  eventName: string | null;
}

/**
 * Barra di ricerca hero con risultati ISTANTANEI inline.
 *
 * Cerca per nome pilota O numero di gara (debounce 250ms su /api/search) e
 * mostra le anteprime in un pannello sotto l'input, senza forzare la
 * navigazione in una sotto-pagina. Invio o "Vedi tutti" → /galleria.
 */
export function HeroSearch({
  placeholder,
  large = false,
  dropUp = false,
}: {
  placeholder: string;
  /** Variante ingrandita per la Hero (barra prominente above-the-fold) */
  large?: boolean;
  /** Apre il pannello risultati verso l'alto (barra vicina al fondo schermo) */
  dropUp?: boolean;
}) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  // Debounced fetch
  useEffect(() => {
    const term = q.trim();
    if (term.length < 1) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const id = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(term)}`);
        const payload = await res.json();
        setResults(payload.results ?? []);
        setOpen(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(id);
  }, [q]);

  // Chiudi il pannello al click esterno
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function goToGallery() {
    const term = q.trim();
    if (!term) return;
    const param = /^\d+$/.test(term) ? "numero" : "pilota";
    router.push(`/galleria?${param}=${encodeURIComponent(term)}`);
  }

  return (
    <div ref={boxRef} className={cn("relative", large ? "max-w-xl" : "max-w-md")}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          goToGallery();
        }}
        className={cn(
          "flex items-center gap-2.5 rounded-full border bg-card/80 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.6)] backdrop-blur-md transition-colors focus-within:border-primary/60 hover:border-primary/40",
          large ? "py-2 pl-5 pr-2" : "px-5 py-2"
        )}
      >
        {loading ? (
          <Loader2 className={cn("shrink-0 animate-spin text-muted-foreground", large ? "h-5 w-5" : "h-4 w-4")} />
        ) : (
          <Search className={cn("shrink-0 text-muted-foreground", large ? "h-5 w-5" : "h-4 w-4")} />
        )}
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder={placeholder}
          aria-label="Cerca per nome o numero di gara"
          className={cn(
            "min-w-0 flex-1 bg-transparent outline-none placeholder:text-foreground/60",
            large ? "h-12 text-base" : "h-10 text-base sm:text-sm"
          )}
        />
        <button
          type="submit"
          aria-label="Cerca"
          className={cn(
            "flex shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-all hover:scale-105 hover:shadow-[0_0_24px_-4px_hsl(var(--primary)/0.6)] active:scale-95",
            large ? "h-12 w-12" : "h-9 w-9"
          )}
        >
          <ArrowRight className={large ? "h-5 w-5" : "h-4 w-4"} />
        </button>
      </form>

      {/* Pannello risultati istantanei */}
      {open && q.trim().length > 0 && (
        <div
          className={cn(
            "absolute left-0 right-0 z-30 overflow-hidden rounded-2xl border bg-card/95 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.8)] backdrop-blur-xl",
            dropUp ? "bottom-full mb-2" : "top-full mt-2"
          )}
        >
          {results.length > 0 ? (
            <>
              <ul className="max-h-80 overflow-y-auto p-2">
                {results.map((r) => (
                  <li key={r.id}>
                    <button
                      type="button"
                      onClick={() => router.push(`/foto/${r.id}`)}
                      className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition-colors hover:bg-accent"
                    >
                      <span className="relative h-12 w-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                        <Image
                          src={photoSrc(r.id)}
                          alt=""
                          fill
                          sizes="64px"
                          className="object-cover"
                        />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2 text-sm font-medium">
                          {r.raceNumber && (
                            <span className="inline-flex items-center gap-0.5 text-primary">
                              <Hash className="h-3 w-3" />
                              {r.raceNumber}
                            </span>
                          )}
                          {r.pilotName && (
                            <span className="inline-flex items-center gap-1 truncate">
                              <User className="h-3 w-3 text-muted-foreground" />
                              {r.pilotName}
                            </span>
                          )}
                        </span>
                        {r.eventName && (
                          <span className="block truncate text-xs text-muted-foreground">
                            {r.eventName}
                          </span>
                        )}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={goToGallery}
                className="flex w-full items-center justify-center gap-1.5 border-t bg-background/50 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-accent"
              >
                Vedi tutti i risultati
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </>
          ) : (
            !loading && (
              <p className="px-4 py-6 text-center text-sm text-muted-foreground">
                Nessun risultato per “{q.trim()}”.
              </p>
            )
          )}
        </div>
      )}
    </div>
  );
}
