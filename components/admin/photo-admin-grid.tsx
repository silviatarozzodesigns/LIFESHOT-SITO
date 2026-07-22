"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Check,
  GripVertical,
  Home,
  Loader2,
  Search,
  Star,
  Trash2,
  X,
} from "lucide-react";
import {
  deletePhoto,
  reorderEventPhotos,
  reorderFeaturedPhotos,
  reorderHomeFeaturedPhotos,
  togglePhotoFeatured,
  togglePhotoHomeFeatured,
  updatePhotoMeta,
} from "@/app/actions/photos";
import type { AdminPhotoDTO } from "@/lib/data/admin";
import type { EventCategory } from "@/models/Event";
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
 *
 * Con `sortable` (sezione Gallery) le foto si trascinano per decidere in
 * che ordine appaiono sul sito. Il trascinamento è disattivato mentre il
 * filtro è attivo: si vedrebbe solo un pezzo della lista e si sposterebbe
 * una foto in un punto che non corrisponde a quello vero.
 */
export function PhotoAdminGrid({
  photos,
  sortable = false,
  category = "motorsport",
  orderScope = "featured",
}: {
  photos: AdminPhotoDTO[];
  sortable?: boolean;
  /** Categoria dell'evento: decide i campi taggabili sotto ogni foto */
  category?: EventCategory;
  /** Quale ordine salva il drag: in evidenza, in homepage, o la galleria evento */
  orderScope?: "featured" | "home" | "event";
}) {
  const router = useRouter();
  // Numeri di gara + nomi piloti solo nel motorsport; ristorazione/business
  // hanno un unico campo "nome cliente".
  const isMotorsport = category === "motorsport";
  const [query, setQuery] = useState("");
  const [ordine, setOrdine] = useState(photos);
  const [isSaving, startSaving] = useTransition();
  const trascinata = useRef<number | null>(null);
  const [sopra, setSopra] = useState<number | null>(null);

  // La lista arriva dal server: se cambia (stella tolta, foto eliminata,
  // ordine salvato) l'ordine locale la segue.
  useEffect(() => setOrdine(photos), [photos]);

  const lista = sortable ? ordine : photos;
  const filtered = useMemo(
    () => lista.filter((p) => photoMatchesQuery(p, query)),
    [lista, query]
  );
  const puoTrascinare = sortable && !query;

  function sposta(da: number, a: number) {
    if (da === a) return;
    const next = [...ordine];
    const [presa] = next.splice(da, 1);
    next.splice(a, 0, presa);
    setOrdine(next); // ottimistico: la griglia si riordina subito
    startSaving(async () => {
      const reorder =
        orderScope === "home"
          ? reorderHomeFeaturedPhotos
          : orderScope === "event"
            ? reorderEventPhotos
            : reorderFeaturedPhotos;
      const result = await reorder(next.map((p) => p.id));
      if (!result.ok) setOrdine(photos); // rimetti com'era
      router.refresh();
    });
  }

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
            placeholder={
              isMotorsport
                ? "Filtra: numero di gara, senza numero, pilota o nome file…"
                : "Filtra: nome cliente o nome file…"
            }
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

      {sortable && (
        <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
          <GripVertical className="h-3.5 w-3.5 shrink-0" />
          {query
            ? "Azzera il filtro per poter riordinare le foto."
            : "Trascina le foto per decidere l'ordine con cui appaiono sul sito."}
          {isSaving && <span className="text-primary">· salvo…</span>}
        </p>
      )}

      {filtered.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">
          Nessuna foto corrisponde a “{query}”.
        </p>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {filtered.map((photo, i) => (
            <div
              key={photo.id}
              draggable={puoTrascinare}
              onDragStart={() => {
                trascinata.current = i;
              }}
              onDragOver={(e) => {
                if (!puoTrascinare) return;
                e.preventDefault(); // senza, il drop non avviene
                setSopra(i);
              }}
              onDragLeave={() => setSopra((s) => (s === i ? null : s))}
              onDrop={(e) => {
                if (!puoTrascinare) return;
                e.preventDefault();
                setSopra(null);
                if (trascinata.current != null) sposta(trascinata.current, i);
                trascinata.current = null;
              }}
              onDragEnd={() => {
                setSopra(null);
                trascinata.current = null;
              }}
              className={cn(
                "group/card relative rounded-xl transition-all",
                puoTrascinare && "cursor-grab active:cursor-grabbing",
                sopra === i && "ring-2 ring-primary ring-offset-2 ring-offset-background"
              )}
            >
              {puoTrascinare && (
                <span
                  aria-hidden
                  className="absolute left-1/2 top-1.5 z-10 flex h-6 w-6 -translate-x-1/2 items-center justify-center rounded-md bg-black/55 text-white opacity-0 backdrop-blur-sm transition-opacity group-hover/card:opacity-100"
                >
                  <GripVertical className="h-3.5 w-3.5" />
                </span>
              )}
              <PhotoAdminCard photo={photo} isMotorsport={isMotorsport} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PhotoAdminCard({
  photo,
  isMotorsport,
}: {
  photo: AdminPhotoDTO;
  isMotorsport: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [numbers, setNumbers] = useState<string[]>(photo.raceNumbers);
  const [pilots, setPilots] = useState<string[]>(photo.pilotNames);
  const [saved, setSaved] = useState(false);
  const [featured, setFeatured] = useState(photo.featured);
  const [homeFeatured, setHomeFeatured] = useState(photo.homeFeatured);

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

  function toggleHomeFeatured() {
    const next = !homeFeatured;
    setHomeFeatured(next); // ottimistico
    startTransition(async () => {
      const result = await togglePhotoHomeFeatured(photo.id, next);
      if (!result.ok) setHomeFeatured(!next);
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

        {/* Casa: mette la foto nella "Galleria in homepage" della categoria */}
        <button
          type="button"
          onClick={toggleHomeFeatured}
          disabled={isPending}
          aria-label={
            homeFeatured
              ? "Togli dalla galleria in homepage"
              : "Metti nella galleria in homepage"
          }
          aria-pressed={homeFeatured}
          title="Galleria in homepage"
          className={cn(
            "absolute left-2 top-12 flex h-8 w-8 items-center justify-center rounded-full backdrop-blur-sm transition-all focus-visible:opacity-100",
            homeFeatured
              ? "bg-primary text-primary-foreground opacity-100"
              : "bg-black/55 text-white opacity-0 hover:bg-primary group-hover:opacity-100"
          )}
        >
          <Home className="h-4 w-4" />
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
        {isMotorsport ? (
          <>
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
          </>
        ) : (
          // Ristorazione/business: un solo campo "nome cliente" (salvato nel
          // campo pilotNames, riusato come tag ricercabile del progetto).
          <TagInput
            value={pilots}
            onChange={setPilots}
            placeholder="nome cliente"
            ariaLabel="Nome cliente"
          />
        )}
      </figcaption>
    </figure>
  );
}
