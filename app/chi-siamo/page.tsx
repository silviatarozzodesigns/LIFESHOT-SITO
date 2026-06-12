import type { Metadata } from "next";
import { Camera, Clapperboard, PenTool } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { FadeIn } from "@/components/motion/fade-in";
import { LogoMark } from "@/components/brand/logo";

export const metadata: Metadata = {
  title: "Chi siamo",
  description:
    "Lifeshot è l'agenzia creativa di Alberto, Lorenzo e Silvia Tarozzo: fotografia, video e grafica con un'anima sola.",
};

const team = [
  {
    name: "Alberto Tarozzo",
    role: "Fotografo",
    icon: Camera,
    initials: "AT",
    bio: "L'occhio dietro l'obiettivo. Vive il bordo pista come pochi: anticipa la traiettoria, congela il decimo di secondo che racconta tutta la gara. Ogni scatto è un istante che non torna — il suo lavoro è non lasciarselo scappare.",
  },
  {
    name: "Lorenzo Tarozzo",
    role: "Videomaker",
    icon: Clapperboard,
    initials: "LT",
    bio: "Il movimento è la sua lingua. Dai reel che esplodono sui social ai montaggi cinematografici delle gare, Lorenzo trasforma ore di girato in storie che tengono gli occhi incollati allo schermo fino all'ultimo frame.",
  },
  {
    name: "Silvia Tarozzo",
    role: "Graphic Designer",
    icon: PenTool,
    initials: "ST",
    bio: "La firma visiva di Lifeshot. Loghi, livree, grafiche social e identità di brand: Silvia dà forma e coerenza a tutto ciò che vedete — incluso questo sito. Se Lifeshot ha uno stile riconoscibile, è merito suo.",
  },
];

export default function ChiSiamoPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />

      <main className="flex-1">
        {/* Intro d'impatto */}
        <section className="container py-24 text-center sm:py-32">
          <FadeIn>
            <LogoMark className="mx-auto h-16 w-auto text-primary" />
            <h1 className="mx-auto mt-8 max-w-3xl text-balance text-4xl font-semibold tracking-tight sm:text-6xl">
              Tre sguardi.
              <br />
              <span className="text-muted-foreground">Una sola visione.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-balance text-lg text-muted-foreground">
              Lifeshot nasce dalla passione di tre fratelli per l&apos;immagine
              in tutte le sue forme. Dalla polvere delle piste da cross ai set
              più curati, raccontiamo storie attraverso fotografia, video e
              grafica — con la stessa ossessione per il dettaglio e per il
              momento giusto.
            </p>
          </FadeIn>
        </section>

        {/* Team */}
        <section className="container pb-24">
          <FadeIn className="mb-10 text-center">
            <h2 className="text-3xl font-semibold tracking-tight">Il team</h2>
            <p className="mt-2 text-muted-foreground">
              Le persone dietro ogni scatto, clip e pixel.
            </p>
          </FadeIn>

          <div className="grid gap-6 md:grid-cols-3">
            {team.map((member, index) => (
              <FadeIn key={member.name} delay={index * 0.1}>
                <article className="group flex h-full flex-col items-center rounded-3xl border bg-card p-8 text-center transition-all duration-500 hover:-translate-y-1 hover:border-primary/40 hover:shadow-[0_20px_60px_-24px_rgba(0,0,0,0.8)]">
                  <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-primary/25 to-primary/5 ring-1 ring-primary/30">
                    <span className="text-2xl font-semibold tracking-wide text-primary">
                      {member.initials}
                    </span>
                  </div>
                  <h3 className="mt-6 text-xl font-semibold tracking-tight">
                    {member.name}
                  </h3>
                  <p className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-primary">
                    <member.icon className="h-4 w-4" />
                    {member.role}
                  </p>
                  <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                    {member.bio}
                  </p>
                </article>
              </FadeIn>
            ))}
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
