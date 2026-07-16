"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import { createEvent, updateEvent, type EventInput } from "@/app/actions/events";
import { uploadFile } from "@/lib/upload-client";
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

  function handleSubmit(formData: FormData) {
    setError(null);

    const input: EventInput = {
      name: String(formData.get("name") ?? ""),
      date: String(formData.get("date") ?? ""),
      category: String(formData.get("category") ?? "motorsport") as EventCategory,
      location: String(formData.get("location") ?? ""),
      description: String(formData.get("description") ?? ""),
      published: formData.get("published") === "on",
    };

    startTransition(async () => {
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
          defaultValue={event?.category ?? defaultCategory ?? "motorsport"}
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
