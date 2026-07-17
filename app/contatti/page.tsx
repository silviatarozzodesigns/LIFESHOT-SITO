import type { Metadata } from "next";
import { ArrowUpRight, Instagram, Mail, Phone, Youtube } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { FadeIn } from "@/components/motion/fade-in";
import { ContactForm } from "@/components/contact/contact-form";
import { EditableText } from "@/components/cms/editable-text";
import { site } from "@/lib/site";
import { getPublishedContent, getViewContent } from "@/lib/data/content";
import { getSpacingClass, getText, getTextStyle } from "@/lib/content";
import { cn } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const { seo } = (await getPublishedContent()).pages.contatti;
  return {
    title: { absolute: seo.metaTitle },
    description: seo.metaDescription,
    openGraph: {
      title: seo.metaTitle,
      description: seo.metaDescription,
      ...(seo.ogImage ? { images: [seo.ogImage] } : {}),
    },
  };
}

export const dynamic = "force-dynamic";

const socials = [
  {
    label: "Instagram",
    value: site.instagramHandle,
    href: site.instagramUrl,
    icon: Instagram,
  },
  {
    label: "YouTube",
    value: "LIFESHOT",
    href: site.youtubeUrl,
    icon: Youtube,
  },
];

export default async function ContattiPage({
  searchParams,
}: {
  searchParams: Promise<{ preview?: string }>;
}) {
  const { preview } = await searchParams;
  const content = await getViewContent(preview === "1");
  const t = (key: string) => getText(content, "contatti", key);
  const ts = (key: string) => getTextStyle(content, "contatti", key);

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />

      <main
        className={cn(
          "container flex-1",
          getSpacingClass(content, "contatti", "intro")
        )}
      >
        <FadeIn className="text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">
            <EditableText page="contatti" k="intro.eyebrow" value={t("intro.eyebrow")} as="span" maxLength={60} style={ts("intro.eyebrow")} />
          </p>
          <h1 className="mx-auto mt-4 max-w-2xl text-balance text-4xl font-semibold tracking-tight sm:text-6xl">
            <EditableText page="contatti" k="intro.titleLine1" value={t("intro.titleLine1")} maxLength={80} style={ts("intro.titleLine1")} />
            <br />
            <span className="text-muted-foreground">
              <EditableText page="contatti" k="intro.titleLine2" value={t("intro.titleLine2")} maxLength={80} style={ts("intro.titleLine2")} />
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-balance text-lg text-muted-foreground">
            <EditableText page="contatti" k="intro.subtitle" value={t("intro.subtitle")} as="span" maxLength={300} style={ts("intro.subtitle")} />
          </p>
        </FadeIn>

        {/* DM PRIMA DEL MODULO — è il canale dove si risponde davvero, e chi
            arriva qui ha già deciso di scriverci: la scelta del come sta
            bene qui, non nelle hero (lì l'azione dev'essere una sola). */}
        <FadeIn delay={0.06} className="mx-auto mt-12 max-w-md text-center">
          <a
            href={site.instagramDmUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex w-full items-center justify-center gap-2.5 rounded-full bg-primary px-7 py-4 text-base font-semibold text-primary-foreground shadow-xl shadow-primary/30 transition-all hover:scale-[1.02] hover:shadow-primary/50 active:scale-95"
          >
            <Instagram className="h-5 w-5 transition-transform group-hover:rotate-[8deg]" />
            Scrivici in DM
          </a>
          <p className="mt-2 text-xs text-muted-foreground">
            {site.instagramHandle} · di solito rispondiamo in giornata
          </p>

          {/* Separatore "oppure": divide il canale veloce dalle alternative */}
          <div className="mt-8 flex items-center gap-4">
            <span className="h-px flex-1 bg-border" />
            <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              oppure
            </span>
            <span className="h-px flex-1 bg-border" />
          </div>
        </FadeIn>

        <div className="mx-auto mt-10 grid max-w-5xl gap-6 lg:grid-cols-[1fr_320px]">
          {/* Form di contatto */}
          <FadeIn delay={0.1}>
            <ContactForm />
          </FadeIn>

          {/* Telefono, email ufficiale e social */}
          <FadeIn delay={0.18} className="space-y-4">
            <a
              href={site.phoneHref}
              className="group flex items-center gap-4 rounded-3xl border bg-card p-5 transition-all duration-500 hover:-translate-y-0.5 hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                <Phone className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold tracking-tight">
                  Chiama ora
                </span>
                <span className="block truncate text-sm text-primary">
                  {site.phone}
                </span>
              </span>
            </a>

            <a
              href={`mailto:${site.email}`}
              className="group block rounded-3xl border bg-card p-6 transition-all duration-500 hover:-translate-y-0.5 hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/15 text-primary">
                <Mail className="h-5 w-5" />
              </span>
              <h2 className="mt-4 font-semibold tracking-tight">
                Email ufficiale
              </h2>
              <p className="mt-1 break-all text-sm font-medium text-primary">
                {site.email}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Per ordini foto, preventivi e richieste stampa.
              </p>
            </a>

            {socials.map((social) => (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-4 rounded-3xl border bg-card p-5 transition-all duration-500 hover:-translate-y-0.5 hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                  <social.icon className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold tracking-tight">
                    {social.label}
                  </span>
                  <span className="block truncate text-sm text-primary">
                    {social.value}
                  </span>
                </span>
                <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary" />
              </a>
            ))}
          </FadeIn>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
