"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import { createEvent, updateEvent, type EventInput } from "@/app/actions/events";
import { uploadFile, uploadAssetFile } from "@/lib/upload-client";
import type { EventCategory, EventDTO } from "@/lib/data/events";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const CATEGORY_LABELS: Record<EventCategory, string> = {
  motorsport: "Motorsport",
  ristorazione: "Ristorazione",
  business: "Business",
};

interface EventFormProps {
  /** Se presente è una modifica, altrimenti creazione */
  event?: EventDTO;
  /** Categoria preselezionata in creazione (dalla macrocartella admin) */
  defaultCategory?: EventCategory;
}

export function EventForm({ event, defaultCategory }: EventFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const menuCoverInputRef = useRef<HTMLInputElement>(null);
  const menuBackInputRef = useRef<HTMLInputElement>(null);
  const [category, setCategory] = useState<EventCategory>(
    event?.category ?? defaultCategory ?? "motorsport"
  );
  const [isMenu, setIsMenu] = useState(event?.isMenu ?? false);
  const [menuSoftFlip, setMenuSoftFlip] = useState(event?.menuSoftFlip ?? true);
  const [menuLeatherColor, setMenuLeatherColor] = useState(
    event?.menuLeatherColor ?? "#8a5a2b"
  );
  // Il menù sfogliabile ha senso solo per i progetti vetrina
  const showMenuOption = category === "ristorazione" || category === "business";

  function handleSubmit(formData: FormData) {
    setError(null);

    const input: EventInput = {
      name: String(formData.get("name") ?? ""),
      date: String(formData.get("date") ?? ""),
      category: String(formData.get("category") ?? "motorsport") as EventCategory,
      location: String(formData.get("location") ?? ""),
      description: String(formData.get("description") ?? ""),
      published: formData.get("published") === "on",
      isMenu: showMenuOption && isMenu,
      menuSoftFlip,
      menuLeatherColor,
    };

    startTransition(async () => {
      // Copertina (fronte) e fondo (retro) della fodera: caricati come asset
      // (non serve l'id evento) e passati nell'input prima del salvataggio.
      const menuCoverFile = menuCoverInputRef.current?.files?.[0];
      const menuBackFile = menuBackInputRef.current?.files?.[0];
      if (input.isMenu) {
        try {
          if (menuCoverFile)
            input.menuCoverImage = await uploadAssetFile(menuCoverFile);
          if (menuBackFile)
            input.menuBackImage = await uploadAssetFile(menuBackFile);
        } catch (uploadError) {
          setError(
            uploadError instanceof Error
              ? `Immagine del menù non caricata: ${uploadError.message}`
              : "Caricamento di un'immagine del menù fallito."
          );
          return;
        }
      }

      const result = event
        ? await updateEvent(event.id, input)
        : await createEvent(input);

      if (!result.ok) {
        setError(result.error);
        return;
      }

      // Copertina caricata a parte (l'evento deve esistere per avere id/slug)
      const coverFile = coverInputRef.current?.files?.[0];
      if (coverFile) {
        try {
          await uploadFile(result.id, coverFile, "cover");
        } catch (uploadError) {
          setError(
            uploadError instanceof Error
              ? `Evento salvato, ma copertina non caricata: ${uploadError.message}`
              : "Evento salvato, ma il caricamento della copertina è fallito."
          );
          return;
        }
      }

      router.push(`/admin/eventi/${result.id}`);
      router.refresh();
    });
  }

  return (
    <form action={handleSubmit} className="max-w-2xl space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Nome evento *</Label>
        <Input
          id="name"
          name="name"
          required
          maxLength={200}
          defaultValue={event?.name}
          placeholder="es. Granfondo Modena 2026"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">Categoria *</Label>
        <select
          id="category"
          name="category"
          required
          value={category}
          onChange={(e) => setCategory(e.target.value as EventCategory)}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          {(Object.keys(CATEGORY_LABELS) as EventCategory[]).map((c) => (
            <option key={c} value={c}>
              {CATEGORY_LABELS[c]}
            </option>
          ))}
        </select>
        <p className="text-xs text-muted-foreground">
          Motorsport finisce tra gli eventi con ricerca per numero di gara;
          Ristorazione e Business tra i Progetti recenti della loro pagina.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="date">Data</Label>
          <Input
            id="date"
            name="date"
            type="date"
            defaultValue={event?.date ? event.date.slice(0, 10) : ""}
          />
          <p className="text-xs text-muted-foreground">
            Facoltativa: senza data non viene mostrata da nessuna parte.
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="location">Luogo</Label>
          <Input
            id="location"
            name="location"
            maxLength={200}
            defaultValue={event?.location}
            placeholder="es. Modena"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descrizione</Label>
        <Textarea
          id="description"
          name="description"
          maxLength={2000}
          defaultValue={event?.description}
          placeholder="Breve descrizione dell'evento (facoltativa)"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="cover">Immagine di copertina</Label>
        {event?.coverImage && (
          <div className="relative mb-2 aspect-[16/10] w-56 overflow-hidden rounded-xl bg-muted">
            <Image
              src={event.coverImage}
              alt="Copertina attuale"
              fill
              sizes="224px"
              className="object-cover"
            />
          </div>
        )}
        <Input
          id="cover"
          name="cover"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          ref={coverInputRef}
        />
        <p className="text-xs text-muted-foreground">
          {event?.coverImage
            ? "Seleziona un nuovo file per sostituire la copertina attuale."
            : "Facoltativa: mostrata nella griglia eventi in homepage."}
        </p>
      </div>

      {showMenuOption && (
        <div className="space-y-4 rounded-xl border border-dashed p-4">
          <label className="flex w-fit cursor-pointer items-center gap-3 text-sm font-medium">
            <input
              type="checkbox"
              name="isMenu"
              checked={isMenu}
              onChange={(e) => setIsMenu(e.target.checked)}
              className="h-4 w-4 accent-foreground"
            />
            Progetto menù sfogliabile
          </label>
          <p className="text-xs text-muted-foreground">
            Attivo: la pagina del progetto mostra un menù realistico con fodera
            in pelle. Le pagine del menù sono le foto che carichi qui sotto
            (sezione «Carica foto»), nell&apos;ordine di caricamento.
          </p>

          {isMenu && (
            <div className="space-y-2">
              <Label htmlFor="menuCover">Copertina (fronte)</Label>
              {event?.menuCoverImage && (
                <div className="relative mb-2 aspect-[3/4] w-40 overflow-hidden rounded-lg bg-muted">
                  <Image
                    src={event.menuCoverImage}
                    alt="Copertina menù attuale"
                    fill
                    sizes="160px"
                    className="object-cover"
                  />
                </div>
              )}
              <Input
                id="menuCover"
                name="menuCover"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                ref={menuCoverInputRef}
              />
              <p className="text-xs text-muted-foreground">
                Riveste TUTTO il fronte del menù chiuso (a tutta pagina).
                {event?.menuCoverImage
                  ? " Seleziona un nuovo file per sostituirla."
                  : " Senza immagine, il fronte è in pelle del colore scelto sotto."}
              </p>
            </div>
          )}

          {isMenu && (
            <div className="space-y-2">
              <Label htmlFor="menuBack">Fondo (retro)</Label>
              {event?.menuBackImage && (
                <div className="relative mb-2 aspect-[3/4] w-40 overflow-hidden rounded-lg bg-muted">
                  <Image
                    src={event.menuBackImage}
                    alt="Retro menù attuale"
                    fill
                    sizes="160px"
                    className="object-cover"
                  />
                </div>
              )}
              <Input
                id="menuBack"
                name="menuBack"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                ref={menuBackInputRef}
              />
              <p className="text-xs text-muted-foreground">
                Riveste TUTTO il retro del menù (a tutta pagina).
                {event?.menuBackImage
                  ? " Seleziona un nuovo file per sostituirlo."
                  : " Senza immagine, il retro è in pelle del colore scelto sotto."}
              </p>
            </div>
          )}

          {isMenu && (
            <div className="space-y-2">
              <Label htmlFor="menuLeatherColor">Colore della pelle</Label>
              <div className="flex items-center gap-3">
                <input
                  id="menuLeatherColor"
                  type="color"
                  value={menuLeatherColor}
                  onChange={(e) => setMenuLeatherColor(e.target.value)}
                  className="h-10 w-16 cursor-pointer rounded-md border bg-background p-1"
                />
                <span className="font-mono text-xs text-muted-foreground">
                  {menuLeatherColor}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Usato dove non c&apos;è un&apos;immagine (fronte/retro). La pelle
                è disegnata con questo colore, resa realistica.
              </p>
            </div>
          )}

          {isMenu && (
            <label className="flex w-fit cursor-pointer items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={menuSoftFlip}
                onChange={(e) => setMenuSoftFlip(e.target.checked)}
                className="h-4 w-4 accent-foreground"
              />
              Sfoglio morbido (pagina che si curva); disattiva per pagine rigide
            </label>
          )}
        </div>
      )}

      <label className="flex w-fit cursor-pointer items-center gap-3 text-sm">
        <input
          type="checkbox"
          name="published"
          defaultChecked={event?.published ?? true}
          className="h-4 w-4 accent-foreground"
        />
        Pubblicato (visibile sul sito)
      </label>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <Button type="submit" size="lg" disabled={isPending}>
          {isPending ? <Loader2 className="animate-spin" /> : <Save />}
          {event ? "Salva modifiche" : "Crea evento"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="lg"
          disabled={isPending}
          onClick={() => router.push("/admin")}
        >
          Annulla
        </Button>
      </div>
    </form>
  );
}
