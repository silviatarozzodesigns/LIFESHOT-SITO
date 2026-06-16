"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { usePathname } from "next/navigation";

interface EditModeState {
  /** L'utente è admin loggato (può modificare) */
  isAdmin: boolean;
  /** Edit mode attivo: i testi diventano cliccabili/modificabili */
  editMode: boolean;
  setEditMode: (v: boolean) => void;
  /** Notifica di stato salvataggio (mostrata dalla toolbar) */
  status: "idle" | "saving" | "saved" | "error";
  setStatus: (s: "idle" | "saving" | "saved" | "error") => void;
}

const Ctx = createContext<EditModeState>({
  isAdmin: false,
  editMode: false,
  setEditMode: () => {},
  status: "idle",
  setStatus: () => {},
});

export const useEditMode = () => useContext(Ctx);

/**
 * Avvolge l'intero sito (in layout). Rileva l'admin via /api/admin/me e
 * fornisce lo stato di edit in-place. Per i visitatori normali è del tutto
 * inerte (isAdmin=false → nessuna UI, nessun listener).
 */
export function EditModeProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);
  const [, setEditMode] = useState(false);
  const [status, setStatus] = useState<EditModeState["status"]>("idle");
  // L'editor carica il sito in un <iframe>: lì l'editing è SEMPRE attivo e la
  // toolbar fluttuante non serve (i controlli sono nella chrome dell'editor).
  const [framed, setFramed] = useState(false);

  useEffect(() => {
    try {
      setFramed(window.self !== window.top);
    } catch {
      setFramed(true); // cross-origin → quasi certamente in iframe
    }
    let alive = true;
    fetch("/api/admin/me", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => alive && setIsAdmin(Boolean(d?.admin)))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  // L'editing avviene SOLO dentro l'iframe dell'editor (/admin). Sul sito
  // pubblico standalone non c'è nessun riferimento all'editor, neanche per
  // l'admin: niente toolbar "Modifica sito".
  const insideEditor = framed && !pathname.startsWith("/admin");
  const effectiveEdit = insideEditor && isAdmin;

  const value = useMemo(
    () => ({ isAdmin, editMode: effectiveEdit, setEditMode, status, setStatus }),
    [isAdmin, effectiveEdit, status]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
