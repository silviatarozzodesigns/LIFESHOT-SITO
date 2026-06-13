"use client";

import { useState } from "react";
import { CalendarDays, CheckCircle2, Loader2, MapPin, Send, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Status = "idle" | "sending" | "success";

interface EventScoutProps {
  title: string;
  subtitle: string;
  buttonLabel: string;
}

/**
 * "Invita Lifeshot al tuo evento" — form lead-gen / scouting eventi.
 * I rider segnalano dove correranno; il lead arriva via /api/event-scout.
 */
export function EventScout({ title, subtitle, buttonLabel }: EventScoutProps) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setStatus("sending");
    const form = e.currentTarget;
    const data = new FormData(form);
    try {
      const res = await fetch("/api/event-scout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: data.get("name"),
          email: data.get("email"),
          eventName: data.get("eventName"),
          location: data.get("location"),
          date: data.get("date"),
          note: data.get("note"),
          website: data.get("website"),
        }),
      });
      const payload = await res.json().catch(() => null);
      if (!payload?.ok) throw new Error(payload?.error ?? `Errore ${res.status}`);
      setStatus("success");
      form.reset();
    } catch (err) {
      setStatus("idle");
      setError(err instanceof Error ? err.message : "Invio non riuscito.");
    }
  }

  return (
    <div className="relative overflow-hidden rounded-3xl border bg-card p-6 sm:p-10">
      <div
        aria-hidden
        className="glow-primary pointer-events-none absolute right-[-10%] top-[-40%] h-[24rem] w-[36rem]"
      />
      <div className="relative grid gap-8 lg:grid-cols-[1fr_1.1fr] lg:items-center">
        {/* Copy */}
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            <Trophy className="h-3.5 w-3.5" />
            Scouting eventi
          </span>
          <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            {title}
          </h2>
          <p className="mt-3 max-w-md text-balance text-muted-foreground">
            {subtitle}
          </p>
        </div>

        {/* Form */}
        {status === "success" ? (
          <div className="flex min-h-64 flex-col items-center justify-center gap-3 rounded-2xl border bg-background/60 p-8 text-center">
            <CheckCircle2 className="h-10 w-10 text-primary" />
            <p className="text-lg font-semibold tracking-tight">Segnalazione inviata!</p>
            <p className="text-sm text-muted-foreground">
              Grazie — valutiamo l&apos;evento e ti rispondiamo presto.
            </p>
            <Button variant="ghost" size="sm" onClick={() => setStatus("idle")}>
              Segnala un altro evento
            </Button>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="space-y-4 rounded-2xl border bg-background/60 p-5 sm:p-6"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="scout-name">Il tuo nome *</Label>
                <Input id="scout-name" name="name" required minLength={2} maxLength={100} placeholder="Nome e cognome" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="scout-email">Email *</Label>
                <Input id="scout-email" name="email" type="email" required maxLength={200} placeholder="nome@esempio.it" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="scout-event">Nome dell&apos;evento / gara *</Label>
              <Input id="scout-event" name="eventName" required minLength={2} maxLength={150} placeholder="es. Internazionali d'Italia MX" />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="scout-loc" className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" /> Dove
                </Label>
                <Input id="scout-loc" name="location" maxLength={150} placeholder="Circuito, città" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="scout-date" className="flex items-center gap-1.5">
                  <CalendarDays className="h-3.5 w-3.5" /> Quando
                </Label>
                <Input id="scout-date" name="date" maxLength={40} placeholder="es. 16 set 2026" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="scout-note">Note (facoltativo)</Label>
              <Textarea id="scout-note" name="note" rows={2} maxLength={1000} placeholder="Categoria, numero di gara, dettagli utili…" />
            </div>

            {/* Honeypot */}
            <input
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden
              className="absolute left-[-9999px] h-0 w-0 opacity-0"
            />

            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}

            <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={status === "sending"}>
              {status === "sending" ? <Loader2 className="animate-spin" /> : <Send />}
              {buttonLabel}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
