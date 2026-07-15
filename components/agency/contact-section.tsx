import { MessageCircle } from "lucide-react";
import { ContactChannels } from "@/components/agency/contact-cta";
import { EditableText } from "@/components/cms/editable-text";
import type { TextStyle } from "@/lib/content";

/**
 * SEZIONE CONTATTI in fondo alla home agenzia: titolo + i due canali
 * reali (DM Instagram e mail) mostrati direttamente, senza form.
 */
export function ContactSection({
  title,
  subtitle,
  titleStyle,
  subtitleStyle,
}: {
  title: string;
  subtitle: string;
  titleStyle?: TextStyle;
  subtitleStyle?: TextStyle;
}) {
  return (
    <div className="relative overflow-hidden rounded-3xl border bg-card p-6 sm:p-10">
      <div
        aria-hidden
        className="glow-primary pointer-events-none absolute right-[-10%] top-[-40%] h-[24rem] w-[36rem]"
      />
      <div className="relative grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:items-center">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            <MessageCircle className="h-3.5 w-3.5" aria-hidden />
            Contatti
          </span>
          <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            <EditableText
              page="agenzia"
              k="contact.title"
              value={title}
              maxLength={80}
              style={titleStyle}
            />
          </h2>
          <p className="mt-3 max-w-md text-balance text-muted-foreground">
            <EditableText
              page="agenzia"
              k="contact.subtitle"
              value={subtitle}
              as="span"
              maxLength={200}
              style={subtitleStyle}
            />
          </p>
        </div>
        <ContactChannels />
      </div>
    </div>
  );
}
