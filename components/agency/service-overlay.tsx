"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, Instagram, X } from "lucide-react";
import { EditableText } from "@/components/cms/editable-text";
import type { ServiceCopy } from "@/lib/content";
import { SERVICES, type ServiceId } from "@/lib/services";
import { site } from "@/lib/site";

/**
 * OVERLAY DEI SERVIZI — si apre cliccando un cursore della hero.
 *
 * Velo semitrasparente e sfocato: la hero resta riconoscibile dietro, ma il
 * testo si legge. Un servizio alla volta, con "Vedi anche" per saltare a
 * quelli collegati: così anche su touch, dove i cursori sono 4, si arriva a
 * tutti e sei i servizi.
 *
 * Montato su <body> via portal: il suo position:fixed non dipende da
 * antenati con filter/transform (l'hero ne ha).
 */
export function ServiceOverlay({
  openId,
  copy,
  onSelect,
  onClose,
}: {
  /** Servizio aperto, o null se l'overlay è chiuso */
  openId: ServiceId | null;
  /** Testi dal CMS, per id servizio */
  copy: Record<string, ServiceCopy>;
  onSelect: (id: ServiceId) => void;
  onClose: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Esc per chiudere + blocco dello scroll di fondo mentre è aperto
  useEffect(() => {
    if (!openId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [openId, onClose]);

  if (!mounted) return null;

  const service = openId ? SERVICES[openId] : null;
  const text = openId ? copy[openId] : null;

  return createPortal(
    <AnimatePresence>
      {openId && service && text && (
        <motion.div
          key="service-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.28, ease: "easeOut" }}
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label={text.title}
          /* Velo: scuro quanto basta per leggere, ma la hero resta
             riconoscibile dietro (sfocatura media, non totale) */
          className="fixed inset-0 z-[95] flex items-center justify-center bg-background/70 p-6 backdrop-blur-md"
        >
          {/* Il pannello non chiude al click: solo il velo attorno */}
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.35, ease: [0.22, 0.61, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-lg rounded-3xl border border-border/60 bg-card/70 p-7 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.9)] sm:p-9"
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Chiudi"
              className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>

            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
              Servizio
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              <EditableText
                page="agenzia"
                k={`svc.${openId}.title`}
                value={text.title}
                maxLength={60}
              />
            </h2>
            <p className="mt-4 text-pretty leading-relaxed text-muted-foreground">
              <EditableText
                page="agenzia"
                k={`svc.${openId}.body`}
                value={text.body}
                as="span"
                maxLength={400}
              />
            </p>

            <a
              href={site.instagramDmUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group mt-7 inline-flex items-center gap-2.5 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:scale-[1.03] hover:shadow-primary/40 active:scale-95"
            >
              <Instagram className="h-4 w-4" />
              Richiedi questo servizio
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </a>

            {/* VEDI ANCHE — su touch è la strada verso i servizi senza cursore */}
            {service.related.length > 0 && (
              <div className="mt-7 border-t border-border/60 pt-5">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Vedi anche
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {service.related.map((id) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => onSelect(id)}
                      className="rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-foreground/80 transition-colors hover:border-primary/50 hover:text-primary"
                    >
                      {copy[id]?.title ?? SERVICES[id].label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
