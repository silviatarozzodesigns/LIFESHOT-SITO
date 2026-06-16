"use client";

import { createElement, useState, useTransition } from "react";
import { AlignCenter, AlignLeft, AlignRight, Minus, Plus } from "lucide-react";
import { useEditMode } from "@/components/cms/edit-mode";
import {
  setField,
  setTextStyle,
  setCustom,
  setCustomStyle,
} from "@/app/actions/content";
import { TEXT_SIZE_EM, type Level, type PageSlug, type TextStyle } from "@/lib/content";
import { cn } from "@/lib/utils";

const ALIGN_CLASS: Record<"left" | "center" | "right", string> = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
};

function notifyParent() {
  if (typeof window !== "undefined" && window.parent !== window) {
    window.parent.postMessage({ type: "ls-content-edited" }, "*");
  }
}

/**
 * Testo editabile IN-PLACE.
 *
 * - Fuori edit mode (visitatori): rende il testo applicando lo stile salvato
 *   (allineamento/dimensione). SSR 1:1, zero overhead.
 * - In edit mode (admin): al PASSAGGIO del mouse compare il contorno + il
 *   tooltip "clicca per modificare" (non tutti evidenziati di default).
 *   Cliccando: contentEditable + un mini-popover con allineamento e
 *   dimensione. Tutto salva in BOZZA (setField/setTextStyle); il sito
 *   pubblico cambia solo dopo "Pubblica".
 */
export function EditableText({
  page,
  k,
  customId,
  value,
  as = "span",
  className,
  maxLength = 2000,
  style,
}: {
  /** Per i testi del registro CMS: pagina + chiave */
  page?: PageSlug;
  k?: string;
  /** Per QUALSIASI testo "fisso" dei componenti: id stabile arbitrario */
  customId?: string;
  value: string;
  as?: keyof React.JSX.IntrinsicElements;
  className?: string;
  maxLength?: number;
  style?: TextStyle;
}) {
  const { editMode, setStatus } = useEditMode();
  const [display, setDisplay] = useState(value);
  const [ts, setTs] = useState<TextStyle>(style ?? {});
  const [active, setActive] = useState(false);
  const [, startTransition] = useTransition();

  const styleClasses = ts.align ? cn("block w-full", ALIGN_CLASS[ts.align]) : undefined;
  const inlineStyle = ts.size ? { fontSize: TEXT_SIZE_EM[ts.size] } : undefined;

  // Visitatore / fuori edit: testo normale con lo stile salvato applicato.
  if (!editMode) {
    return createElement(
      as,
      { className: cn(className, styleClasses), style: inlineStyle },
      display
    );
  }

  function saveText(next: string) {
    setStatus("saving");
    startTransition(async () => {
      const res = customId
        ? await setCustom(customId, next)
        : await setField(page!, k!, next);
      setStatus(res.ok ? "saved" : "error");
      setTimeout(() => setStatus("idle"), 1500);
      if (res.ok) notifyParent();
    });
  }

  function patchStyle(patch: TextStyle) {
    const merged = { ...ts, ...patch };
    setTs(merged);
    setStatus("saving");
    startTransition(async () => {
      const res = customId
        ? await setCustomStyle(customId, patch)
        : await setTextStyle(page!, k!, patch);
      setStatus(res.ok ? "saved" : "error");
      setTimeout(() => setStatus("idle"), 1500);
      if (res.ok) notifyParent();
    });
  }

  const editable = createElement(
    as,
    {
      className: cn(
        "cursor-text rounded-[3px] outline-1 outline-transparent transition-[outline-color] hover:outline-dashed hover:outline-primary/70 focus:outline-2 focus:outline-primary focus:outline-offset-2",
        styleClasses,
        className
      ),
      style: inlineStyle,
      contentEditable: true,
      suppressContentEditableWarning: true,
      spellCheck: false,
      role: "textbox",
      "aria-label": `Modifica: ${customId ?? k}`,
      onFocus: () => setActive(true),
      onBlur: (e: React.FocusEvent<HTMLElement>) => {
        // chiudi il popover solo se il focus esce davvero dal gruppo
        setTimeout(() => setActive(false), 150);
        const next = (e.currentTarget.textContent ?? "")
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, maxLength);
        if (next === display || next.length === 0) {
          e.currentTarget.textContent = display;
          return;
        }
        setDisplay(next);
        saveText(next);
      },
      onKeyDown: (e: React.KeyboardEvent<HTMLElement>) => {
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

  // Wrapper inline-block per ancorare tooltip/popover senza rompere il layout.
  return (
    <span className="group/edit relative inline-block max-w-full align-baseline">
      {editable}

      {/* Tooltip "clicca per modificare" — solo all'hover, non attivo */}
      {!active && (
        <span className="pointer-events-none absolute -top-7 left-0 z-[130] hidden whitespace-nowrap rounded-full bg-primary px-2.5 py-1 text-[11px] font-medium text-primary-foreground opacity-0 shadow-lg transition-opacity group-hover/edit:block group-hover/edit:opacity-100">
            Clicca per modificare
        </span>
      )}

      {/* Popover controlli: allineamento + dimensione */}
      {active && (
        <span
          className="absolute -top-12 left-0 z-[140] flex items-center gap-1 rounded-full border border-border/60 bg-background/95 p-1 shadow-xl backdrop-blur-xl"
          onMouseDown={(e) => e.preventDefault()} // non perdere il focus del testo
        >
          {(["left", "center", "right"] as const).map((a) => {
            const Icon =
              a === "left" ? AlignLeft : a === "center" ? AlignCenter : AlignRight;
            return (
              <button
                key={a}
                type="button"
                onClick={() => patchStyle({ align: a })}
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full transition-colors",
                  ts.align === a
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
                aria-label={`Allinea ${a}`}
              >
                <Icon className="h-3.5 w-3.5" />
              </button>
            );
          })}
          <span className="mx-0.5 h-5 w-px bg-border" />
          <button
            type="button"
            onClick={() =>
              patchStyle({ size: Math.max(1, ((ts.size ?? 3) - 1) as Level) as Level })
            }
            className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Riduci dimensione"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
          <span className="w-5 text-center text-[11px] tabular-nums text-muted-foreground">
            {ts.size ?? 3}
          </span>
          <button
            type="button"
            onClick={() =>
              patchStyle({ size: Math.min(5, ((ts.size ?? 3) + 1) as Level) as Level })
            }
            className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Aumenta dimensione"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </span>
      )}
    </span>
  );
}
