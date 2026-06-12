import type { Metadata } from "next";
import { ArrowUpRight, Instagram, Mail, Youtube } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { FadeIn } from "@/components/motion/fade-in";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contatti",
  description:
    "Scrivici su Instagram o via email: foto degli eventi, video personalizzati e progetti grafici.",
};

const channels = [
  {
    label: "Instagram",
    value: site.instagramHandle,
    description:
      "Il canale più veloce: DM per foto inedite, pacchetti completi e richieste last-minute.",
    href: site.instagramUrl,
    icon: Instagram,
  },
  {
    label: "YouTube",
    value: "Lifeshot",
    description: "I montaggi delle gare e i progetti video più recenti.",
    href: site.youtubeUrl,
    icon: Youtube,
  },
  {
    label: "Email",
    value: site.email,
    description: "Per informazioni generali, ordini foto e richieste stampa.",
    href: `mailto:${site.email}`,
    icon: Mail,
  },
  {
    label: "Collaborazioni",
    value: site.emailCommerciale,
    description:
      "Coperture eventi, partnership con team e organizzatori, progetti brand.",
    href: `mailto:${site.emailCommerciale}`,
    icon: Mail,
  },
];

export default function ContattiPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />

      <main className="container flex-1 py-24 sm:py-32">
        <FadeIn className="text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">
            Parliamone
          </p>
          <h1 className="mx-auto mt-4 max-w-2xl text-balance text-4xl font-semibold tracking-tight sm:text-6xl">
            Raccontaci cosa
            <br />
            <span className="text-muted-foreground">vuoi raccontare.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-balance text-lg text-muted-foreground">
            Foto della tua gara, un video personalizzato o l&apos;identità
            visiva del tuo progetto: siamo a un messaggio di distanza.
          </p>
        </FadeIn>

        <div className="mx-auto mt-16 grid max-w-3xl gap-4 sm:grid-cols-2">
          {channels.map((channel, index) => (
            <FadeIn key={channel.label + channel.value} delay={index * 0.08}>
              <a
                href={channel.href}
                target={channel.href.startsWith("http") ? "_blank" : undefined}
                rel="noopener noreferrer"
                className="group flex h-full flex-col rounded-3xl border bg-card p-6 transition-all duration-500 hover:-translate-y-1 hover:border-primary/40 hover:shadow-[0_20px_60px_-24px_rgba(0,0,0,0.8)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <div className="flex items-center justify-between">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/15 text-primary">
                    <channel.icon className="h-5 w-5" />
                  </span>
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary" />
                </div>
                <h2 className="mt-5 font-semibold tracking-tight">
                  {channel.label}
                </h2>
                <p className="mt-0.5 text-sm font-medium text-primary">
                  {channel.value}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {channel.description}
                </p>
              </a>
            </FadeIn>
          ))}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
