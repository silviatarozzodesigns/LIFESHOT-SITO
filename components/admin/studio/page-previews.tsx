"use client";

/* eslint-disable @next/next/no-img-element */

import {
  ArrowRight,
  Camera,
  Clapperboard,
  Clock,
  Mail,
  MapPin,
  PenTool,
  Play,
  Search,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { EditableText } from "@/components/admin/studio/editable-text";
import {
  getSpacingClass,
  getTypographyClass,
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
 * Navbar dell'anteprima = navbar REALE del sito (components/site-header).
 * Le voci che corrispondono a una pagina CMS cambiano la pagina in modifica;
 * "Galleria" è una rotta non editabile dal CMS → resta solo visiva.
 */
const SITE_NAV: { label: string; slug: PageSlug | null }[] = [
  { label: "Galleria", slug: null },
  { label: "Video", slug: "video" },
  { label: "Chi siamo", slug: "chi-siamo" },
  { label: "Contatti", slug: "contatti" },
];

const TEAM = [
  { name: "Alberto Tarozzo", role: "Fotografo", icon: Camera },
  { name: "Lorenzo Tarozzo", role: "Videomaker", icon: Clapperboard },
  { name: "Silvia Tarozzo", role: "Graphic Designer", icon: PenTool },
];

export function PagePreview({
  content,
  activePage,
  onText,
  onNavigate,
}: PreviewProps) {
  const page = content.pages[activePage];
  const t = (key: string) => page.texts[key] ?? "";
  const img = (key: string) => page.images?.[key] ?? "";
  const set = (key: string) => (value: string) => onText(activePage, key, value);
  const sp = (knob: string) => getSpacingClass(content, activePage, knob);
  const ty = (knob: string) => getTypographyClass(content, activePage, knob);

  return (
    <div className="min-h-full bg-background">
      {/* NAVBAR reale */}
      <div className="flex items-center justify-between border-b border-border/60 bg-background/70 px-5 py-3 backdrop-blur-xl">
        <button type="button" onClick={() => onNavigate("home")} aria-label="Home">
          <Logo className="scale-90 origin-left" />
        </button>
        <nav className="flex items-center gap-3 text-xs text-muted-foreground sm:gap-4 sm:text-sm">
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
      </div>

      {/* ───────────────────────── HOME ───────────────────────── */}
      {activePage === "home" && (
        <>
          {/* HERO 3D */}
          <section className="relative isolate overflow-hidden border-b border-border/50">
            <div className="absolute inset-0 -z-10">
              {img("hero.background") ? (
                <img
                  src={img("hero.background")}
                  alt=""
                  className="h-full w-full scale-110 object-cover"
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
                className="pointer-events-none absolute inset-y-0 right-0 -z-[5] hidden w-1/2 object-contain object-bottom sm:block"
              />
            )}

            <div className="px-6 py-16 sm:py-20">
              <div className="max-w-2xl">
                <span className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  <EditableText value={t("hero.badge")} onChange={set("hero.badge")} />
                </span>
                <EditableText
                  as="h1"
                  value={t("hero.eventName")}
                  onChange={set("hero.eventName")}
                  className={cn(
                    "mt-4 block font-semibold uppercase leading-[0.95] tracking-tight",
                    ty("hero.eventName")
                  )}
                />
                <div className="mt-4 flex flex-wrap items-end gap-x-5 gap-y-1">
                  <EditableText
                    value={t("hero.eventDate")}
                    onChange={set("hero.eventDate")}
                    className={cn(
                      "font-semibold tabular-nums tracking-tight text-primary",
                      ty("hero.date")
                    )}
                  />
                  <span className="inline-flex items-center gap-1 pb-1 text-sm font-medium text-foreground/90">
                    <Clock className="h-3.5 w-3.5" />
                    <EditableText value={t("hero.eventTime")} onChange={set("hero.eventTime")} />
                  </span>
                </div>
                <span className="mt-2 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5 text-primary" />
                  <EditableText
                    value={t("hero.eventLocation")}
                    onChange={set("hero.eventLocation")}
                  />
                </span>
                <EditableText
                  as="p"
                  value={t("hero.subtitle")}
                  onChange={set("hero.subtitle")}
                  className="mt-4 block max-w-md text-sm text-muted-foreground"
                />
                <div className="mt-6 flex max-w-sm items-center gap-2 rounded-full border bg-card/80 px-4 py-2 backdrop-blur-md">
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
              </div>
            </div>
          </section>

          {/* MARQUEE placeholder */}
          <div className="flex gap-3 overflow-hidden px-6 py-6">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="aspect-[3/2] h-24 shrink-0 rounded-xl border bg-muted"
              />
            ))}
          </div>

          {/* EVENTI */}
          <section className={cn("px-6", sp("sections"))}>
            <EditableText
              as="h2"
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

          {/* SCOUT */}
          <section className={cn("px-6", sp("scout"))}>
            <div className="rounded-3xl border bg-card p-6">
              <EditableText
                as="h2"
                value={t("scout.title")}
                onChange={set("scout.title")}
                className="block text-2xl font-semibold tracking-tight"
              />
              <EditableText
                as="p"
                value={t("scout.subtitle")}
                onChange={set("scout.subtitle")}
                className="mt-2 block max-w-md text-sm text-muted-foreground"
              />
              <span className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-medium text-primary-foreground">
                <EditableText value={t("scout.button")} onChange={set("scout.button")} />
              </span>
            </div>
          </section>
        </>
      )}

      {/* ───────────────────────── VIDEO ───────────────────────── */}
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
            className={cn("mt-2 block font-semibold tracking-tight", ty("header.title"))}
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

      {/* ─────────────────────── CHI SIAMO ─────────────────────── */}
      {activePage === "chi-siamo" && (
        <>
          <section className={cn("px-6 text-center", sp("intro"))}>
            <Clapperboard className="mx-auto h-8 w-8 text-primary" aria-hidden />
            <h2 className={cn("mt-4 font-semibold tracking-tight", ty("intro.title"))}>
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
              className="mx-auto mt-4 block max-w-lg text-sm text-muted-foreground"
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
              {TEAM.map((m) => (
                <div
                  key={m.name}
                  className="flex flex-col items-center rounded-xl border bg-card p-5"
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-primary">
                    <m.icon className="h-5 w-5" />
                  </span>
                  <p className="mt-3 text-sm font-semibold tracking-tight">{m.name}</p>
                  <p className="mt-0.5 text-xs font-medium text-primary">{m.role}</p>
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      {/* ─────────────────────── CONTATTI ─────────────────────── */}
      {activePage === "contatti" && (
        <section className={cn("px-6 text-center", sp("intro"))}>
          <EditableText
            as="p"
            value={t("intro.eyebrow")}
            onChange={set("intro.eyebrow")}
            className="inline-block text-xs font-semibold uppercase tracking-[0.3em] text-primary"
          />
          <h2 className={cn("mt-3 font-semibold tracking-tight", ty("intro.title"))}>
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
            className="mx-auto mt-4 block max-w-md text-sm text-muted-foreground"
          />
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
