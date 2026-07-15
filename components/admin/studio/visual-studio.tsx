"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import {
  CheckCircle2,
  ChevronDown,
  CloudUpload,
  History,
  ImageIcon,
  Loader2,
  Monitor,
  Move,
  Save,
  Smartphone,
  Tablet,
  Trash2,
  Type,
  UploadCloud,
  X,
} from "lucide-react";
import {
  saveDraft,
  publishContent,
  discardDraft,
  deleteAsset,
  loadContent,
} from "@/app/actions/content";
import {
  DEFAULT_IMAGE_SETTINGS,
  posToCss,
  PAGES,
  PAGE_SLUGS,
  SPACING_LABELS,
  TYPOGRAPHY_LABELS,
  type CmsData,
  type ImageDef,
  type ImageSettings,
  type Level,
  type PageContent,
  type PageDef,
  type PageSlug,
} from "@/lib/content";
import type { PreviewSelection } from "@/components/admin/studio/page-previews";
import { uploadAssetFile } from "@/lib/upload-client";
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
  const [activePage, setActivePage] = useState<PageSlug>("agenzia");
  const [selected, setSelected] = useState<PreviewSelection | null>(null);
  const [device, setDevice] = useState<Device>("desktop");
  const [realNonce, setRealNonce] = useState(0);

  // Cambio pagina → azzera la selezione contestuale
  function gotoPage(slug: PageSlug) {
    setActivePage(slug);
    setSelected(null);
  }
  const [isPending, startTransition] = useTransition();

  // Modifiche in-place fatte dentro l'iframe "Sito reale" → risincronizza lo
  // stato dell'editor col contenuto salvato live (così "Pubblica" non
  // sovrascrive con dati vecchi e la sidebar resta coerente).
  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (e.origin !== window.location.origin) return;
      if ((e.data as { type?: string })?.type !== "ls-content-edited") return;
      loadContent().then(setContent);
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);
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

  /** Patch delle impostazioni globali (es. filigrana foto) */
  function patchSettings(patch: Partial<CmsData["settings"]>) {
    setFeedback(null);
    setContent((c) => ({ ...c, settings: { ...c.settings, ...patch } }));
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

  function setImage(key: string, value: string) {
    setFeedback(null);
    setContent((c) => ({
      ...c,
      pages: {
        ...c.pages,
        [activePage]: {
          ...c.pages[activePage],
          images: { ...c.pages[activePage].images, [key]: value },
        },
      },
    }));
  }

  function setTypography(key: string, value: Level) {
    setFeedback(null);
    setContent((c) => ({
      ...c,
      pages: {
        ...c.pages,
        [activePage]: {
          ...c.pages[activePage],
          typography: { ...c.pages[activePage].typography, [key]: value },
        },
      },
    }));
  }

  function setImageSettings(key: string, patch: Partial<ImageSettings>) {
    setFeedback(null);
    setContent((c) => {
      const current =
        c.pages[activePage].imageSettings[key] ?? DEFAULT_IMAGE_SETTINGS;
      const merged = { ...current, ...patch };
      // `position` è derivato: lo ricalcoliamo da X/Y dopo ogni modifica
      merged.position = posToCss(merged.posX, merged.posY);
      return {
        ...c,
        pages: {
          ...c.pages,
          [activePage]: {
            ...c.pages[activePage],
            imageSettings: {
              ...c.pages[activePage].imageSettings,
              [key]: merged,
            },
          },
        },
      };
    });
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
      // Ricarica l'anteprima "sito reale" così riflette la bozza appena salvata
      setRealNonce((n) => n + 1);
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
            onChange={(e) => gotoPage(e.target.value as PageSlug)}
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
        {/* ─────────── SANDBOX ANTEPRIMA (iframe, breakpoint reali) ─────────── */}
        <div className="overflow-x-auto rounded-2xl border border-dashed bg-background/40 p-4 sm:p-6">
          <div
            style={{ width: DEVICE_WIDTH[device], maxWidth: "100%" }}
            className="mx-auto overflow-hidden rounded-2xl border shadow-[0_16px_50px_-20px_rgba(0,0,0,0.7)] transition-all duration-500 ease-out"
          >
            {/* VISTA UNICA: il sito REALE in iframe. Homepage agenzia e
                pagina motorsport hanno le loro anteprime bozza dedicate
                (route ISR: niente ?preview); le altre pagine usano
                l'anteprima reale con ?preview=1. Dentro l'iframe
                l'edit-mode è automatico per l'admin. */}
            <iframe
              key={`site-${activePage}-${realNonce}`}
              src={
                activePage === "agenzia"
                  ? `/anteprima?n=${realNonce}`
                  : activePage === "home"
                    ? `/anteprima/motorsport?n=${realNonce}`
                    : `${pageDef.path}?preview=1&n=${realNonce}`
              }
              title="Sito reale (modificabile)"
              className="block h-[80vh] w-full border-0 bg-background"
            />
          </div>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            Sito reale 1:1 · passa sui testi e clicca per modificarli, si salva
            in bozza · {device === "desktop" ? "larghezza piena" : DEVICE_WIDTH[device]}
          </p>
        </div>

        {/* ─────────── SIDEBAR contestuale (click-to-edit) ─────────── */}
        <aside className="space-y-5 xl:sticky xl:top-24">
          {/* Pannello contestuale: cambia in base all'elemento selezionato */}
          {selected ? (
            <ContextPanel
              selected={selected}
              page={page}
              pageDef={pageDef}
              onText={(key, v) => setText(activePage, key, v)}
              onImage={setImage}
              onTypography={setTypography}
              onImageSettings={setImageSettings}
              onClose={() => setSelected(null)}
              onError={setError}
            />
          ) : (
            <SidebarCard title="Come si modifica">
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">Testi:</strong> passa il
                mouse e clicca direttamente sul testo nell&apos;anteprima per
                modificarlo (con allineamento e dimensione).{" "}
                <strong className="text-foreground">Immagini, SEO e
                spaziature:</strong> usa i pannelli qui sotto. Tutto resta in{" "}
                <strong className="text-foreground">bozza</strong> finché non
                premi <strong className="text-foreground">Pubblica</strong>.
              </p>
            </SidebarCard>
          )}

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

          {/* Hero — sfondi + rider per dispositivo (sempre visibile, non serve
              cliccare l'anteprima). Tablet/Mobile vuoti = usa lo sfondo desktop
              senza rider. */}
          {activePage === "home" && (
            <SidebarCard title="Hero — Sfondi & Rider per dispositivo">
              <div className="space-y-5">
                {(
                  [
                    {
                      label: "Desktop",
                      keys: ["hero.background", "hero.foreground"],
                    },
                    {
                      label: "Tablet verticale",
                      keys: [
                        "hero.backgroundTablet",
                        "hero.foregroundTablet",
                      ],
                    },
                    {
                      label: "Tablet orizzontale",
                      keys: [
                        "hero.backgroundTabletLandscape",
                        "hero.foregroundTabletLandscape",
                      ],
                    },
                    {
                      label: "Mobile",
                      keys: [
                        "hero.backgroundMobile",
                        "hero.foregroundMobile",
                      ],
                    },
                  ] as const
                ).map((group) => (
                  <div key={group.label} className="space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                      {group.label}
                    </p>
                    {group.keys.map((key) => {
                      const def = pageDef.images[key];
                      if (!def) return null;
                      const s = page.imageSettings[key] ?? DEFAULT_IMAGE_SETTINGS;
                      return (
                        <div key={key} className="space-y-2 rounded-xl border bg-background/40 p-2.5">
                          <ImageField
                            def={def}
                            value={page.images[key] ?? ""}
                            onChange={(url) => setImage(key, url)}
                            onError={setError}
                          />
                          {page.images[key] && (
                            <div className="space-y-1.5 pt-1">
                              <RangeRow
                                label="Orizzontale"
                                value={s.posX}
                                min={0}
                                max={100}
                                suffix="%"
                                onChange={(v) => setImageSettings(key, { posX: v })}
                              />
                              <RangeRow
                                label="Verticale"
                                value={s.posY}
                                min={0}
                                max={100}
                                suffix="%"
                                onChange={(v) => setImageSettings(key, { posY: v })}
                              />
                              <RangeRow
                                label="Zoom"
                                value={s.scale}
                                min={100}
                                max={280}
                                step={5}
                                suffix="%"
                                onChange={(v) => setImageSettings(key, { scale: v })}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </SidebarCard>
          )}

          {/* Immagini della pagina (hero slide, gallerie categorie…):
              pannello generico per ogni pagina che ha slot immagine
              (la home motorsport ha già il suo pannello dedicato sopra). */}
          {activePage !== "home" && Object.keys(pageDef.images).length > 0 && (
            <SidebarCard title={`Immagini — ${pageDef.label}`}>
              <div className="space-y-3">
                {Object.entries(pageDef.images).map(([key, def]) => {
                  const s = page.imageSettings[key] ?? DEFAULT_IMAGE_SETTINGS;
                  return (
                    <div
                      key={key}
                      className="space-y-2 rounded-xl border bg-background/40 p-2.5"
                    >
                      <ImageField
                        def={def}
                        value={page.images[key] ?? ""}
                        onChange={(url) => setImage(key, url)}
                        onError={setError}
                      />
                      {page.images[key] && (
                        <div className="space-y-1.5 pt-1">
                          <RangeRow
                            label="Orizzontale"
                            value={s.posX}
                            min={0}
                            max={100}
                            suffix="%"
                            onChange={(v) => setImageSettings(key, { posX: v })}
                          />
                          <RangeRow
                            label="Verticale"
                            value={s.posY}
                            min={0}
                            max={100}
                            suffix="%"
                            onChange={(v) => setImageSettings(key, { posY: v })}
                          />
                          <RangeRow
                            label="Zoom"
                            value={s.scale}
                            min={100}
                            max={280}
                            step={5}
                            suffix="%"
                            onChange={(v) => setImageSettings(key, { scale: v })}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </SidebarCard>
          )}

          {/* Impostazioni globali foto — filigrana */}
          <SidebarCard title="Foto & Filigrana">
            <label
              htmlFor="wm-toggle"
              className="flex cursor-pointer items-start justify-between gap-3"
            >
              <span>
                <span className="block text-sm font-medium text-foreground">
                  Applica filigrana alle foto caricate
                </span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  Vale per i nuovi upload. Le foto già caricate non cambiano.
                </span>
              </span>
              <button
                id="wm-toggle"
                type="button"
                role="switch"
                aria-checked={content.settings.watermarkEnabled}
                onClick={() =>
                  patchSettings({
                    watermarkEnabled: !content.settings.watermarkEnabled,
                  })
                }
                className={cn(
                  "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition-colors",
                  content.settings.watermarkEnabled
                    ? "bg-primary"
                    : "bg-muted-foreground/30"
                )}
              >
                <span
                  className={cn(
                    "h-5 w-5 rounded-full bg-white shadow-sm transition-transform",
                    content.settings.watermarkEnabled
                      ? "translate-x-5"
                      : "translate-x-0"
                  )}
                />
              </button>
            </label>
          </SidebarCard>

          {/* Spaziature di pagina (layout) */}
          <SidebarCard title="Spaziature">
            {Object.entries(pageDef.spacing).map(([knob, def]) => {
              const level = page.spacing[knob] ?? def.default;
              return (
                <div key={knob} className="space-y-1.5">
                  <div className="flex items-baseline justify-between gap-2">
                    <Label htmlFor={`sp-${knob}`}>{def.label}</Label>
                    <span className="text-[11px] text-muted-foreground">
                      {SPACING_LABELS[level]}
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
                          [knob]: Number(e.target.value) as Level,
                        },
                      })
                    }
                    className="w-full accent-primary"
                  />
                </div>
              );
            })}
          </SidebarCard>
        </aside>
      </div>
    </div>
  );
}

/* ───────────────────────────── helper UI ───────────────────────────── */

/**
 * PANNELLO CONTESTUALE (click-to-edit).
 * Mostra SOLO i controlli dell'elemento selezionato nell'anteprima:
 *  • testo  → campo testo + (se collegato) slider tipografia
 *  • immagine → upload + controlli manuali di resize/posizione
 */
function ContextPanel({
  selected,
  page,
  pageDef,
  onText,
  onImage,
  onTypography,
  onImageSettings,
  onClose,
  onError,
}: {
  selected: PreviewSelection;
  page: PageContent;
  pageDef: PageDef;
  onText: (key: string, value: string) => void;
  onImage: (key: string, url: string) => void;
  onTypography: (knob: string, level: Level) => void;
  onImageSettings: (key: string, patch: Partial<ImageSettings>) => void;
  onClose: () => void;
  onError: (msg: string | null) => void;
}) {
  const header = (title: string) => (
    <div className="flex items-center justify-between">
      <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
      <button
        type="button"
        onClick={onClose}
        aria-label="Chiudi"
        className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );

  if (selected.kind === "text") {
    const def = pageDef.fields[selected.key];
    if (!def) return null;
    const tyKnob = def.typographyKnob;
    const tyDef = tyKnob ? pageDef.typography[tyKnob] : undefined;
    const tyLevel = tyKnob ? page.typography[tyKnob] ?? tyDef?.default ?? 3 : 3;
    return (
      <section className="space-y-4 rounded-2xl border-2 border-primary/40 bg-card p-5">
        {header(def.label)}
        <div className="space-y-2">
          <Label htmlFor="ctx-text" className="text-xs">
            Contenuto
          </Label>
          {def.multiline ? (
            <Textarea
              id="ctx-text"
              rows={4}
              autoFocus
              value={page.texts[selected.key] ?? ""}
              maxLength={def.max}
              onChange={(e) => onText(selected.key, e.target.value)}
            />
          ) : (
            <Input
              id="ctx-text"
              autoFocus
              value={page.texts[selected.key] ?? ""}
              maxLength={def.max}
              onChange={(e) => onText(selected.key, e.target.value)}
            />
          )}
        </div>

        {tyKnob && tyDef && (
          <div className="space-y-1.5 border-t pt-4">
            <div className="flex items-baseline justify-between gap-2">
              <Label htmlFor="ctx-ty" className="flex items-center gap-1.5">
                <Type className="h-3.5 w-3.5" />
                Dimensione testo
              </Label>
              <span className="text-[11px] text-muted-foreground">
                {TYPOGRAPHY_LABELS[tyLevel]}
              </span>
            </div>
            <input
              id="ctx-ty"
              type="range"
              min={1}
              max={5}
              step={1}
              value={tyLevel}
              onChange={(e) => onTypography(tyKnob, Number(e.target.value) as Level)}
              className="w-full accent-primary"
            />
          </div>
        )}
      </section>
    );
  }

  // selected.kind === "image"
  const imgDef = pageDef.images[selected.key];
  if (!imgDef) return null;
  const settings = page.imageSettings[selected.key] ?? DEFAULT_IMAGE_SETTINGS;
  return (
    <section className="space-y-4 rounded-2xl border-2 border-primary/40 bg-card p-5">
      {header(imgDef.label)}
      <ImageField
        def={imgDef}
        value={page.images[selected.key] ?? ""}
        onChange={(url) => onImage(selected.key, url)}
        onError={onError}
      />

      {/* Resize manuale (override di layout) */}
      <div className="space-y-3 border-t pt-4">
        <Label className="flex items-center gap-1.5">
          <Move className="h-3.5 w-3.5" />
          Inquadratura
        </Label>

        {/* Posizione orizzontale libera */}
        <div className="space-y-1.5">
          <div className="flex items-baseline justify-between gap-2">
            <Label htmlFor="ctx-posx">Orizzontale</Label>
            <span className="text-[11px] text-muted-foreground">
              {settings.posX}%
            </span>
          </div>
          <input
            id="ctx-posx"
            type="range"
            min={0}
            max={100}
            step={1}
            value={settings.posX}
            onChange={(e) =>
              onImageSettings(selected.key, { posX: Number(e.target.value) })
            }
            className="w-full accent-primary"
          />
        </div>

        {/* Posizione verticale libera */}
        <div className="space-y-1.5">
          <div className="flex items-baseline justify-between gap-2">
            <Label htmlFor="ctx-posy">Verticale</Label>
            <span className="text-[11px] text-muted-foreground">
              {settings.posY}%
            </span>
          </div>
          <input
            id="ctx-posy"
            type="range"
            min={0}
            max={100}
            step={1}
            value={settings.posY}
            onChange={(e) =>
              onImageSettings(selected.key, { posY: Number(e.target.value) })
            }
            className="w-full accent-primary"
          />
        </div>

        {/* Scala / zoom */}
        <div className="space-y-1.5">
          <div className="flex items-baseline justify-between gap-2">
            <Label htmlFor="ctx-scale">Zoom</Label>
            <span className="text-[11px] text-muted-foreground">
              {settings.scale}%
            </span>
          </div>
          <input
            id="ctx-scale"
            type="range"
            min={100}
            max={280}
            step={5}
            value={settings.scale}
            onChange={(e) =>
              onImageSettings(selected.key, { scale: Number(e.target.value) })
            }
            className="w-full accent-primary"
          />
        </div>
      </div>
    </section>
  );
}

/**
 * Campo immagine: alla selezione del file mostra SUBITO l'anteprima locale
 * (object URL) e aggiorna lo stato → la preview reagisce all'istante; in
 * parallelo carica su R2/storage e poi sostituisce con l'URL definitivo.
 */
function ImageField({
  def,
  value,
  onChange,
  onError,
}: {
  def: ImageDef;
  value: string;
  onChange: (url: string) => void;
  onError: (msg: string | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(file: File) {
    onError(null);
    const previous = value; // per la pulizia del vecchio asset su R2
    // Anteprima immediata (prima ancora che l'upload finisca)
    const localUrl = URL.createObjectURL(file);
    onChange(localUrl);
    setUploading(true);
    try {
      const finalUrl = await uploadAssetFile(file);
      onChange(finalUrl); // sostituisce l'object URL con quello persistente
      // Cloudflare sync: elimina il file precedente per non lasciare orfani
      if (previous) void deleteAsset(previous);
    } catch (e) {
      onChange(previous); // rollback all'immagine precedente
      onError(e instanceof Error ? e.message : "Upload immagine fallito.");
    } finally {
      setUploading(false);
      URL.revokeObjectURL(localUrl);
    }
  }

  function handleRemove() {
    const previous = value;
    onChange("");
    if (previous) void deleteAsset(previous); // purge da Cloudflare
  }

  return (
    <div className="space-y-2">
      <Label className="text-xs">{def.label}</Label>
      <div className="flex items-center gap-3">
        <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-lg border bg-muted">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full items-center justify-center text-muted-foreground/40">
              <ImageIcon className="h-5 w-5" />
            </span>
          )}
          {uploading && (
            <span className="absolute inset-0 flex items-center justify-center bg-black/50">
              <Loader2 className="h-4 w-4 animate-spin text-white" />
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-1.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
          >
            <UploadCloud />
            {value ? "Sostituisci" : "Carica"}
          </Button>
          {value && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={uploading}
              className="text-muted-foreground hover:text-destructive"
              onClick={handleRemove}
            >
              <Trash2 />
              Rimuovi
            </Button>
          )}
        </div>
      </div>
      {def.hint && <p className="text-[11px] text-muted-foreground">{def.hint}</p>}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}

/** Slider etichettato compatto per inquadratura/zoom immagini */
function RangeRow({
  label,
  value,
  min,
  max,
  step = 1,
  suffix = "",
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[11px] text-muted-foreground">{label}</span>
        <span className="text-[11px] tabular-nums text-muted-foreground">
          {value}
          {suffix}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-primary"
      />
    </div>
  );
}

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
