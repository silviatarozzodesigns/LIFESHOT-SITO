import type { Metadata } from "next";
import { ArrowUpRight, Instagram, Mail, Youtube } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { FadeIn } from "@/components/motion/fade-in";
import { ContactForm } from "@/components/contact/contact-form";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contatti",
  description:
    "Scrivici dal form o su Instagram: foto degli eventi, video personalizzati e progetti grafici.",
};

const socials = [
  {
    label: "Instagram",
    value: site.instagramHandle,
    href: site.instagramUrl,
    icon: Instagram,
  },
  {
    label: "YouTube",
    value: "Lifeshot",
    href: site.youtubeUrl,
    icon: Youtube,
  },
];

export default function ContattiPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />

      <main className="container flex-1 py-16 sm:py-24">
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
            visiva del tuo progetto: compila il form e ti rispondiamo noi.
          </p>
        </FadeIn>

        <div className="mx-auto mt-14 grid max-w-5xl gap-6 lg:grid-cols-[1fr_320px]">
          {/* Form di contatto */}
          <FadeIn delay={0.1}>
            <ContactForm />
          </FadeIn>

          {/* Email ufficiale unica + social */}
          <FadeIn delay={0.18} className="space-y-4">
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
