"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { EditToolbar } from "@/components/cms/edit-toolbar";

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
  const [isAdmin, setIsAdmin] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [status, setStatus] = useState<EditModeState["status"]>("idle");

  useEffect(() => {
    let alive = true;
    fetch("/api/admin/me", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => alive && setIsAdmin(Boolean(d?.admin)))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const value = useMemo(
    () => ({ isAdmin, editMode, setEditMode, status, setStatus }),
    [isAdmin, editMode, status]
  );

  return (
    <Ctx.Provider value={value}>
      {children}
      {isAdmin && <EditToolbar />}
    </Ctx.Provider>
  );
}
