"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Check, Loader2, Search, Star, Trash2, X } from "lucide-react";
import {
  deletePhoto,
  togglePhotoFeatured,
  updatePhotoMeta,
} from "@/app/actions/photos";
import type { AdminPhotoDTO } from "@/lib/data/admin";
import { TagInput } from "@/components/admin/tag-input";
import { photoMatchesQuery } from "@/lib/tag-match";
import { cn } from "@/lib/utils";

/** Confronto ordine-insensitive di due liste di tag. */
function sameTags(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const norm = (list: string[]) => [...list].map((t) => t.toLowerCase()).sort();
  const na = norm(a);
  const nb = norm(b);
  return na.every((t, i) => t === nb[i]);
}

/**
 * Griglia foto della dashboard: filtro rapido (numero / "senza numero" /
 * pilota / nome file) + tag modificabili inline con autosave, cancellazione
 * singola. Le anteprime passano dalla rotta watermark (/api/images).
 */
export function PhotoAdminGrid({ photos }: { photos: AdminPhotoDTO[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(
    () => photos.filter((p) => photoMatchesQuery(p, query)),
    [photos, query]
  );

  if (!photos.length) {
    return (
      <p className="mt-4 text-sm text-muted-foreground">
        Nessuna foto caricata per questo evento.
      </p>
    );
  }

  return (
    <div className="mt-4">
      {/* Filtro: numero di gara (anche "senza numero"/S/N), pilota o nome file */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filtra: numero di gara, senza numero, pilota o nome file…"
            aria-label="Filtra foto"
            className="h-10 w-full rounded-lg border bg-background pl-9 pr-9 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Azzera filtro"
              className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <span className="shrink-0 text-xs text-muted-foreground">
          {query
            ? `${filtered.length} di ${photos.length}`
            : `${photos.length} foto`}
        </span>
      </div>

      {filtered.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">
          Nessuna foto corrisponde a “{query}”.
        </p>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {filtered.map((photo) => (
            <PhotoAdminCard key={photo.id} photo={photo} />
          ))}
        </div>
      )}
    </div>
  );
}

function PhotoAdminCard({ photo }: { photo: AdminPhotoDTO }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [numbers, setNumbers] = useState<string[]>(photo.raceNumbers);
  const [pilots, setPilots] = useState<string[]>(photo.pilotNames);
  const [saved, setSaved] = useState(false);
  const [featured, setFeatured] = useState(photo.featured);

  // Ultimo stato realmente salvato: per capire cosa autosalvare.
  const savedSnapshot = useRef({ numbers: photo.raceNumbers, pilotNames: photo.pilotNames });

  function toggleFeatured() {
    const next = !featured;
    setFeatured(next); // ottimistico
    startTransition(async () => {
      const result = await togglePhotoFeatured(photo.id, next);
      if (!result.ok) setFeatured(!next);
      else router.refresh();
    });
  }

  // Autosave robusto: parte a ogni modifica dei tag (aggiunta O rimozione),
  // leggendo SEMPRE lo stato aggiornato — niente più salvataggi con valori
  // vecchi (causa del bug "non salva le correzioni"). Debounce per non
  // scrivere a ogni tasto.
  useEffect(() => {
    const snap = savedSnapshot.current;
    if (sameTags(numbers, snap.numbers) && sameTags(pilots, snap.pilotNames)) {
      return;
    }
    const timer = setTimeout(() => {
      startTransition(async () => {
        const result = await updatePhotoMeta(photo.id, {
          raceNumbers: numbers,
          pilotNames: pilots,
        });
        if (result.ok) {
          savedSnapshot.current = { numbers, pilotNames: pilots };
          setSaved(true);
          setTimeout(() => setSaved(false), 1500);
          router.refresh();
        }
      });
    }, 600);
    return () => clearTimeout(timer);
  }, [numbers, pilots, photo.id, router]);

  function handleDelete() {
    if (!window.confirm(`Eliminare "${photo.originalFilename}"?`)) return;
    startTransition(async () => {
      const result = await deletePhoto(photo.id);
      if (result.ok) router.refresh();
    });
  }

  return (
    <figure
      className={cn(
        "group overflow-hidden rounded-xl border bg-card transition-opacity",
        isPending && "opacity-60"
      )}
    >
      <div className="relative aspect-[3/2] bg-muted">
        <Image
          src={`/api/images/${photo.id}`}
          alt={photo.originalFilename}
          fill
          sizes="(max-width: 640px) 50vw, 20vw"
          className="object-cover"
        />
        <button
          type="button"
          onClick={handleDelete}
          disabled={isPending}
          aria-label={`Elimina ${photo.originalFilename}`}
          className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/55 text-white opacity-0 backdrop-blur-sm transition-opacity hover:bg-destructive group-hover:opacity-100 focus-visible:opacity-100"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
        </button>

        {/* Stella "Dietro l'obiettivo": sempre visibile se attiva */}
        <button
          type="button"
          onClick={toggleFeatured}
          disabled={isPending}
          aria-label={
            featured
              ? "Rimuovi da Dietro l'obiettivo"
              : "Aggiungi a Dietro l'obiettivo"
          }
          aria-pressed={featured}
          title="Dietro l'obiettivo (homepage)"
          className={cn(
            "absolute left-2 top-2 flex h-8 w-8 items-center justify-center rounded-full backdrop-blur-sm transition-all focus-visible:opacity-100",
            featured
              ? "bg-primary text-primary-foreground opacity-100"
              : "bg-black/55 text-white opacity-0 hover:bg-primary group-hover:opacity-100"
          )}
        >
          <Star className={cn("h-4 w-4", featured && "fill-current")} />
        </button>
      </div>
      <figcaption className="space-y-1.5 p-2.5">
        <div className="flex items-center justify-between gap-1.5">
          <p
            className="truncate text-xs text-muted-foreground"
            title={photo.originalFilename}
          >
            {photo.originalFilename}
          </p>
          {saved && <Check className="h-3.5 w-3.5 shrink-0 text-primary" />}
        </div>
        <TagInput
          value={numbers}
          onChange={setNumbers}
          prefix="#"
          placeholder="numeri di gara"
          ariaLabel="Numeri di gara"
        />
        <TagInput
          value={pilots}
          onChange={setPilots}
          prefix="P"
          placeholder="nomi piloti"
          ariaLabel="Nomi piloti"
        />
      </figcaption>
    </figure>
  );
}
