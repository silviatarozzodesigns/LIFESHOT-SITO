import Link from "next/link";
import { Camera, Clapperboard, Palette, ArrowUpRight } from "lucide-react";
import { FadeIn } from "@/components/motion/fade-in";
import { site } from "@/lib/site";

const SERVICES = [
  {
    icon: Camera,
    title: "Fotografia",
    body: "Copertura fotografica di gare ed eventi: ogni salto, ogni sorpasso, congelato in alta risoluzione.",
    points: ["Eventi sportivi", "Ritratti & team", "Consegna rapida"],
  },
  {
    icon: Clapperboard,
    title: "Video",
    body: "Reel social, clip cinematiche e montaggi della tua gara, pensati per far girare il tuo nome.",
    points: ["Reel & short", "Montaggi gara", "Clip personalizzate"],
  },
  {
    icon: Palette,
    title: "Grafica",
    body: "Loghi, livree, grafiche social e identità di brand: tutto coerente, tutto riconoscibile.",
    points: ["Logo & brand", "Livree moto", "Social kit"],
  },
];

/** "Servizi" — racconta cosa offre Lifeshot oltre alle foto evento. */
export function Services() {
  return (
    <section className="container">
      <FadeIn className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
        <div className="max-w-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
            Cosa facciamo
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            Foto, video e grafica con un&apos;anima sola
          </h2>
          <p className="mt-3 text-muted-foreground">
            Un unico team per tutta la tua immagine, dentro e fuori dalla pista.
          </p>
        </div>
        <Link
          href={site.instagramDmUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition-colors hover:border-primary/50 hover:text-primary"
        >
          Richiedi un preventivo
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </FadeIn>

      <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-3">
        {SERVICES.map((service, i) => (
          <FadeIn key={service.title} delay={i * 0.08}>
            <Link
              href={site.instagramDmUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex h-full flex-col rounded-3xl border bg-card p-7 transition-all duration-500 hover:-translate-y-1 hover:border-primary/40 hover:shadow-[0_24px_70px_-30px_rgba(0,0,0,0.7)]"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <service.icon className="h-6 w-6" />
              </div>
              <h3 className="mt-5 text-xl font-semibold tracking-tight">
                {service.title}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">{service.body}</p>
              <ul className="mt-5 space-y-1.5 border-t pt-5 text-sm">
                {service.points.map((p) => (
                  <li key={p} className="flex items-center gap-2 text-muted-foreground">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    {p}
                  </li>
                ))}
              </ul>
              <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-primary">
                Scrivici in DM
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </span>
            </Link>
          </FadeIn>
        ))}
      </div>
    </section>
  );
}
