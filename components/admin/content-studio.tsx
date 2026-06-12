"use client";

import { useState, useTransition } from "react";
import {
  CheckCircle2,
  CloudUpload,
  History,
  Loader2,
  Save,
} from "lucide-react";
import {
  saveDraft,
  publishContent,
  discardDraft,
} from "@/app/actions/content";
import {
  HERO_SPACING,
  SECTION_SPACING,
  SPACING_LABELS,
  type SiteContentData,
  type SpacingLevel,
} from "@/lib/content";
import { ContentPreview } from "@/components/admin/content-preview";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

/**
 * EDITOR del micro-CMS con Live Preview affiancata.
 *
 * Architettura dello stato (single source of truth):
 *
 *   ┌────────────┐  setContent   ┌─────────────────┐
 *   │   Editor   │ ────────────▶ │ content (React) │
 *   └────────────┘               └────────┬────────┘
 *                                         │ prop
 *                                         ▼
 *                                ┌─────────────────┐
 *                                │  ContentPreview  │  ← aggiornata a ogni
 *                                └─────────────────┘     keystroke, zero DB
 *
 *   "Salva bozza"      → action saveDraft(content)   → campo `draft` su Mongo
 *   "Salva e pubblica" → action publishContent(...)  → `draft` + `published`
 *                                                      + revalidate del sito
 *
 * Il sito pubblico legge SOLO `published`: finché non si pubblica,
 * nessuna modifica è visibile ai visitatori.
 */
export function ContentStudio({ initial }: { initial: SiteContentData }) {
  const [content, setContent] = useState<SiteContentData>(initial);
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function patch<K extends keyof SiteContentData>(
    section: K,
    value: Partial<SiteContentData[K]>
  ) {
    setFeedback(null);
    setContent((current) => ({
      ...current,
      [section]: { ...current[section], ...value },
    }));
  }

  function run(
    action: () => Promise<
      { ok: true; content: SiteContentData } | { ok: false; error: string }
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
    <div className="grid items-start gap-6 xl:grid-cols-2">
      {/* ───────────── COLONNA EDITOR ───────────── */}
      <div className="space-y-6">
        {/* Testi Hero */}
        <EditorCard title="Hero — Homepage">
          <Field label="Occhiello" id="hero-eyebrow">
            <Input
              id="hero-eyebrow"
              value={content.hero.eyebrow}
              maxLength={80}
              onChange={(e) => patch("hero", { eyebrow: e.target.value })}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Titolo — riga 1" id="hero-t1">
              <Input
                id="hero-t1"
                value={content.hero.titleLine1}
                maxLength={80}
                onChange={(e) => patch("hero", { titleLine1: e.target.value })}
              />
            </Field>
            <Field label="Titolo — riga 2 (sfumata)" id="hero-t2">
              <Input
                id="hero-t2"
                value={content.hero.titleLine2}
                maxLength={80}
                onChange={(e) => patch("hero", { titleLine2: e.target.value })}
              />
            </Field>
          </div>
          <Field label="Sottotitolo" id="hero-sub">
            <Textarea
              id="hero-sub"
              rows={2}
              value={content.hero.subtitle}
              maxLength={300}
              onChange={(e) => patch("hero", { subtitle: e.target.value })}
            />
          </Field>
          <Field label="Placeholder barra di ricerca" id="hero-ph">
            <Input
              id="hero-ph"
              value={content.hero.searchPlaceholder}
              maxLength={60}
              onChange={(e) =>
                patch("hero", { searchPlaceholder: e.target.value })
              }
            />
          </Field>
        </EditorCard>

        {/* Sezione eventi */}
        <EditorCard title="Sezione “Eventi recenti”">
          <Field label="Titolo" id="ev-title">
            <Input
              id="ev-title"
              value={content.events.title}
              maxLength={80}
              onChange={(e) => patch("events", { title: e.target.value })}
            />
          </Field>
          <Field label="Sottotitolo" id="ev-sub">
            <Input
              id="ev-sub"
              value={content.events.subtitle}
              maxLength={200}
              onChange={(e) => patch("events", { subtitle: e.target.value })}
            />
          </Field>
        </EditorCard>

        {/* SEO */}
        <EditorCard title="SEO & condivisione social">
          <Field
            label={`Meta Title (${content.seo.metaTitle.length}/70)`}
            id="seo-title"
          >
            <Input
              id="seo-title"
              value={content.seo.metaTitle}
              maxLength={70}
              onChange={(e) => patch("seo", { metaTitle: e.target.value })}
            />
          </Field>
          <Field
            label={`Meta Description (${content.seo.metaDescription.length}/200)`}
            id="seo-desc"
          >
            <Textarea
              id="seo-desc"
              rows={3}
              value={content.seo.metaDescription}
              maxLength={200}
              onChange={(e) =>
                patch("seo", { metaDescription: e.target.value })
              }
            />
          </Field>
          <Field label="Open Graph Image (URL assoluto)" id="seo-og">
            <Input
              id="seo-og"
              type="url"
              placeholder="https://…/anteprima-social.jpg (1200×630 consigliato)"
              value={content.seo.ogImage}
              maxLength={500}
              onChange={(e) => patch("seo", { ogImage: e.target.value })}
            />
          </Field>
        </EditorCard>

        {/* Spaziature */}
        <EditorCard title="Spaziature (layout)">
          <SpacingSlider
            id="sp-hero"
            label="Respiro della Hero"
            value={content.spacing.hero}
            tailwindClass={HERO_SPACING[content.spacing.hero]}
            onChange={(hero) =>
              setContent((c) => ({ ...c, spacing: { ...c.spacing, hero } }))
            }
          />
          <SpacingSlider
            id="sp-sections"
            label="Spazio tra le sezioni"
            value={content.spacing.sections}
            tailwindClass={SECTION_SPACING[content.spacing.sections]}
            onChange={(sections) =>
              setContent((c) => ({
                ...c,
                spacing: { ...c.spacing, sections },
              }))
            }
          />
        </EditorCard>

        {/* Barra azioni */}
        <div className="sticky bottom-4 z-10 flex flex-wrap items-center gap-3 rounded-2xl border bg-card/90 p-4 backdrop-blur-xl">
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
              run(
                () => publishContent(content),
                "Pubblicato! Il sito è aggiornato."
              )
            }
          >
            {isPending ? <Loader2 className="animate-spin" /> : <CloudUpload />}
            Salva e pubblica
          </Button>
          <Button
            variant="ghost"
            disabled={isPending}
            onClick={() => {
              if (
                window.confirm(
                  "Scartare la bozza e tornare all'ultima versione pubblicata?"
                )
              ) {
                run(() => discardDraft(), "Bozza riportata al pubblicato.");
              }
            }}
          >
            <History />
            Ripristina
          </Button>
          {feedback && (
            <span className="inline-flex items-center gap-1.5 text-sm text-primary">
              <CheckCircle2 className="h-4 w-4" />
              {feedback}
            </span>
          )}
          {error && <span className="text-sm text-destructive">{error}</span>}
        </div>
      </div>

      {/* ───────────── COLONNA LIVE PREVIEW ───────────── */}
      <div className="xl:sticky xl:top-24">
        <p className="mb-3 text-sm font-medium text-muted-foreground">
          Anteprima in tempo reale{" "}
          <span className="text-muted-foreground/60">
            — quello che vedi è la bozza, non il sito live
          </span>
        </p>
        <ContentPreview content={content} />
      </div>
    </div>
  );
}

/* ───────────────────────── helper UI ───────────────────────── */

function EditorCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4 rounded-2xl border bg-card p-6">
      <h2 className="font-semibold tracking-tight">{title}</h2>
      {children}
    </section>
  );
}

function Field({
  label,
  id,
  children,
}: {
  label: string;
  id: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}

function SpacingSlider({
  id,
  label,
  value,
  tailwindClass,
  onChange,
}: {
  id: string;
  label: string;
  value: SpacingLevel;
  tailwindClass: string;
  onChange: (level: SpacingLevel) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-3">
        <Label htmlFor={id}>{label}</Label>
        <span className="text-xs text-muted-foreground">
          {SPACING_LABELS[value]} ·{" "}
          <code className="rounded bg-secondary px-1.5 py-0.5">
            {tailwindClass}
          </code>
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={1}
        max={5}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value) as SpacingLevel)}
        className="w-full accent-primary"
      />
    </div>
  );
}
