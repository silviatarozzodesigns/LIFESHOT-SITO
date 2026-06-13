"use client";

/* eslint-disable @next/next/no-img-element */

import { useState } from "react";
import {
  ArrowRight,
  Camera,
  Clapperboard,
  Clock,
  ImagePlus,
  Mail,
  MapPin,
  Menu,
  PenTool,
  Play,
  Search,
  X,
} from "lucide-react";
import { Logo, LogoMark } from "@/components/brand/logo";
import { EditableText } from "@/components/admin/studio/editable-text";
import {
  getSpacingClass,
  getTypographyClass,
  type CmsData,
  type PageSlug,
} from "@/lib/content";
import { cn } from "@/lib/utils";

export type PreviewSelection = { kind: "text" | "image"; key: string };

interface PreviewProps {
  content: CmsData;
  activePage: PageSlug;
  onText: (slug: PageSlug, key: string, value: string) => void;
  onNavigate: (slug: PageSlug) => void;
  onSelect: (sel: PreviewSelection) => void;
  selected: PreviewSelection | null;
}

const SITE_NAV: { label: string; slug: PageSlug | null }[] = [
  { label: "Galleria", slug: null },
  { label: "Video", slug: "video" },
  { label: "Chi siamo", slug: "chi-siamo" },
  { label: "Contatti", slug: "contatti" },
];

const TEAM = [
  { id: "m1", icon: Camera },
  { id: "m2", icon: Clapperboard },
  { id: "m3", icon: PenTool },
];

export function PagePreview({
  content,
  activePage,
  onText,
  onNavigate,
  onSelect,
  selected,
}: PreviewProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const page = content.pages[activePage];
  const t = (key: string) => page.texts[key] ?? "";
  const img = (key: string) => page.images?.[key] ?? "";
  const imgSet = (key: string) =>
    page.imageSettings?.[key] ?? { position: "center", scale: 100 };
  const set = (key: string) => (value: string) => onText(activePage, key, value);
  const sp = (knob: string) => getSpacingClass(content, activePage, knob);
  const ty = (knob: string) => getTypographyClass(content, activePage, knob);
  const isSel = (kind: PreviewSelection["kind"], key: string) =>
    selected?.kind === kind && selected?.key === key;

  /** Helper: testo modificabile inline già collegato a stato + selezione */
  const field = (
    key: string,
    opts: { as?: React.ElementType; className?: string } = {}
  ) => (
    <EditableText
      value={t(key)}
      onChange={set(key)}
      as={opts.as}
      className={opts.className}
      onSelect={() => onSelect({ kind: "text", key })}
      selected={isSel("text", key)}
    />
  );

  /** Helper: chip per selezionare un'immagine (apre i controlli in sidebar) */
  const imgChip = (key: string, label: string) => (
    <button
      type="button"
      onClick={() => onSelect({ kind: "image", key })}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border bg-card/80 px-2.5 py-1 text-[10px] font-medium backdrop-blur-sm transition-colors hover:border-primary/60",
        isSel("image", key) && "border-primary text-primary"
      )}
    >
      <ImagePlus className="h-3 w-3" />
      {label}
    </button>
  );

  return (
    <div className="relative min-h-full bg-background">
      {/* NAVBAR reale (desktop inline · mobile hamburger+drawer) */}
      <div className="flex items-center justify-between border-b border-border/60 bg-background/70 px-5 py-3 backdrop-blur-xl">
        <button type="button" onClick={() => onNavigate("home")} aria-label="Home">
          <Logo className="scale-90 origin-left" />
        </button>
        {/* Desktop */}
        <nav className="hidden items-center gap-4 text-sm text-muted-foreground sm:flex">
          {SITE_NAV.map((item) => (
            <button
              key={item.label}
              type="button"
              disabled={!item.slug}
              onClick={() => item.slug && onNavigate(item.slug)}
              className={cn(
                "rounded-full px-2.5 py-1 transition-colors",
                item.slug ? "hover:text-primary" : "cursor-default opacity-70",
                item.slug === activePage && "bg-primary/15 text-primary"
              )}
            >
              {item.label}
            </button>
          ))}
        </nav>
        {/* Mobile hamburger */}
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          aria-label="Apri menu"
          className="flex h-9 w-9 items-center justify-center rounded-full text-foreground hover:bg-accent sm:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Drawer mobile — replica il menu a finestra del sito live */}
      {menuOpen && (
        <div className="absolute inset-0 z-50 flex flex-col bg-background/95 backdrop-blur-2xl sm:hidden">
          <div className="flex h-[57px] items-center justify-between border-b border-border/60 px-5">
            <Logo className="scale-90 origin-left" />
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              aria-label="Chiudi menu"
              className="flex h-9 w-9 items-center justify-center rounded-full text-foreground hover:bg-accent"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <nav className="flex flex-1 flex-col items-center justify-center gap-2">
            {SITE_NAV.map((item) => (
              <button
                key={item.label}
                type="button"
                disabled={!item.slug}
                onClick={() => {
                  if (item.slug) onNavigate(item.slug);
                  setMenuOpen(false);
                }}
                className={cn(
                  "rounded-2xl px-6 py-2 text-3xl font-semibold tracking-tight transition-colors",
                  item.slug ? "hover:text-primary" : "opacity-70"
                )}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      )}

      {/* ───────────────────────── HOME ───────────────────────── */}
      {activePage === "home" && (
        <>
          <section className="relative isolate overflow-hidden border-b border-border/50">
            <div className="absolute inset-0 -z-10">
              {img("hero.background") ? (
                <img
                  src={img("hero.background")}
                  alt=""
                  style={{
                    objectPosition: imgSet("hero.background").position,
                    transform: `scale(${Math.max(1.1, imgSet("hero.background").scale / 100)})`,
                  }}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full bg-gradient-to-b from-secondary to-background" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/30" />
              <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-transparent to-transparent" />
            </div>
            {img("hero.foreground") && (
              <img
                src={img("hero.foreground")}
                alt=""
                aria-hidden
                style={{
                  objectPosition: imgSet("hero.foreground").position,
                  transform: `scale(${imgSet("hero.foreground").scale / 100})`,
                  transformOrigin: "bottom right",
                }}
                className="pointer-events-none absolute bottom-0 right-0 top-0 z-20 w-[60%] object-contain"
              />
            )}

            {/* Chip selezione immagini hero */}
            <div className="absolute right-3 top-3 z-10 flex gap-1.5">
              {imgChip("hero.background", "Sfondo")}
              {imgChip("hero.foreground", "Rider")}
            </div>

            <div className="px-6 py-16 sm:py-20">
              <div className="max-w-2xl">
                <span className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  {field("hero.badge")}
                </span>
                {field("hero.eventName", {
                  as: "h1",
                  className: cn(
                    "mt-4 block font-semibold uppercase leading-[0.95] tracking-tight",
                    ty("hero.eventName")
                  ),
                })}
                <div className="mt-4 flex flex-wrap items-end gap-x-5 gap-y-1">
                  {field("hero.eventDate", {
                    className: cn(
                      "font-semibold tabular-nums tracking-tight text-primary",
                      ty("hero.date")
                    ),
                  })}
                  <span className="inline-flex items-center gap-1 pb-1 text-sm font-medium text-foreground/90">
                    <Clock className="h-3.5 w-3.5" />
                    {field("hero.eventTime")}
                  </span>
                </div>
                <span className="mt-2 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5 text-primary" />
                  {field("hero.eventLocation")}
                </span>
                {field("hero.subtitle", {
                  as: "p",
                  className: "mt-4 block max-w-md text-sm text-muted-foreground",
                })}
                <div className="mt-6 flex max-w-sm items-center gap-2 rounded-full border bg-card/80 px-4 py-2 backdrop-blur-md">
                  <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  {field("hero.searchPlaceholder", {
                    className: "min-w-0 flex-1 truncate text-xs text-muted-foreground",
                  })}
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Slider placeholder */}
          <div className="px-6 py-6">
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-primary">
              Gallery
            </p>
            <div className="mt-3 flex gap-3 overflow-hidden">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="aspect-[3/4] h-32 shrink-0 rounded-xl border bg-muted" />
              ))}
            </div>
          </div>

          {/* EVENTI */}
          <section className={cn("px-6", sp("sections"))}>
            {field("events.title", {
              as: "h2",
              className: "block text-xl font-semibold tracking-tight",
            })}
            {field("events.subtitle", {
              as: "p",
              className: "mt-1.5 block text-sm text-muted-foreground",
            })}
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

          {/* SCOUT */}
          <section className={cn("px-6", sp("scout"))}>
            <div className="rounded-3xl border bg-card p-6">
              {field("scout.title", {
                as: "h2",
                className: "block text-2xl font-semibold tracking-tight",
              })}
              {field("scout.subtitle", {
                as: "p",
                className: "mt-2 block max-w-md text-sm text-muted-foreground",
              })}
              <span className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-medium text-primary-foreground">
                {field("scout.button")}
              </span>
            </div>
          </section>
        </>
      )}

      {/* ───────────────────────── VIDEO ───────────────────────── */}
      {activePage === "video" && (
        <section className={cn("px-6", sp("header"))}>
          {field("header.eyebrow", {
            as: "p",
            className: "inline-block text-xs font-semibold uppercase tracking-[0.3em] text-primary",
          })}
          {field("header.title", {
            as: "h2",
            className: cn("mt-2 block font-semibold tracking-tight", ty("header.title")),
          })}
          {field("header.subtitle", {
            as: "p",
            className: "mt-2 block max-w-md text-sm text-muted-foreground",
          })}
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            {[0, 1].map((i) => (
              <div key={i}>
                <div className="relative flex aspect-video items-center justify-center rounded-xl bg-black/60">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Play className="ml-0.5 h-4 w-4 fill-current" />
                  </span>
                </div>
                <div className="mt-2.5 h-2.5 w-2/3 rounded bg-muted" />
                {field("cta.label", {
                  as: "p",
                  className: "mt-2 block text-xs font-medium text-primary",
                })}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ─────────────────────── CHI SIAMO ─────────────────────── */}
      {activePage === "chi-siamo" && (
        <>
          <section className={cn("px-6 text-center", sp("intro"))}>
            {/* LOGO ufficiale (non più clapperboard) */}
            <LogoMark className="mx-auto h-12 w-auto text-primary" />
            <h2 className={cn("mt-4 font-semibold tracking-tight", ty("intro.title"))}>
              {field("intro.titleLine1", { className: "inline-block" })}
              <br />
              {field("intro.titleLine2", {
                className: "inline-block text-muted-foreground",
              })}
            </h2>
            {field("intro.subtitle", {
              as: "p",
              className: "mx-auto mt-4 block max-w-lg text-sm text-muted-foreground",
            })}
          </section>
          <section className="px-6 pb-10 text-center">
            {field("team.title", {
              as: "h3",
              className: "inline-block text-xl font-semibold tracking-tight",
            })}
            {field("team.subtitle", {
              as: "p",
              className: "mt-1.5 block text-sm text-muted-foreground",
            })}
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {TEAM.map((m) => (
                <div
                  key={m.id}
                  className="flex flex-col items-center rounded-xl border bg-card p-5 text-center"
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-primary">
                    <m.icon className="h-5 w-5" />
                  </span>
                  {field(`team.${m.id}.name`, {
                    as: "p",
                    className: "mt-3 block text-sm font-semibold tracking-tight",
                  })}
                  {field(`team.${m.id}.role`, {
                    as: "p",
                    className: "mt-0.5 block text-xs font-medium text-primary",
                  })}
                  {field(`team.${m.id}.bio`, {
                    as: "p",
                    className: "mt-2 block text-xs leading-relaxed text-muted-foreground",
                  })}
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      {/* ─────────────────────── CONTATTI ─────────────────────── */}
      {activePage === "contatti" && (
        <section className={cn("px-6 text-center", sp("intro"))}>
          {field("intro.eyebrow", {
            as: "p",
            className: "inline-block text-xs font-semibold uppercase tracking-[0.3em] text-primary",
          })}
          <h2 className={cn("mt-3 font-semibold tracking-tight", ty("intro.title"))}>
            {field("intro.titleLine1", { className: "inline-block" })}
            <br />
            {field("intro.titleLine2", {
              className: "inline-block text-muted-foreground",
            })}
          </h2>
          {field("intro.subtitle", {
            as: "p",
            className: "mx-auto mt-4 block max-w-md text-sm text-muted-foreground",
          })}
          <div className="mx-auto mt-6 grid max-w-md gap-3 sm:grid-cols-[1fr_auto]">
            <div className="space-y-2 rounded-xl border bg-card p-4 text-left">
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
  );
}
