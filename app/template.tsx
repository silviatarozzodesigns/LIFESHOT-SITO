"use client";

import { usePathname } from "next/navigation";

/**
 * Animazione d'ingresso pagina (dissolvenza + sfocatura, vedi `.page-enter`
 * in globals.css).
 *
 * `key={pathname}`: senza, React riusa lo stesso <div> fra una rotta e
 * l'altra cambiando solo i figli, e una keyframe CSS riparte solo quando
 * l'elemento viene CREATO — così la dissolvenza mancava in tutte le
 * navigazioni interne allo stesso ramo (es. progetto → /ristorazione).
 * Con la chiave legata al percorso il nodo è nuovo ogni volta, quindi
 * l'animazione parte sempre. La chiave ignora hash e query: le ancore
 * della stessa pagina e i filtri della galleria non devono ri-dissolvere.
 *
 * IMPORTANTE: l'animazione è CSS, non un transform/filter inline di
 * framer-motion. Un `filter` PERSISTENTE qui creerebbe un containing block
 * che rompe `position: fixed` dei figli (navbar e menu a tutto schermo).
 * La keyframe senza fill-mode lascia l'elemento pulito a fine corsa.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div key={pathname} className="page-enter">
      {children}
    </div>
  );
}
