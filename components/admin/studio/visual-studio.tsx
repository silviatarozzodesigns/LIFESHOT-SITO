"use client";

import { useState, useTransition } from "react";
import {
  CheckCircle2,
  ChevronDown,
  CloudUpload,
  History,
  Loader2,
  Monitor,
  Save,
  Smartphone,
  Tablet,
} from "lucide-react";
import {
  saveDraft,
  publishContent,
  discardDraft,
} from "@/app/actions/content";
import {
  PAGES,
  PAGE_SLUGS,
  SPACING_LABELS,
  type CmsData,
  type PageSlug,
  type SpacingLevel,
} from "@/lib/content";
import { PagePreview } from "@/components/admin/studio/page-previews";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type Device = "desktop" | "tablet" | "mobile";

const DEVICE_WIDTH: Record<Device, string> = {
  desktop: "100%",
  tablet: "768px",
  mobile: "390px",
};

/**
 * VISUAL STUDIO — editor WYSIWYG con anteprima live.
 *
 * Stato (single source of truth): `content` (CmsData, la BOZZA) vive qui
 * e scorre in due direzioni:
 *
 *   anteprima (click-to-edit) ──onText──▶ content ◀──onChange── sidebar
 *                 ▲                          │
 *                 └────────── prop ──────────┘
 *
 * Il sito pubblico legge solo `published`: niente è visibile finché non
 * si preme "Pubblica modifiche".
 */
export function VisualStudio({ initial }: { initial: CmsData }) {
  const [content, setContent] = useState<CmsData>(initial);
  const [activePage, setActivePage] = useState<PageSlug>("home");
  const [device, setDevice] = useState<Device>("desktop");
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const page = content.pages[activePage];
  const pageDef = PAGES[activePage];

  function patchPage(patch: Partial<typeof page>) {
    setFeedback(null);
    setContent((c) => ({
      ...c,
      pages: { ...c.pages, [activePage]: { ...c.pages[activePage], ...patch } },
    }));
  }

  function setText(slug: PageSlug, key: string, value: string) {
    setFeedback(null);
    setContent((c) => ({
      ...c,
      pages: {
        ...c.pages,
        [slug]: {
          ...c.pages[slug],
          texts: { ...c.pages[slug].texts, [key]: value },
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
      {/* ─────────── TOOLBAR: pagina · device · azioni ─────────── */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border bg-card p-3">
        {/* Selettore pagina */}
        <div className="relative">
          <select
            value={activePage}
            onChange={(e) => setActivePage(e.target.value as PageSlug)}
            aria-label="Pagina in modifica"
            className="h-10 appearance-none rounded-full border bg-background pl-4 pr-10 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {PAGE_SLUGS.map((slug) => (
              <option key={slug} value={slug}>
                {PAGES[slug].label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        </div>

        {/* Switcher multi-device */}
        <div className="flex items-center gap-1 rounded-full border bg-background p-1">
          {(
            [
              ["desktop", Monitor, "Desktop"],
              ["tablet", Tablet, "Tablet — 768px"],
              ["mobile", Smartphone, "Mobile — 390px"],
            ] as const
          ).map(([key, Icon, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setDevice(key)}
              aria-label={label}
              title={label}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full transition-colors",
                device === key
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
            </button>
          ))}
        </div>

        <div className="min-w-0 flex-1">
          {feedback && (
            <span className="inline-flex items-center gap-1.5 text-sm text-primary">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              {feedback}
            </span>
          )}
          {error && <span className="text-sm text-destructive">{error}</span>}
        </div>

        {/* Azioni Draft / Publish */}
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

      <div className="grid items-start gap-5 xl:grid-cols-[1fr_320px]">
        {/* ─────────── SANDBOX ANTEPRIMA (responsive) ─────────── */}
        <div className="overflow-x-auto rounded-2xl border border-dashed bg-background/40 p-4 sm:p-6">
          <div
            style={{ width: DEVICE_WIDTH[device], maxWidth: "100%" }}
            className="mx-auto transition-all duration-500 ease-out"
          >
            <PagePreview
              content={content}
              activePage={activePage}
              onText={setText}
              onNavigate={setActivePage}
            />
          </div>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            Clicca un testo nell&apos;anteprima per modificarlo · navigazione
            interna attiva · {device === "desktop" ? "larghezza piena" : DEVICE_WIDTH[device]}
          </p>
        </div>

        {/* ─────────── SIDEBAR: design system + SEO ─────────── */}
        <aside className="space-y-5 xl:sticky xl:top-24">
          {/* SEO contestuale della pagina attiva */}
          <SidebarCard title={`SEO — ${pageDef.label}`}>
            <SeoField
              id="seo-title"
              label="Meta Title"
              value={page.seo.metaTitle}
              min={30}
              max={60}
              hardMax={70}
              onChange={(metaTitle) =>
                patchPage({ seo: { ...page.seo, metaTitle } })
              }
            />
            <SeoField
              id="seo-desc"
              label="Meta Description"
              value={page.seo.metaDescription}
              min={70}
              max={160}
              hardMax={200}
              multiline
              onChange={(metaDescription) =>
                patchPage({ seo: { ...page.seo, metaDescription } })
              }
            />
            <div className="space-y-2">
              <Label htmlFor="seo-og">OG Image URL</Label>
              <Input
                id="seo-og"
                type="url"
                value={page.seo.ogImage}
                maxLength={500}
                placeholder="https://…/social.jpg (1200×630)"
                onChange={(e) =>
                  patchPage({ seo: { ...page.seo, ogImage: e.target.value } })
                }
              />
            </div>
          </SidebarCard>

          {/* Spaziature vincolate alla scala Tailwind */}
          <SidebarCard title="Spaziature">
            {Object.entries(pageDef.spacing).map(([knob, def]) => {
              const level = page.spacing[knob] ?? def.default;
              return (
                <div key={knob} className="space-y-1.5">
                  <div className="flex items-baseline justify-between gap-2">
                    <Label htmlFor={`sp-${knob}`}>{def.label}</Label>
                    <span className="text-[11px] text-muted-foreground">
                      {SPACING_LABELS[level]} ·{" "}
                      <code className="rounded bg-secondary px-1 py-0.5">
                        {def.classes[level]}
                      </code>
                    </span>
                  </div>
                  <input
                    id={`sp-${knob}`}
                    type="range"
                    min={1}
                    max={5}
                    step={1}
                    value={level}
                    onChange={(e) =>
                      patchPage({
                        spacing: {
                          ...page.spacing,
                          [knob]: Number(e.target.value) as SpacingLevel,
                        },
                      })
                    }
                    className="w-full accent-primary"
                  />
                </div>
              );
            })}
          </SidebarCard>

          {/* Testi — sincronizzati in tempo reale con l'anteprima */}
          <SidebarCard title={`Testi — ${pageDef.label}`}>
            {Object.entries(pageDef.fields).map(([key, def]) => (
              <div key={key} className="space-y-1.5">
                <Label htmlFor={`f-${key}`} className="text-xs">
                  {def.label}
                </Label>
                {def.multiline ? (
                  <Textarea
                    id={`f-${key}`}
                    rows={2}
                    value={page.texts[key] ?? ""}
                    maxLength={def.max}
                    onChange={(e) => setText(activePage, key, e.target.value)}
                  />
                ) : (
                  <Input
                    id={`f-${key}`}
                    value={page.texts[key] ?? ""}
                    maxLength={def.max}
                    onChange={(e) => setText(activePage, key, e.target.value)}
                  />
                )}
              </div>
            ))}
          </SidebarCard>
        </aside>
      </div>
    </div>
  );
}

/* ───────────────────────────── helper UI ───────────────────────────── */

function SidebarCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4 rounded-2xl border bg-card p-5">
      <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
      {children}
    </section>
  );
}

/**
 * Campo SEO con contatore visivo in tempo reale:
 * ambra sotto il minimo, verde nell'intervallo ottimale per Google,
 * rosso oltre il limite consigliato.
 */
function SeoField({
  id,
  label,
  value,
  min,
  max,
  hardMax,
  multiline,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  min: number;
  max: number;
  hardMax: number;
  multiline?: boolean;
  onChange: (value: string) => void;
}) {
  const len = value.length;
  const tone =
    len === 0
      ? "text-muted-foreground"
      : len < min
        ? "text-amber-400"
        : len <= max
          ? "text-emerald-400"
          : "text-destructive";

  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <Label htmlFor={id}>{label}</Label>
        <span className={cn("text-[11px] font-medium tabular-nums", tone)}>
          {len}/{max}
        </span>
      </div>
      {multiline ? (
        <Textarea
          id={id}
          rows={3}
          value={value}
          maxLength={hardMax}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <Input
          id={id}
          value={value}
          maxLength={hardMax}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
      <div className="h-1 overflow-hidden rounded-full bg-secondary">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-300",
            len === 0
              ? "bg-muted-foreground/30"
              : len < min
                ? "bg-amber-400"
                : len <= max
                  ? "bg-emerald-400"
                  : "bg-destructive"
          )}
          style={{ width: `${Math.min(100, (len / max) * 100)}%` }}
        />
      </div>
    </div>
  );
}
