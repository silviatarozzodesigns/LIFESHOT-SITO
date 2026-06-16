"use client";

import { useRef, useState } from "react";
import { ImageUp, Loader2 } from "lucide-react";
import { useEditMode } from "@/components/cms/edit-mode";
import { setImageField } from "@/app/actions/content";
import { uploadAssetFile } from "@/lib/upload-client";
import type { PageSlug } from "@/lib/content";
import { cn } from "@/lib/utils";

/**
 * Pulsante "cambia immagine" in-place. Visibile solo all'admin in edit mode.
 * Carica un asset su Cloudflare e aggiorna il campo immagine in BOZZA, poi
 * ricarica l'anteprima per mostrarla. Il vecchio file viene rimosso dal cloud.
 */
export function EditableImage({
  page,
  k,
  label,
  className,
}: {
  page: PageSlug;
  k: string;
  label: string;
  className?: string;
}) {
  const { editMode, setStatus } = useEditMode();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  if (!editMode) return null;

  async function onFile(file: File) {
    setBusy(true);
    setStatus("saving");
    try {
      const url = await uploadAssetFile(file);
      const res = await setImageField(page, k, url);
      setStatus(res.ok ? "saved" : "error");
      if (res.ok) {
        if (window.parent !== window) {
          window.parent.postMessage({ type: "ls-content-edited" }, "*");
        }
        window.location.reload(); // mostra la nuova immagine nell'anteprima
      }
    } catch {
      setStatus("error");
    } finally {
      setBusy(false);
      setTimeout(() => setStatus("idle"), 1500);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className={cn(
          "pointer-events-auto inline-flex items-center gap-1.5 rounded-full bg-background/85 px-3 py-1.5 text-xs font-semibold text-foreground shadow-lg ring-1 ring-border/60 backdrop-blur-md transition-colors hover:bg-primary hover:text-primary-foreground",
          className
        )}
      >
        {busy ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <ImageUp className="h-3.5 w-3.5" />
        )}
        {label}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
          e.target.value = "";
        }}
      />
    </>
  );
}
