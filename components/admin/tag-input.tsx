"use client";

import { useRef, useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface TagInputProps {
  value: string[];
  onChange: (next: string[]) => void;
  /** Chiamato quando il campo perde il focus (per salvare). */
  onCommit?: () => void;
  placeholder?: string;
  ariaLabel?: string;
  /** Glifo a sinistra (es. "#" per i numeri, "P" per i piloti). */
  prefix?: string;
  className?: string;
}

/**
 * Campo multi-tag a "chip": l'admin digita testo libero e conferma con
 * Invio o virgola; ogni tag diventa una pillola rimovibile. Accetta
 * qualsiasi stringa (numeri, alfanumerici, "senza numero", nomi pilota).
 */
export function TagInput({
  value,
  onChange,
  onCommit,
  placeholder,
  ariaLabel,
  prefix,
  className,
}: TagInputProps) {
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function addTag(raw: string) {
    const tag = raw.trim();
    if (!tag) return;
    // Dedup case-insensitive
    if (!value.some((t) => t.toLowerCase() === tag.toLowerCase())) {
      onChange([...value, tag]);
    }
    setDraft("");
  }

  function removeTag(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(draft);
    } else if (e.key === "Backspace" && !draft && value.length) {
      // Backspace a campo vuoto: elimina l'ultimo tag
      removeTag(value.length - 1);
    }
  }

  function handleBlur() {
    if (draft.trim()) addTag(draft);
    onCommit?.();
  }

  return (
    <div className="flex items-start gap-1.5">
      {prefix && (
        <span className="mt-1 w-3 shrink-0 text-center text-[10px] text-muted-foreground">
          {prefix}
        </span>
      )}
      <div
        onClick={() => inputRef.current?.focus()}
        className={cn(
          "flex min-h-7 w-full min-w-0 flex-wrap items-center gap-1 rounded-md border bg-background px-1.5 py-1 text-xs",
          "focus-within:ring-1 focus-within:ring-ring",
          className
        )}
      >
        {value.map((tag, i) => (
          <span
            key={`${tag}-${i}`}
            className="inline-flex max-w-full items-center gap-1 rounded bg-primary/15 px-1.5 py-0.5 text-primary"
          >
            <span className="truncate">{tag}</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeTag(i);
              }}
              aria-label={`Rimuovi ${tag}`}
              className="shrink-0 rounded-sm hover:text-destructive"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          placeholder={value.length ? "" : placeholder}
          aria-label={ariaLabel}
          className="h-5 min-w-[3rem] flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
        />
      </div>
    </div>
  );
}
