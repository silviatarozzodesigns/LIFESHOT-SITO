"use client";

import { useState, useTransition } from "react";
import {
  CheckCircle2,
  CloudUpload,
  History,
  Loader2,
  Monitor,
  Save,
  Smartphone,
} from "lucide-react";
import { saveDraft, publishContent, discardDraft } from "@/app/actions/content";
import { PAGES, type CmsData } from "@/lib/content";
import {
  SERVICE_IDS,
  SERVICES,
  TOUCH_SERVICE_IDS,
  type ServiceId,
} from "@/lib/services";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

/**
 * CURSOR STUDIO — i testi dei cursori della hero.
 *
 * Un servizio per scheda: pillola com'è nella hero, dove compare (solo
 * computer o anche telefono), titolo e descrizione dell'overlay che si apre
 * cliccandola, e i servizi collegati da "Vedi anche".
 *
 * Stessa regola del resto del CMS: tutto in bozza finché non si pubblica.
 */
export function CursorStudio({ initial }: { initial: CmsData }) {
  const [content, setContent] = useState<CmsData>(initial);
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const texts = content.pages.agenzia.texts;
  const fields = PAGES.agenzia.fields;

  function setText(key: string, value: string) {
    setFeedback(null);
    setContent((c) => ({
      ...c,
      pages: {
        ...c.pages,
        agenzia: {
          ...c.pages.agenzia,
          texts: { ...c.pages.agenzia.texts, [key]: value },
        },
      },
    }));
  }

  function run(
    action: () => Promise<
      { ok: true; content: CmsData } | { ok: false; error: string }
    >,
    successMessage: string
  ) {
    setError(null);
    setFeedback(null);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setContent(result.content);
      setFeedback(successMessage);
    });
  }

  return (
    <div className="space-y-5">
      {/* ─────────── TOOLBAR: azioni bozza/pubblicazione ─────────── */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border bg-card p-3">
        <div className="min-w-0 flex-1">
          {feedback && (
            <span className="inline-flex items-center gap-1.5 text-sm text-primary">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              {feedback}
            </span>
          )}
          {error && <span className="text-sm text-destructive">{error}</span>}
        </div>

        <Button
          variant="ghost"
          size="sm"
          disabled={isPending}
          onClick={() => {
            if (window.confirm("Scartare la bozza e tornare al pubblicato?")) {
              run(() => discardDraft(), "Bozza riportata al pubblicato.");
            }
          }}
        >
          <History />
          Ripristina
        </Button>
        <Button
          variant="outline"
          disabled={isPending}
          onClick={() => run(() => saveDraft(content), "Bozza salvata.")}
        >
          {isPending ? <Loader2 className="animate-spin" /> : <Save />}
          Salva bozza
        </Button>
        <Button
          disabled={isPending}
          onClick={() =>
            run(() => publishContent(content), "Pubblicato! Il sito è aggiornato.")
          }
        >
          {isPending ? <Loader2 className="animate-spin" /> : <CloudUpload />}
          Pubblica modifiche
        </Button>
      </div>

      {/* ─────────── UNA SCHEDA PER SERVIZIO ─────────── */}
      <div className="grid gap-5 lg:grid-cols-2">
        {SERVICE_IDS.map((id: ServiceId) => {
          const def = SERVICES[id];
          const onTouch = TOUCH_SERVICE_IDS.includes(id);
          const titleKey = `svc.${id}.title`;
          const bodyKey = `svc.${id}.body`;
          const titleMax = fields[titleKey]?.max ?? 60;
          const bodyMax = fields[bodyKey]?.max ?? 400;

          return (
            <section key={id} className="space-y-4 rounded-2xl border bg-card p-5">
              {/* Intestazione: la pillola com'è nella hero + dove compare */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="inline-block whitespace-nowrap rounded-full border border-border/70 bg-background/60 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-foreground/90">
                  {def.label}
                </span>
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium",
                    onTouch
                      ? "bg-primary/15 text-primary"
                      : "bg-secondary text-muted-foreground"
                  )}
                  title={
                    onTouch
                      ? "Ha un cursore suo anche su telefono e tablet"
                      : "Su telefono si apre da “Vedi anche” di un altro servizio"
                  }
                >
                  {onTouch ? (
                    <>
                      <Monitor className="h-3 w-3" />
                      <Smartphone className="h-3 w-3" />
                      Computer e telefono
                    </>
                  ) : (
                    <>
                      <Monitor className="h-3 w-3" />
                      Solo computer
                    </>
                  )}
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex items-baseline justify-between gap-2">
                  <Label htmlFor={`t-${id}`}>Titolo</Label>
                  <span className="text-[11px] tabular-nums text-muted-foreground">
                    {(texts[titleKey] ?? "").length}/{titleMax}
                  </span>
                </div>
                <Input
                  id={`t-${id}`}
                  value={texts[titleKey] ?? ""}
                  maxLength={titleMax}
                  onChange={(e) => setText(titleKey, e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-baseline justify-between gap-2">
                  <Label htmlFor={`b-${id}`}>Descrizione</Label>
                  <span className="text-[11px] tabular-nums text-muted-foreground">
                    {(texts[bodyKey] ?? "").length}/{bodyMax}
                  </span>
                </div>
                <Textarea
                  id={`b-${id}`}
                  rows={5}
                  value={texts[bodyKey] ?? ""}
                  maxLength={bodyMax}
                  onChange={(e) => setText(bodyKey, e.target.value)}
                />
              </div>

              <p className="text-[11px] text-muted-foreground">
                Vedi anche:{" "}
                {def.related.map((r) => texts[`svc.${r}.title`] ?? SERVICES[r].label).join(" · ")}
              </p>
            </section>
          );
        })}
      </div>
    </div>
  );
}
