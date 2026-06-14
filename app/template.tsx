"use client";

import { motion } from "framer-motion";

/**
 * Template di rotta: Next.js lo RI-MONTA ad ogni navigazione (a differenza
 * del layout), quindi è il punto giusto per l'animazione d'ingresso pagina.
 * Effetto fade-in + sfocatura progressiva → nessun caricamento "a scatto"
 * quando si torna in homepage o si cambia sezione.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, filter: "blur(14px)" }}
      animate={{ opacity: 1, filter: "blur(0px)" }}
      transition={{ duration: 0.55, ease: [0.22, 0.61, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
