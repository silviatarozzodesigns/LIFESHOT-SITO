"use client";

import Link from "next/link";
import { ArrowRight, Instagram, Mail } from "lucide-react";
import { useEditMode } from "@/components/cms/edit-mode";
import { site } from "@/lib/site";
import { cn } from "@/lib/utils";

const MAIL_HREF = `mailto:${site.email}?subject=${encodeURIComponent(
  "Richiesta informazioni — Lifeshot"
)}`;

/**
 * I due canali di contatto reali dell'agenzia: DM Instagram (primario,
 * è dove si scrive con i clienti) e mail con oggetto precompilato.
 * Usato sia nel pannello della CTA hero sia nella sezione contatti.
 */
export function ContactChannels({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="grid gap-2.5">
      <a
        href={site.instagramDmUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onNavigate}
        className="group flex items-center gap-3.5 rounded-2xl bg-primary px-5 py-4 text-left text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:scale-[1.02] hover:shadow-primary/40 active:scale-95"
      >
        <Instagram className="h-6 w-6 shrink-0 transition-transform group-hover:rotate-[8deg]" />
        <span className="min-w-0">
          <span className="block text-sm font-semibold">
            Scrivici su Instagram
          </span>
          <span className="block text-xs opacity-80">
            DM a {site.instagramHandle} · di solito rispondiamo in giornata
          </span>
        </span>
      </a>
      <a
        href={MAIL_HREF}
        onClick={onNavigate}
        className="group flex items-center gap-3.5 rounded-2xl border bg-card/90 px-5 py-4 text-left transition-colors hover:border-primary/50"
      >
        <Mail className="h-6 w-6 shrink-0 text-primary" />
        <span className="min-w-0">
          <span className="block text-sm font-semibold">Mandaci una mail</span>
          <span className="block break-all text-xs text-muted-foreground">
            {site.email}
          </span>
        </span>
      </a>
    </div>
  );
}

/**
 * CTA principale della hero: porta alla pagina contatti.
 *
 * Prima apriva un pannello con DM e mail: chi non ha Instagram (aziende,
 * ristoranti) restava con una sola strada informale. La pagina contatti ha
 * il modulo, quindi si scrive anche senza avere un profilo.
 *
 * In edit mode CMS il click NON naviga, così l'admin può modificare il
 * testo del bottone senza cambiare pagina.
 */
export function ContactCta({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { editMode } = useEditMode();

  return (
    <Link
      href="/contatti"
      onClick={editMode ? (e) => e.preventDefault() : undefined}
      className={cn(
        "group inline-flex items-center justify-center gap-2.5 whitespace-nowrap rounded-full bg-primary px-8 py-4 text-base font-semibold text-primary-foreground shadow-xl shadow-primary/30 transition-all hover:scale-[1.03] hover:shadow-primary/50 active:scale-95",
        className
      )}
    >
      {children}
      <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}
