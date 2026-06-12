"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Hash, Loader2, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EventOption {
  slug: string;
  name: string;
}

interface GalleryFiltersProps {
  events: EventOption[];
  selectedEvent: string;
  raceNumber: string;
}

/**
 * Barra filtri della galleria: combobox "Evento" + input "Numero di Gara".
 * I filtri vivono nell'URL (?evento=...&numero=...) così le ricerche sono
 * condivisibili e renderizzate lato server.
 */
export function GalleryFilters({
  events,
  selectedEvent,
  raceNumber,
}: GalleryFiltersProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [event, setEvent] = useState(selectedEvent);
  const [number, setNumber] = useState(raceNumber);

  const hasActiveFilters = Boolean(selectedEvent || raceNumber);

  function apply(nextEvent: string, nextNumber: string) {
    const params = new URLSearchParams();
    if (nextEvent) params.set("evento", nextEvent);
    if (nextNumber.trim()) params.set("numero", nextNumber.trim());
    startTransition(() => {
      router.push(`/galleria${params.size ? `?${params}` : ""}`);
    });
  }

  return (
    <form
      className="flex flex-col gap-3 sm:flex-row sm:items-center"
      onSubmit={(e) => {
        e.preventDefault();
        apply(event, number);
      }}
    >
      {/* Combobox Evento */}
      <div className="relative flex-1">
        <select
          value={event}
          onChange={(e) => {
            setEvent(e.target.value);
            apply(e.target.value, number);
          }}
          aria-label="Filtra per evento"
          className={cn(
            "h-12 w-full appearance-none rounded-full border bg-card pl-5 pr-11 text-sm",
            "transition-colors hover:border-foreground/30",
            "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background",
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
          inputMode="numeric"
          placeholder="Numero di gara"
          aria-label="Filtra per numero di gara"
          className={cn(
            "h-12 w-full rounded-full border bg-card pl-11 pr-5 text-sm placeholder:text-muted-foreground",
            "transition-colors hover:border-foreground/30",
            "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
          )}
        />
      </div>

      <div className="flex items-center gap-2">
        <Button type="submit" size="lg" className="h-12 flex-1 sm:flex-none">
          {isPending ? (
            <Loader2 className="animate-spin" />
          ) : (
            <Search />
          )}
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
              apply("", "");
            }}
          >
            <X />
          </Button>
        )}
      </div>
    </form>
  );
}
