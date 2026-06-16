"use client";

import { useConsent } from "@/components/legal/consent";

/** Link "Gestisci cookie" — riapre il banner delle preferenze. */
export function CookieSettingsButton({ className }: { className?: string }) {
  const { openSettings } = useConsent();
  return (
    <button type="button" onClick={openSettings} className={className}>
      Gestisci cookie
    </button>
  );
}
