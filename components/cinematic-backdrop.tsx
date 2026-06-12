/**
 * Sfondo cinematografico full-frame: bagliori radiali fissi dietro
 * l'intera pagina (giallo caldo in alto, blu in basso e a destra).
 * `fixed` + `-z-10`: copre tutto il viewport senza tagli tra le sezioni
 * e resta fermo durante lo scroll, come una scenografia.
 */
export function CinematicBackdrop() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      <div className="glow-primary absolute left-1/2 top-[-22%] h-[65vh] w-[110vw] -translate-x-1/2" />
      <div className="glow-blue absolute bottom-[-28%] left-[-18%] h-[60vh] w-[75vw]" />
      <div className="glow-blue absolute right-[-22%] top-[28%] h-[55vh] w-[65vw] opacity-60" />
    </div>
  );
}
