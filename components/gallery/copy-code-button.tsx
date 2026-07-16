"use client";

import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Copia il codice dello scatto negli appunti.
 *
 * Serve al passo che costa di più al cliente: leggere il codice, aprire
 * Instagram e riscriverlo a mano senza sbagliare. Un tocco e lo incolla.
 *
 * Se gli appunti non sono disponibili (browser vecchi, pagina non sicura)
 * seleziona il testo: almeno resta il copia-incolla manuale, senza errori
 * di battitura.
 */
export function CopyCodeButton({
  code,
  className,
}: {
  code: string;
  className?: string;
}) {
  const [copiato, setCopiato] = useState(false);

  // La conferma torna da sola allo stato normale
  useEffect(() => {
    if (!copiato) return;
    const t = setTimeout(() => setCopiato(false), 2000);
    return () => clearTimeout(t);
  }, [copiato]);

  async function copia() {
    try {
      await navigator.clipboard.writeText(code);
      setCopiato(true);
    } catch {
      // Niente appunti: seleziona il codice così si copia a mano
      const el = document.getElementById("codice-scatto");
      if (el) {
        const range = document.createRange();
        range.selectNodeContents(el);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
    }
  }

  return (
    <button
      type="button"
      onClick={copia}
      aria-label={copiato ? "Codice copiato" : "Copia il codice dello scatto"}
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors",
        copiato
          ? "border-primary/50 text-primary"
          : "text-muted-foreground hover:border-primary/50 hover:text-primary",
        className
      )}
    >
      {copiato ? (
        <>
          <Check className="h-3.5 w-3.5" />
          Copiato
        </>
      ) : (
        <>
          <Copy className="h-3.5 w-3.5" />
          Copia
        </>
      )}
    </button>
  );
}
