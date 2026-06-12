"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface EditableTextProps {
  value: string;
  onChange: (value: string) => void;
  /** Tag renderizzato (h1, h2, p, span…) — lo stile resta quello del sito */
  as?: React.ElementType;
  className?: string;
}

/**
 * MODIFICA INLINE "CLICK-TO-EDIT" (WYSIWYG).
 *
 * - Hover: outline tratteggiato + badge "Clicca per modificare"
 * - Click: l'elemento diventa editabile sul posto (contentEditable)
 * - Two-way binding: `onInput` aggiorna lo stato React a ogni keystroke
 *   (→ la sidebar si sincronizza in tempo reale); quando lo stato cambia
 *   dall'esterno (sidebar → preview) il DOM viene aggiornato SOLO se
 *   l'elemento non ha il focus, così il cursore non salta mai.
 * - Incolla: solo testo semplice (niente HTML che romperebbe il design)
 */
export function EditableText({
  value,
  onChange,
  as: Tag = "span",
  className,
}: EditableTextProps) {
  const ref = useRef<HTMLElement | null>(null);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (el && !focused && el.textContent !== value) {
      el.textContent = value;
    }
  }, [value, focused]);

  const Comp = Tag as React.ElementType;

  return (
    <Comp
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      spellCheck={false}
      role="textbox"
      aria-label="Testo modificabile"
      onFocus={() => setFocused(true)}
      onBlur={(e: React.FocusEvent<HTMLElement>) => {
        setFocused(false);
        onChange(e.currentTarget.textContent ?? "");
      }}
      onInput={(e: React.FormEvent<HTMLElement>) =>
        onChange(e.currentTarget.textContent ?? "")
      }
      onKeyDown={(e: React.KeyboardEvent<HTMLElement>) => {
        if (e.key === "Enter") {
          e.preventDefault();
          (e.currentTarget as HTMLElement).blur();
        }
        if (e.key === "Escape") (e.currentTarget as HTMLElement).blur();
      }}
      onPaste={(e: React.ClipboardEvent<HTMLElement>) => {
        e.preventDefault();
        document.execCommand(
          "insertText",
          false,
          e.clipboardData.getData("text/plain")
        );
      }}
      className={cn(
        "relative cursor-text rounded-sm outline-none transition-all duration-150",
        // Feedback in hover: outline tratteggiato + badge
        "hover:outline hover:outline-2 hover:outline-dashed hover:outline-primary/70 hover:outline-offset-4",
        "after:pointer-events-none after:absolute after:-top-7 after:left-1/2 after:z-20 after:-translate-x-1/2 after:whitespace-nowrap after:rounded-full after:bg-primary after:px-2.5 after:py-0.5 after:text-[10px] after:font-semibold after:tracking-normal after:text-primary-foreground after:opacity-0 after:transition-opacity after:content-['Clicca_per_modificare']",
        "hover:after:opacity-100 focus:after:opacity-0",
        // Stato attivo: outline pieno giallo
        "focus:outline focus:outline-2 focus:outline-primary focus:outline-offset-4",
        className
      )}
    />
  );
}
