"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Hash, Loader2, Search, User, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { galleryHref } from "@/lib/gallery-url";
import { cn } from "@/lib/utils";

interface EventOption {
  slug: string;
  name: string;
}

interface GalleryFiltersProps {
  events: EventOption[];
  selectedEvent: string;
  raceNumber: string;
  pilotName: string;
}

const inputClasses = cn(
  // text-base su mobile per evitare l'auto-zoom iOS
  "h-12 w-full rounded-full border bg-card text-base placeholder:text-muted-foreground sm:text-sm",
  "transition-colors hover:border-foreground/30",
  "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
);

/**
 * Barra filtri della galleria: combobox "Evento" + numero di gara +
 * nome pilota, combinabili tra loro. I filtri vivono nell'indirizzo, così
 * le ricerche sono condivisibili e renderizzate lato server: l'evento come
 * percorso (`/galleria/<evento>`, pagina indicizzabile), numero e pilota
 * come parametri.
 */
export function GalleryFilters({
  events,
  selectedEvent,
  raceNumber,
  pilotName,
}: GalleryFiltersProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [event, setEvent] = useState(selectedEvent);
  const [number, setNumber] = useState(raceNumber);
  const [pilot, setPilot] = useState(pilotName);

  const hasActiveFilters = Boolean(selectedEvent || raceNumber || pilotName);

  function apply(nextEvent: string, nextNumber: string, nextPilot: string) {
    startTransition(() => {
      router.push(
        galleryHref({ evento: nextEvent, numero: nextNumber, pilota: nextPilot })
      );
    });
  }

  return (
    <form
      className="flex flex-col gap-3 lg:flex-row lg:items-center"
      onSubmit={(e) => {
        e.preventDefault();
        apply(event, number, pilot);
      }}
    >
      {/* Combobox Evento */}
      <div className="relative flex-1">
        <select
          value={event}
          onChange={(e) => {
            setEvent(e.target.value);
            apply(e.target.value, number, pilot);
          }}
          aria-label="Filtra per evento"
          className={cn(
            inputClasses,
            "appearance-none pl-5 pr-11",
            !event && "text-muted-foreground"
          )}
        >
          <option value="">Tutti gli eventi</option>
          {events.map((option) => (
            <option key={option.slug} value={option.slug}>
              {option.name}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      </div>

      {/* Numero di gara */}
      <div className="relative flex-1">
        <Hash className="pointer-events-none absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={number}
          onChange={(e) => setNumber(e.target.value)}
          inputMode="text"
          placeholder="Numero di gara o senza numero"
          aria-label="Filtra per numero di gara o senza numero"
          className={cn(inputClasses, "pl-11 pr-5")}
        />
      </div>

      {/* Nome pilota */}
      <div className="relative flex-1">
        <User className="pointer-events-none absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={pilot}
          onChange={(e) => setPilot(e.target.value)}
          placeholder="Nome pilota"
          aria-label="Filtra per nome pilota"
          className={cn(inputClasses, "pl-11 pr-5")}
        />
      </div>

      <div className="flex items-center gap-2">
        <Button type="submit" size="lg" className="h-12 flex-1 lg:flex-none">
          {isPending ? <Loader2 className="animate-spin" /> : <Search />}
          Cerca
        </Button>
        {hasActiveFilters && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-12 w-12"
            aria-label="Rimuovi filtri"
            onClick={() => {
              setEvent("");
              setNumber("");
              setPilot("");
              apply("", "", "");
            }}
          >
            <X />
          </Button>
        )}
      </div>
    </form>
  );
}
