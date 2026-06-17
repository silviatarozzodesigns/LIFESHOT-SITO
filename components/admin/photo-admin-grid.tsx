"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Check, Loader2, Star, Trash2 } from "lucide-react";
import {
  deletePhoto,
  togglePhotoFeatured,
  updatePhotoMeta,
} from "@/app/actions/photos";
import type { AdminPhotoDTO } from "@/lib/data/admin";
import { TagInput } from "@/components/admin/tag-input";
import { cn } from "@/lib/utils";

/** Confronto ordine-insensitive di due liste di tag. */
function sameTags(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const norm = (list: string[]) =>
    [...list].map((t) => t.toLowerCase()).sort();
  const na = norm(a);
  const nb = norm(b);
  return na.every((t, i) => t === nb[i]);
}

/**
 * Griglia foto della dashboard: numero di gara e nome pilota modificabili
 * inline, cancellazione singola. Le anteprime passano dalla rotta
 * watermark (/api/images), mai dall'URL diretto del bucket.
 */
export function PhotoAdminGrid({ photos }: { photos: AdminPhotoDTO[] }) {
  if (!photos.length) {
    return (
      <p className="mt-4 text-sm text-muted-foreground">
        Nessuna foto caricata per questo evento.
      </p>
    );
  }

  return (
    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {photos.map((photo) => (
        <PhotoAdminCard key={photo.id} photo={photo} />
      ))}
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

  function toggleFeatured() {
    const next = !featured;
    setFeatured(next); // ottimistico
    startTransition(async () => {
      const result = await togglePhotoFeatured(photo.id, next);
      if (!result.ok) setFeatured(!next);
      else router.refresh();
    });
  }

  const dirty =
    !sameTags(numbers, photo.raceNumbers) ||
    !sameTags(pilots, photo.pilotNames);

  function saveMeta() {
    if (!dirty) return;
    startTransition(async () => {
      const result = await updatePhotoMeta(photo.id, {
        raceNumbers: numbers,
        pilotNames: pilots,
      });
      if (result.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 1500);
        router.refresh();
      }
    });
  }

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
          onCommit={saveMeta}
          prefix="#"
          placeholder="numeri di gara"
          ariaLabel="Numeri di gara"
        />
        <TagInput
          value={pilots}
          onChange={setPilots}
          onCommit={saveMeta}
          prefix="P"
          placeholder="nomi piloti"
          ariaLabel="Nomi piloti"
        />
      </figcaption>
    </figure>
  );
}
