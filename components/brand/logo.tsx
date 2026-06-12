import { cn } from "@/lib/utils";

/**
 * ╔══════════════════════════════════════════════════════════╗
 * ║  PLACEHOLDER LOGO LIFESHOT                                ║
 * ║  Sostituire l'SVG qui sotto con il logo ufficiale.       ║
 * ║  Mantenere `currentColor` per supportare chiaro/scuro.   ║
 * ╚══════════════════════════════════════════════════════════╝
 */
export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      {/* ── INIZIO PLACEHOLDER SVG ── */}
      <svg
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-7 w-7"
        aria-hidden
      >
        <rect
          x="2"
          y="6"
          width="28"
          height="20"
          rx="5"
          stroke="currentColor"
          strokeWidth="2.5"
        />
        <circle cx="16" cy="16" r="5.5" stroke="currentColor" strokeWidth="2.5" />
        <circle cx="24.5" cy="11.5" r="1.5" fill="currentColor" />
      </svg>
      {/* ── FINE PLACEHOLDER SVG ── */}
      <span className="text-lg font-semibold tracking-tight">Lifeshot</span>
    </span>
  );
}
