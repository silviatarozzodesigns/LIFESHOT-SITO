"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Status = "idle" | "sending" | "success";

export function ContactForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setStatus("sending");

    const form = e.currentTarget;
    const data = new FormData(form);
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: data.get("name"),
          email: data.get("email"),
          message: data.get("message"),
          website: data.get("website"), // honeypot
        }),
      });
      const payload = await response.json().catch(() => null);
      if (!payload?.ok) {
        throw new Error(payload?.error ?? `Errore ${response.status}`);
      }
      setStatus("success");
      form.reset();
    } catch (submitError) {
      setStatus("idle");
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Invio non riuscito, riprova."
      );
    }
  }

  if (status === "success") {
    return (
      <div className="flex h-full min-h-72 flex-col items-center justify-center gap-4 rounded-3xl border bg-card p-8 text-center">
        <CheckCircle2 className="h-10 w-10 text-primary" />
        <div>
          <p className="text-lg font-semibold tracking-tight">
            Messaggio inviato!
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Ti risponderemo il prima possibile.
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setStatus("idle")}>
          Invia un altro messaggio
        </Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-3xl border bg-card p-6 sm:p-8"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="contact-name">Nome *</Label>
          <Input
            id="contact-name"
            name="name"
            required
            minLength={2}
            maxLength={100}
            autoComplete="name"
            placeholder="Il tuo nome"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contact-email">Email *</Label>
          <Input
            id="contact-email"
            name="email"
            type="email"
            required
            maxLength={200}
            autoComplete="email"
            placeholder="nome@esempio.it"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="contact-message">Messaggio *</Label>
        <Textarea
          id="contact-message"
          name="message"
          required
          minLength={10}
          maxLength={3000}
          rows={6}
          placeholder="Raccontaci del tuo evento, della tua gara o del tuo progetto…"
        />
      </div>

      {/* Honeypot anti-bot: invisibile agli utenti reali */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden
        className="absolute left-[-9999px] h-0 w-0 opacity-0"
      />

      {/* Consenso privacy obbligatorio (il form non parte senza spunta) */}
      <div className="flex items-start gap-2.5">
        <input
          id="contact-privacy"
          name="privacy"
          type="checkbox"
          required
          className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-primary"
        />
        <Label
          htmlFor="contact-privacy"
          className="cursor-pointer text-sm font-normal leading-snug text-muted-foreground"
        >
          Accetto il trattamento dei dati personali secondo la{" "}
          <a
            href="/privacy-policy"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-primary underline-offset-2 hover:underline"
          >
            Privacy Policy
          </a>
          .
        </Label>
      </div>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <Button
        type="submit"
        size="lg"
        className="w-full sm:w-auto"
        disabled={status === "sending"}
      >
        {status === "sending" ? <Loader2 className="animate-spin" /> : <Send />}
        Invia messaggio
      </Button>
    </form>
  );
}
