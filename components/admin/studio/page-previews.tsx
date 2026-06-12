"use client";

import {
  ArrowRight,
  Camera,
  Clapperboard,
  Mail,
  PenTool,
  Play,
  Search,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { EditableText } from "@/components/admin/studio/editable-text";
import {
  PAGES,
  PAGE_SLUGS,
  getSpacingClass,
  type CmsData,
  type PageSlug,
} from "@/lib/content";
import { cn } from "@/lib/utils";

interface PreviewProps {
  content: CmsData;
  activePage: PageSlug;
  onText: (slug: PageSlug, key: string, value: string) => void;
  onNavigate: (slug: PageSlug) => void;
}

/**
 * Anteprima WYSIWYG della pagina attiva: stesso design system del sito
 * (token, classi di spaziatura REALI dal registry), con ogni testo
 * modificabile inline. La navbar interna è cliccabile: cambia pagina
 * restando in modalità editing.
 */
export function PagePreview({
  content,
  activePage,
  onText,
  onNavigate,
}: PreviewProps) {
  const t = (key: string) => content.pages[activePage].texts[key] ?? "";
  const set = (key: string) => (value: string) =>
    onText(activePage, key, value);
  const sp = (knob: string) => getSpacingClass(content, activePage, knob);

  return (
    <div className="overflow-hidden rounded-2xl border bg-background shadow-[0_16px_50px_-20px_rgba(0,0,0,0.7)]">
      {/* Navbar dell'anteprima: i link cambiano pagina nell'editor */}
      <div className="flex items-center justify-between border-b border-border/60 bg-background/70 px-5 py-3 backdrop-blur-xl">
        <Logo className="scale-90 origin-left" />
        <nav className="flex items-center gap-3 text-xs text-muted-foreground">
          {PAGE_SLUGS.map((slug) => (
            <button
              key={slug}
              type="button"
              onClick={() => onNavigate(slug)}
              className={cn(
                "rounded-full px-2.5 py-1 transition-colors hover:text-primary",
                slug === activePage && "bg-primary/15 text-primary"
              )}
            >
              {PAGES[slug].label}
            </button>
          ))}
        </nav>
      </div>

      <div className="max-h-[70vh] overflow-y-auto">
        {activePage === "home" && (
          <>
            <section className={cn("px-6 text-center", sp("hero"))}>
              <EditableText
                as="p"
                value={t("hero.eyebrow")}
                onChange={set("hero.eyebrow")}
                className="mx-auto mb-3 inline-block text-xs font-semibold uppercase tracking-[0.3em] text-primary"
              />
              <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
                <EditableText
                  value={t("hero.titleLine1")}
                  onChange={set("hero.titleLine1")}
                  className="inline-block"
                />
                <br />
                <EditableText
                  value={t("hero.titleLine2")}
                  onChange={set("hero.titleLine2")}
                  className="inline-block text-muted-foreground"
                />
              </h2>
              <EditableText
                as="p"
                value={t("hero.subtitle")}
                onChange={set("hero.subtitle")}
                className="mx-auto mt-4 block max-w-md text-balance text-sm text-muted-foreground"
              />
              <div className="mx-auto mt-6 flex max-w-xs items-center gap-2.5 rounded-full border bg-card px-4 py-2.5 text-left">
                <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <EditableText
                  value={t("hero.searchPlaceholder")}
                  onChange={set("hero.searchPlaceholder")}
                  className="min-w-0 flex-1 truncate text-xs text-muted-foreground"
                />
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <ArrowRight className="h-3 w-3" />
                </span>
              </div>
            </section>

            <section className={cn("px-6", sp("sections"))}>
              <EditableText
                as="h3"
                value={t("events.title")}
                onChange={set("events.title")}
                className="block text-xl font-semibold tracking-tight"
              />
              <EditableText
                as="p"
                value={t("events.subtitle")}
                onChange={set("events.subtitle")}
                className="mt-1.5 block text-sm text-muted-foreground"
              />
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="overflow-hidden rounded-xl border bg-card">
                    <div className="flex aspect-[16/10] items-center justify-center bg-muted">
                      <Camera className="h-5 w-5 text-muted-foreground/40" />
                    </div>
                    <div className="space-y-1.5 p-3">
                      <div className="h-2 w-3/4 rounded bg-muted" />
                      <div className="h-2 w-1/2 rounded bg-muted/70" />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        {activePage === "video" && (
          <section className={cn("px-6", sp("header"))}>
            <EditableText
              as="p"
              value={t("header.eyebrow")}
              onChange={set("header.eyebrow")}
              className="inline-block text-xs font-semibold uppercase tracking-[0.3em] text-primary"
            />
            <EditableText
              as="h2"
              value={t("header.title")}
              onChange={set("header.title")}
              className="mt-2 block text-3xl font-semibold tracking-tight"
            />
            <EditableText
              as="p"
              value={t("header.subtitle")}
              onChange={set("header.subtitle")}
              className="mt-2 block max-w-md text-sm text-muted-foreground"
            />
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              {[0, 1].map((i) => (
                <div key={i}>
                  <div className="relative flex aspect-video items-center justify-center rounded-xl bg-black/60">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <Play className="ml-0.5 h-4 w-4 fill-current" />
                    </span>
                  </div>
                  <div className="mt-2.5 h-2.5 w-2/3 rounded bg-muted" />
                  <EditableText
                    as="p"
                    value={t("cta.label")}
                    onChange={set("cta.label")}
                    className="mt-2 block text-xs font-medium text-primary"
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {activePage === "chi-siamo" && (
          <>
            <section className={cn("px-6 text-center", sp("intro"))}>
              <Clapperboard className="mx-auto h-8 w-8 text-primary" aria-hidden />
              <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight">
                <EditableText
                  value={t("intro.titleLine1")}
                  onChange={set("intro.titleLine1")}
                  className="inline-block"
                />
                <br />
                <EditableText
                  value={t("intro.titleLine2")}
                  onChange={set("intro.titleLine2")}
                  className="inline-block text-muted-foreground"
                />
              </h2>
              <EditableText
                as="p"
                value={t("intro.subtitle")}
                onChange={set("intro.subtitle")}
                className="mx-auto mt-4 block max-w-lg text-balance text-sm text-muted-foreground"
              />
            </section>
            <section className="px-6 pb-10 text-center">
              <EditableText
                as="h3"
                value={t("team.title")}
                onChange={set("team.title")}
                className="inline-block text-xl font-semibold tracking-tight"
              />
              <EditableText
                as="p"
                value={t("team.subtitle")}
                onChange={set("team.subtitle")}
                className="mt-1.5 block text-sm text-muted-foreground"
              />
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {[Camera, Clapperboard, PenTool].map((Icon, i) => (
                  <div
                    key={i}
                    className="flex flex-col items-center rounded-xl border bg-card p-5"
                  >
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-primary">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="mt-3 h-2.5 w-20 rounded bg-muted" />
                    <div className="mt-1.5 h-2 w-14 rounded bg-muted/70" />
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        {activePage === "contatti" && (
          <section className={cn("px-6 text-center", sp("intro"))}>
            <EditableText
              as="p"
              value={t("intro.eyebrow")}
              onChange={set("intro.eyebrow")}
              className="inline-block text-xs font-semibold uppercase tracking-[0.3em] text-primary"
            />
            <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight">
              <EditableText
                value={t("intro.titleLine1")}
                onChange={set("intro.titleLine1")}
                className="inline-block"
              />
              <br />
              <EditableText
                value={t("intro.titleLine2")}
                onChange={set("intro.titleLine2")}
                className="inline-block text-muted-foreground"
              />
            </h2>
            <EditableText
              as="p"
              value={t("intro.subtitle")}
              onChange={set("intro.subtitle")}
              className="mx-auto mt-4 block max-w-md text-balance text-sm text-muted-foreground"
            />
            <div className="mx-auto mt-6 grid max-w-md gap-3 sm:grid-cols-[1fr_auto]">
              <div className="space-y-2 rounded-xl border bg-card p-4">
                <div className="h-2.5 w-1/3 rounded bg-muted" />
                <div className="h-7 rounded-lg border bg-background" />
                <div className="h-2.5 w-1/3 rounded bg-muted" />
                <div className="h-14 rounded-lg border bg-background" />
              </div>
              <div className="flex items-center justify-center rounded-xl border bg-card p-4">
                <Mail className="h-5 w-5 text-primary" />
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
