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
import { cn } from "@/lib/utils";

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
  const [number, setNumber] = useState(photo.raceNumber ?? "");
  const [pilot, setPilot] = useState(photo.pilotName ?? "");
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
    number.trim() !== (photo.raceNumber ?? "") ||
    pilot.trim() !== (photo.pilotName ?? "");

  function saveMeta() {
    if (!dirty) return;
    startTransition(async () => {
      const result = await updatePhotoMeta(photo.id, {
        raceNumber: number,
        pilotName: pilot,
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

  const fieldClasses =
    "h-7 w-full min-w-0 rounded-md border bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring";

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
        <p
          className="truncate text-xs text-muted-foreground"
          title={photo.originalFilename}
        >
          {photo.originalFilename}
        </p>
        <div className="flex items-center gap-1.5">
          <span className="w-3 shrink-0 text-xs text-muted-foreground">#</span>
          <input
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            onBlur={saveMeta}
            onKeyDown={(e) => e.key === "Enter" && saveMeta()}
            placeholder="n. gara"
            aria-label="Numero di gara"
            className={fieldClasses}
          />
          {saved && <Check className="h-3.5 w-3.5 shrink-0 text-primary" />}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 shrink-0 text-center text-[10px] text-muted-foreground">
            P
          </span>
          <input
            value={pilot}
            onChange={(e) => setPilot(e.target.value)}
            onBlur={saveMeta}
            onKeyDown={(e) => e.key === "Enter" && saveMeta()}
            placeholder="pilota"
            aria-label="Nome pilota"
            className={fieldClasses}
          />
        </div>
      </figcaption>
    </figure>
  );
}
