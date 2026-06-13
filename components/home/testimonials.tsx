import { Star, Quote } from "lucide-react";
import { FadeIn } from "@/components/motion/fade-in";

const REVIEWS = [
  {
    quote:
      "Foto pazzesche, sembrano uscite da una rivista. Ho trovato i miei scatti in un attimo col numero di gara.",
    name: "Luca B.",
    meta: "#42 · Hard Enduro",
  },
  {
    quote:
      "Consegna velocissima e qualità altissima. Il reel della mia gara ha fatto il pieno di visualizzazioni.",
    name: "Marco V.",
    meta: "#7 · Motocross",
  },
  {
    quote:
      "Professionali e disponibili. Hanno colto l'attimo esatto del salto: una foto che incornicerò.",
    name: "Sara D.",
    meta: "#15 · Enduro",
  },
];

/** "Testimonianze" — social proof dei rider, aumenta la fiducia pre-acquisto. */
export function Testimonials() {
  return (
    <section className="container">
      <FadeIn className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
          Dicono di noi
        </p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
          I rider si fidano di Lifeshot
        </h2>
      </FadeIn>

      <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-3">
        {REVIEWS.map((review, i) => (
          <FadeIn key={review.name} delay={i * 0.08}>
            <figure className="relative flex h-full flex-col rounded-3xl border bg-card p-7">
              <Quote
                className="absolute right-6 top-6 h-8 w-8 text-primary/15"
                aria-hidden
              />
              <div className="flex gap-0.5 text-primary" aria-label="5 stelle su 5">
                {Array.from({ length: 5 }).map((_, s) => (
                  <Star key={s} className="h-4 w-4 fill-current" />
                ))}
              </div>
              <blockquote className="mt-4 flex-1 text-balance text-sm leading-relaxed text-foreground/90">
                “{review.quote}”
              </blockquote>
              <figcaption className="mt-6 border-t pt-4">
                <p className="font-semibold tracking-tight">{review.name}</p>
                <p className="text-xs text-muted-foreground">{review.meta}</p>
              </figcaption>
            </figure>
          </FadeIn>
        ))}
      </div>
    </section>
  );
}
