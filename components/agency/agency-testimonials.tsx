import { Quote, Star } from "lucide-react";
import { FadeIn } from "@/components/motion/fade-in";
import { EditableText } from "@/components/cms/editable-text";
import { getText, getTextStyle, type CmsData } from "@/lib/content";

const REVIEW_IDS = ["r1", "r2", "r3"] as const;

/**
 * TESTIMONIANZE MISTE della home agenzia: una voce per categoria
 * (motorsport, ristorazione, business…), tutte modificabili dal CMS.
 * Stesso linguaggio visivo delle testimonianze rider su /motorsport.
 */
export function AgencyTestimonials({ content }: { content: CmsData }) {
  const t = (key: string) => getText(content, "agenzia", key);
  const ts = (key: string) => getTextStyle(content, "agenzia", key);

  return (
    <section className="container">
      <FadeIn className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
          Testimonianze
        </p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
          <EditableText
            page="agenzia"
            k="reviews.title"
            value={t("reviews.title")}
            maxLength={80}
            style={ts("reviews.title")}
          />
        </h2>
        <p className="mt-2 text-muted-foreground">
          <EditableText
            page="agenzia"
            k="reviews.subtitle"
            value={t("reviews.subtitle")}
            as="span"
            maxLength={160}
            style={ts("reviews.subtitle")}
          />
        </p>
      </FadeIn>

      <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-3">
        {REVIEW_IDS.map((id, i) => (
          <FadeIn key={id} delay={i * 0.08}>
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
                “
                <EditableText
                  page="agenzia"
                  k={`reviews.${id}.quote`}
                  value={t(`reviews.${id}.quote`)}
                  as="span"
                  maxLength={240}
                  style={ts(`reviews.${id}.quote`)}
                />
                ”
              </blockquote>
              <figcaption className="mt-6 border-t pt-4">
                <p className="font-semibold tracking-tight">
                  <EditableText
                    page="agenzia"
                    k={`reviews.${id}.name`}
                    value={t(`reviews.${id}.name`)}
                    as="span"
                    maxLength={60}
                    style={ts(`reviews.${id}.name`)}
                  />
                </p>
                <p className="text-xs text-muted-foreground">
                  <EditableText
                    page="agenzia"
                    k={`reviews.${id}.meta`}
                    value={t(`reviews.${id}.meta`)}
                    as="span"
                    maxLength={60}
                    style={ts(`reviews.${id}.meta`)}
                  />
                </p>
              </figcaption>
            </figure>
          </FadeIn>
        ))}
      </div>
    </section>
  );
}
