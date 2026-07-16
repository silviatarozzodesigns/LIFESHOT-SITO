import { Search, Images, Instagram, Download } from "lucide-react";
import { FadeIn } from "@/components/motion/fade-in";

/**
 * Il flusso VERO: dal sito non si compra. Si cerca lo scatto, si manda il
 * suo codice in DM, si concorda insieme, e a pagamento fatto arriva il link
 * per scaricare. Prometteva carrello e download immediato: entrambi
 * inesistenti, e una promessa mancata al primo contatto costa più di una
 * spiegazione onesta.
 */
const STEPS = [
  {
    icon: Search,
    title: "Cerca il tuo numero",
    body: "Digita il tuo nome o il numero di gara nella barra di ricerca.",
  },
  {
    icon: Images,
    title: "Trova i tuoi scatti",
    body: "Sfoglia le foto in cui compari e apri quella che vuoi: sotto trovi il suo codice scatto.",
  },
  {
    icon: Instagram,
    title: "Scrivici il codice in DM",
    body: "Niente carrello: mandaci il codice, ci accordiamo insieme sul da farsi e paghi come concordato.",
  },
  {
    icon: Download,
    title: "Ricevi il link e scarica",
    body: "A pagamento fatto ti arriva un link via DM o mail: file in alta risoluzione, senza filigrana.",
  },
];

/** "Come funziona" — spiega il flusso d'acquisto, riduce l'attrito. */
export function HowItWorks() {
  return (
    <section className="container">
      <FadeIn className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
          Come funziona
        </p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
          Dai tuoi scatti a casa in 4 passi
        </h2>
        <p className="mt-3 text-muted-foreground">
          Niente carrello e niente account: gli scatti li trovi qui e ce li
          chiedi in DM, come si fa fra persone.
        </p>
      </FadeIn>

      <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((step, i) => (
          <FadeIn key={step.title} delay={i * 0.08}>
            <div className="group relative h-full overflow-hidden rounded-2xl border bg-card p-6 transition-all duration-500 hover:-translate-y-1 hover:border-primary/40">
              <span className="absolute right-4 top-3 text-5xl font-bold tabular-nums text-primary/10 transition-colors group-hover:text-primary/20">
                {i + 1}
              </span>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <step.icon className="h-6 w-6" />
              </div>
              <h3 className="mt-4 font-semibold tracking-tight">{step.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{step.body}</p>
            </div>
          </FadeIn>
        ))}
      </div>
    </section>
  );
}
