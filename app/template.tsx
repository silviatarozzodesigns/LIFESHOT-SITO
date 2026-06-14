/**
 * Template di rotta: Next.js lo RI-MONTA ad ogni navigazione (a differenza
 * del layout), quindi è il punto giusto per l'animazione d'ingresso pagina.
 *
 * IMPORTANTE: usiamo un'animazione CSS (non un transform/filter inline di
 * framer-motion). Un `filter`/`transform` PERSISTENTE su questo wrapper
 * creerebbe un containing block che rompe `position: fixed` dei figli
 * (navbar fissa e menu mobile a tutto schermo). La keyframe CSS senza
 * fill-mode lascia l'elemento "pulito" a fine animazione → fixed di nuovo ok.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="page-enter">{children}</div>;
}
