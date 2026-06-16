"use client";

import { useState } from "react";
import Link from "next/link";
import { Cookie } from "lucide-react";
import { useConsent } from "@/components/legal/consent";
import { cn } from "@/lib/utils";

/** Toggle minimale stile sito (oro/scuro) */
function Switch({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange?: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange?.(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition-colors",
        checked ? "bg-primary" : "bg-muted-foreground/30",
        disabled && "opacity-60"
      )}
    >
      <span
        className={cn(
          "h-5 w-5 rounded-full bg-white shadow-sm transition-transform",
          checked ? "translate-x-5" : "translate-x-0"
        )}
      />
    </button>
  );
}

export function CookieBanner() {
  const { ready, bannerOpen, consent, acceptAll, rejectAll, save } =
    useConsent();
  const [custom, setCustom] = useState(false);
  const [functional, setFunctional] = useState(consent?.functional ?? false);
  const [thirdParty, setThirdParty] = useState(consent?.thirdParty ?? false);

  // Mai in SSR/prima idratazione: si mostra solo dopo la lettura client
  if (!ready || !bannerOpen) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[150] flex justify-center px-3 pb-3 sm:px-4 sm:pb-4">
      <div className="pointer-events-auto w-full max-w-2xl overflow-hidden rounded-2xl border border-primary/25 bg-background/95 shadow-[0_24px_70px_-20px_rgba(0,0,0,0.85)] backdrop-blur-xl">
        <div className="p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
              <Cookie className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold tracking-tight">
                Rispettiamo la tua privacy
              </p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                Usiamo cookie tecnici necessari al funzionamento del sito e,
                solo col tuo consenso, cookie funzionali e di terze parti (es.
                widget video di Instagram). Puoi accettarli, rifiutarli o
                scegliere quali attivare. Dettagli nella{" "}
                <Link
                  href="/cookie-policy"
                  className="font-medium text-primary underline-offset-2 hover:underline"
                >
                  Cookie Policy
                </Link>
                .
              </p>
            </div>
          </div>

          {/* Pannello "Personalizza" */}
          {custom && (
            <div className="mt-4 space-y-3 rounded-xl border bg-card/60 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">Necessari</p>
                  <p className="text-xs text-muted-foreground">
                    Sempre attivi: sicurezza e funzionamento base.
                  </p>
                </div>
                <Switch checked disabled />
              </div>
              <div className="flex items-center justify-between gap-3 border-t pt-3">
                <div>
                  <p className="text-sm font-medium">Funzionali</p>
                  <p className="text-xs text-muted-foreground">
                    Preferenze ed esperienza migliorata.
                  </p>
                </div>
                <Switch checked={functional} onChange={setFunctional} />
              </div>
              <div className="flex items-center justify-between gap-3 border-t pt-3">
                <div>
                  <p className="text-sm font-medium">Terze parti</p>
                  <p className="text-xs text-muted-foreground">
                    Widget esterni (Instagram, video) e contenuti embeddati.
                  </p>
                </div>
                <Switch checked={thirdParty} onChange={setThirdParty} />
              </div>
            </div>
          )}

          {/* Azioni */}
          <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
            {custom ? (
              <button
                type="button"
                onClick={() => save({ functional, thirdParty })}
                className="order-1 inline-flex h-11 items-center justify-center rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:scale-[1.02] active:scale-95 sm:order-3"
              >
                Salva preferenze
              </button>
            ) : (
              <button
                type="button"
                onClick={acceptAll}
                className="order-1 inline-flex h-11 items-center justify-center rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:scale-[1.02] active:scale-95 sm:order-3"
              >
                Accetta tutti
              </button>
            )}
            <button
              type="button"
              onClick={() => setCustom((v) => !v)}
              className="order-3 inline-flex h-11 items-center justify-center rounded-full border px-5 text-sm font-medium transition-colors hover:border-primary/50 hover:text-primary sm:order-1"
            >
              {custom ? "Chiudi" : "Personalizza"}
            </button>
            <button
              type="button"
              onClick={rejectAll}
              className="order-2 inline-flex h-11 items-center justify-center rounded-full px-5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:order-2"
            >
              Rifiuta
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
