"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Check, Loader2, Trash2 } from "lucide-react";
import { deletePhoto, updatePhotoRaceNumber } from "@/app/actions/photos";
import type { AdminPhotoDTO } from "@/lib/data/admin";
import { cn } from "@/lib/utils";

/**
 * Griglia foto della dashboard: numero di gara modificabile inline
 * (per i file senza tag automatico) e cancellazione singola.
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
  const [number, setNumber] = useState(photo.raceNumber ?? "");
  const [saved, setSaved] = useState(false);

  const dirty = number.trim() !== (photo.raceNumber ?? "");

  function saveNumber() {
    if (!dirty) return;
    startTransition(async () => {
      const result = await updatePhotoRaceNumber(photo.id, number);
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
          src={photo.url}
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
      </div>
      <figcaption className="space-y-1.5 p-2.5">
        <p
          className="truncate text-xs text-muted-foreground"
          title={photo.originalFilename}
        >
          {photo.originalFilename}
        </p>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">#</span>
          <input
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            onBlur={saveNumber}
            onKeyDown={(e) => e.key === "Enter" && saveNumber()}
            placeholder="n. gara"
            aria-label="Numero di gara"
            className="h-7 w-full min-w-0 rounded-md border bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
          />
          {saved && <Check className="h-3.5 w-3.5 shrink-0 text-foreground" />}
        </div>
      </figcaption>
    </figure>
  );
}
