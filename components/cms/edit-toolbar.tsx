"use client";

import Link from "next/link";
import { Check, Loader2, Pencil, Settings2, TriangleAlert, X } from "lucide-react";
import { useEditMode } from "@/components/cms/edit-mode";
import { cn } from "@/lib/utils";

/**
 * Toolbar fluttuante visibile solo all'admin loggato. Attiva/disattiva
 * l'editing in-place sul sito LIVE (nessun ambiente di anteprima separato).
 */
export function EditToolbar() {
  const { editMode, setEditMode, status } = useEditMode();

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-5 z-[120] flex justify-center px-4">
      <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-border/60 bg-background/85 px-2.5 py-2 shadow-[0_12px_45px_-12px_rgba(0,0,0,0.7)] backdrop-blur-xl">
        <button
          type="button"
          onClick={() => setEditMode(!editMode)}
          className={cn(
            "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors",
            editMode
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-foreground hover:bg-accent"
          )}
        >
          {editMode ? <X className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
          {editMode ? "Fine modifica" : "Modifica sito"}
        </button>

        {/* Stato salvataggio */}
        <span className="flex h-8 w-8 items-center justify-center" aria-live="polite">
          {status === "saving" && (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          )}
          {status === "saved" && <Check className="h-4 w-4 text-primary" />}
          {status === "error" && (
            <TriangleAlert className="h-4 w-4 text-destructive" />
          )}
        </span>

        <Link
          href="/admin/contenuti"
          className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          title="Editor avanzato (immagini, gallerie, SEO)"
        >
          <Settings2 className="h-4 w-4" />
        </Link>
      </div>

      {editMode && (
        <span className="pointer-events-none absolute -top-9 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground shadow-lg">
          Clicca un testo per modificarlo · si salva da solo
        </span>
      )}
    </div>
  );
}
