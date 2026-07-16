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
  Tablet,
} from "lucide-react";
import {
  saveDraft,
  publishContent,
  discardDraft,
} from "@/app/actions/content";
import {
  ImageField,
  RangeRow,
} from "@/components/admin/studio/visual-studio";
import {
  DEFAULT_IMAGE_SETTINGS,
  PAGES,
  posToCss,
  type CmsData,
  type ImageSettings,
  type PageSlug,
} from "@/lib/content";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Le 3 macrocartelle HERO → pagina CMS corrispondente */
const FOLDERS = [
  { label: "Motorsport", slug: "home" },
  { label: "Ristorazione", slug: "ristorazione" },
  { label: "Business", slug: "business" },
] as const satisfies ReadonlyArray<{ label: string; slug: PageSlug }>;

/** I 4 dispositivi → chiavi immagine + dimensioni dell'anteprima */
const DEVICES = [
  {
    id: "desktop",
    label: "Computer",
    icon: Monitor,
    bgKey: "hero.background",
    fgKey: "hero.foreground",
    width: "100%",
    height: "70vh",
  },
  {
    id: "tablet",
    label: "Tablet verticale",
    icon: Tablet,
    bgKey: "hero.backgroundTablet",
    fgKey: "hero.foregroundTablet",
    width: "768px",
    height: "80vh",
  },
  {
    id: "tabletLandscape",
    label: "Tablet orizzontale",
    icon: Tablet,
    bgKey: "hero.backgroundTabletLandscape",
    fgKey: "hero.foregroundTabletLandscape",
    width: "1080px",
    height: "70vh",
  },
  {
    id: "mobile",
    label: "Mobile",
    icon: Smartphone,
    bgKey: "hero.backgroundMobile",
    fgKey: "hero.foregroundMobile",
    width: "390px",
    height: "78vh",
  },
] as const;

type DeviceId = (typeof DEVICES)[number]["id"];

/**
 * HERO STUDIO — gestione degli sfondi e degli overlay 3D delle hero.
 *
 * 3 macrocartelle (Motorsport / Ristorazione / Business) × 4 dispositivi:
 * per ognuno sfondo + PNG in overlay con posizione orizzontale/verticale
 * e zoom, e anteprima live della pagina alla larghezza del dispositivo.
 * Come nel Visual Studio: tutto in bozza finché non si pubblica.
 */
export function HeroStudio({ initial }: { initial: CmsData }) {
  const [content, setContent] = useState<CmsData>(initial);
  const [folder, setFolder] = useState<PageSlug>("home");
  const [device, setDevice] = useState<DeviceId>("desktop");
  const [nonce, setNonce] = useState(0);
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const page = content.pages[folder];
  const pageDef = PAGES[folder];
  const dev = DEVICES.find((d) => d.id === device)!;

  function setImage(key: string, value: string) {
    setFeedback(null);
    setContent((c) => ({
      ...c,
      pages: {
        ...c.pages,
        [folder]: {
          ...c.pages[folder],
          images: { ...c.pages[folder].images, [key]: value },
        },
      },
    }));
  }

  function setSettings(key: string, patch: Partial<ImageSettings>) {
    setFeedback(null);
    setContent((c) => {
      const current =
        c.pages[folder].imageSettings[key] ?? DEFAULT_IMAGE_SETTINGS;
      const merged = { ...current, ...patch };
      merged.position = posToCss(merged.posX, merged.posY);
      return {
        ...c,
        pages: {
          ...c.pages,
          [folder]: {
            ...c.pages[folder],
            imageSettings: { ...c.pages[folder].imageSettings, [key]: merged },
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
      setNonce((n) => n + 1);
    });
  }

  const previewSrc =
    folder === "home"
      ? `/anteprima/motorsport?n=${nonce}`
      : `${pageDef.path}?preview=1&n=${nonce}`;

  return (
    <div className="space-y-5">
      {/* ─────────── TOOLBAR: macrocartella · device · azioni ─────────── */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border bg-card p-3">
        {/* Macrocartelle */}
        <div className="flex items-center gap-1 rounded-full border bg-background p-1">
          {FOLDERS.map((f) => (
            <button
              key={f.slug}
              type="button"
              onClick={() => setFolder(f.slug)}
              className={cn(
                "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                folder === f.slug
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Dispositivi */}
        <div className="flex items-center gap-1 rounded-full border bg-background p-1">
          {DEVICES.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => setDevice(d.id)}
              aria-label={d.label}
              title={d.label}
              className={cn(
                "flex h-8 items-center justify-center gap-1.5 rounded-full px-3 text-xs font-medium transition-colors",
                device === d.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <d.icon
                className={cn(
                  "h-4 w-4",
                  d.id === "tabletLandscape" && "rotate-90"
                )}
              />
              <span className="hidden lg:inline">{d.label}</span>
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

      <div className="grid items-start gap-5 xl:grid-cols-[1fr_340px]">
        {/* ─────────── ANTEPRIMA alla larghezza del dispositivo ─────────── */}
        <div className="overflow-x-auto rounded-2xl border border-dashed bg-background/40 p-4 sm:p-6">
          <div
            style={{ width: dev.width, maxWidth: "100%" }}
            className="mx-auto overflow-hidden rounded-2xl border shadow-[0_16px_50px_-20px_rgba(0,0,0,0.7)] transition-all duration-500 ease-out"
          >
            <iframe
              key={`hero-${folder}-${nonce}`}
              src={previewSrc}
              title="Anteprima hero (bozza)"
              style={{ height: dev.height }}
              className="block w-full border-0 bg-background"
            />
          </div>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            Anteprima con la bozza · salva la bozza per aggiornarla ·{" "}
            {dev.label}
          </p>
        </div>

        {/* ─────────── CONTROLLI del dispositivo attivo ─────────── */}
        <aside className="space-y-5 xl:sticky xl:top-24">
          <section className="space-y-4 rounded-2xl border bg-card p-5">
            <h2 className="text-sm font-semibold tracking-tight">
              {FOLDERS.find((f) => f.slug === folder)?.label} — {dev.label}
            </h2>
            {device !== "desktop" && (
              <p className="text-xs text-muted-foreground">
                Se lo sfondo resta vuoto, il dispositivo usa quello del
                computer; l&apos;overlay compare SOLO se carichi il PNG
                dedicato.
              </p>
            )}
            {[dev.bgKey, dev.fgKey].map((key) => {
              const def = pageDef.images[key];
              if (!def) return null;
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
                        onChange={(v) => setSettings(key, { posX: v })}
                      />
                      <RangeRow
                        label="Verticale"
                        value={s.posY}
                        min={0}
                        max={100}
                        suffix="%"
                        onChange={(v) => setSettings(key, { posY: v })}
                      />
                      <RangeRow
                        label="Zoom"
                        value={s.scale}
                        min={100}
                        max={280}
                        step={5}
                        suffix="%"
                        onChange={(v) => setSettings(key, { scale: v })}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </section>

          <section className="space-y-2 rounded-2xl border bg-card p-5 text-xs text-muted-foreground">
            <p>
              <strong className="text-foreground">Come funziona:</strong> ogni
              macrocartella gestisce la hero della sua pagina. Carica lo sfondo
              e (facoltativo) il PNG scontornato in overlay per l&apos;effetto
              3D, poi regola inquadratura e zoom per ciascun dispositivo.
            </p>
            <p>
              Le modifiche restano in <strong className="text-foreground">bozza</strong>{" "}
              finché non premi{" "}
              <strong className="text-foreground">Pubblica modifiche</strong>.
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}
