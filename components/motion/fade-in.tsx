"use client";

import { motion, type HTMLMotionProps } from "framer-motion";

/**
 * Micro-interazione di ingresso in stile Apple: fade + leggera salita,
 * easing morbido. Usare per hero, card e sezioni al primo render.
 */
export function FadeIn({
  delay = 0,
  ...props
}: HTMLMotionProps<"div"> & { delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
      {...props}
    />
  );
}
