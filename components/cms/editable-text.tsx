"use client";

import { createElement, useState, useTransition } from "react";
import { useEditMode } from "@/components/cms/edit-mode";
import { setField } from "@/app/actions/content";
import type { PageSlug } from "@/lib/content";
import { cn } from "@/lib/utils";

/**
 * Testo editabile IN-PLACE sul sito live.
 *
 * - Fuori edit mode (o per i visitatori): rende il testo normalissimo,
 *   con SSR identico al sito attuale → rendering 1:1, zero impatto.
 * - In edit mode (admin): l'elemento diventa contentEditable; al blur
 *   salva il nuovo valore con la server action `setField`, che aggiorna
 *   subito il sito live (published + revalidate). Aggiornamento ottimistico
 *   nel DOM, quindi coerenza immediata editor ↔ live.
 *
 * Durante la digitazione NON facciamo setState: React non ri-renderizza,
 * così il cursore resta stabile (niente caret jump).
 */
export function EditableText({
  page,
  k,
  value,
  as = "span",
  className,
  maxLength = 2000,
}: {
  page: PageSlug;
  k: string;
  value: string;
  as?: keyof React.JSX.IntrinsicElements;
  className?: string;
  maxLength?: number;
}) {
  const { editMode, setStatus } = useEditMode();
  const [display, setDisplay] = useState(value);
  const [, startTransition] = useTransition();

  if (!editMode) {
    return createElement(as, { className }, display);
  }

  return createElement(
    as,
    {
      className: cn(
        "cursor-text rounded-[3px] outline-dashed outline-1 outline-primary/40 transition-[outline] hover:outline-primary focus:outline-2 focus:outline-primary focus:outline-offset-2",
        className
      ),
      contentEditable: true,
      suppressContentEditableWarning: true,
      spellCheck: false,
      role: "textbox",
      "aria-label": `Modifica: ${k}`,
      onBlur: (e: React.FocusEvent<HTMLElement>) => {
        const next = (e.currentTarget.textContent ?? "")
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, maxLength);
        if (next === display || next.length === 0) {
          e.currentTarget.textContent = display; // ripristina se vuoto/uguale
          return;
        }
        setDisplay(next);
        setStatus("saving");
        startTransition(async () => {
          const res = await setField(page, k, next);
          setStatus(res.ok ? "saved" : "error");
          setTimeout(() => setStatus("idle"), 1500);
        });
      },
      onKeyDown: (e: React.KeyboardEvent<HTMLElement>) => {
        // Invio conferma (esce dal campo); Esc annulla
        if (e.key === "Enter" && as !== "div") {
          e.preventDefault();
          (e.currentTarget as HTMLElement).blur();
        }
        if (e.key === "Escape") {
          e.currentTarget.textContent = display;
          (e.currentTarget as HTMLElement).blur();
        }
      },
    },
    display
  );
}
