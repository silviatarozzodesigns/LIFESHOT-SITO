"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

/** Categorie di cookie non strettamente necessari (i necessari sono sempre on) */
export interface ConsentPrefs {
  functional: boolean;
  thirdParty: boolean;
}

interface ConsentContextValue {
  /** true dopo aver letto localStorage (evita mismatch di idratazione) */
  ready: boolean;
  /** null = scelta non ancora effettuata */
  consent: ConsentPrefs | null;
  bannerOpen: boolean;
  save: (prefs: ConsentPrefs) => void;
  acceptAll: () => void;
  rejectAll: () => void;
  /** Riapre il pannello (link "Gestisci cookie") */
  openSettings: () => void;
}

const STORAGE_KEY = "lifeshot-cookie-consent-v1";

const ConsentContext = createContext<ConsentContextValue>({
  ready: false,
  consent: null,
  bannerOpen: false,
  save: () => {},
  acceptAll: () => {},
  rejectAll: () => {},
  openSettings: () => {},
});

export const useConsent = () => useContext(ConsentContext);

export function ConsentProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [consent, setConsent] = useState<ConsentPrefs | null>(null);
  const [bannerOpen, setBannerOpen] = useState(false);

  // Lettura SOLO client (post-mount): nessun rendering del banner in SSR/idratazione
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const p = JSON.parse(raw);
        setConsent({ functional: !!p.functional, thirdParty: !!p.thirdParty });
      } else {
        setBannerOpen(true);
      }
    } catch {
      setBannerOpen(true);
    }
    setReady(true);
  }, []);

  const save = useCallback((prefs: ConsentPrefs) => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ ...prefs, ts: Date.now() })
      );
    } catch {
      /* storage non disponibile: scelta valida per la sessione corrente */
    }
    setConsent(prefs);
    setBannerOpen(false);
  }, []);

  const acceptAll = useCallback(
    () => save({ functional: true, thirdParty: true }),
    [save]
  );
  const rejectAll = useCallback(
    () => save({ functional: false, thirdParty: false }),
    [save]
  );
  const openSettings = useCallback(() => setBannerOpen(true), []);

  const value = useMemo(
    () => ({
      ready,
      consent,
      bannerOpen,
      save,
      acceptAll,
      rejectAll,
      openSettings,
    }),
    [ready, consent, bannerOpen, save, acceptAll, rejectAll, openSettings]
  );

  return (
    <ConsentContext.Provider value={value}>{children}</ConsentContext.Provider>
  );
}
