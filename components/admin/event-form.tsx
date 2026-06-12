"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import { createEvent, updateEvent, type EventInput } from "@/app/actions/events";
import { uploadFile } from "@/lib/upload-client";
import type { EventDTO } from "@/lib/data/events";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface EventFormProps {
  /** Se presente è una modifica, altrimenti creazione */
  event?: EventDTO;
}

export function EventForm({ event }: EventFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  function handleSubmit(formData: FormData) {
    setError(null);

    const input: EventInput = {
      name: String(formData.get("name") ?? ""),
      date: String(formData.get("date") ?? ""),
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

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="date">Data *</Label>
          <Input
            id="date"
            name="date"
            type="date"
            required
            defaultValue={event?.date.slice(0, 10)}
          />
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
