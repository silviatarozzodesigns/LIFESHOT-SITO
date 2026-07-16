"use client";

/**
 * Link verso una sezione della STESSA pagina: invece di saltarci di colpo,
 * ci scorre con un'animazione.
 *
 * Perché non `scroll-behavior: smooth` su <html>: renderebbe animato anche
 * il salto in cima che il router fa a ogni cambio pagina, e la navigazione
 * sembrerebbe rallentata. Qui l'animazione resta dov'è voluta.
 *
 * Il punto d'arrivo rispetta lo `scroll-mt-*` della sezione, così il titolo
 * non finisce sotto la navbar fissa. Con prefers-reduced-motion salta
 * secco, come si aspetta chi ha chiesto meno animazioni.
 */
export function AnchorLink({
  href,
  className,
  children,
}: {
  /** Ancora della pagina corrente, es. "#lavori" */
  href: `#${string}`;
  className?: string;
  children: React.ReactNode;
}) {
  function handleClick(e: React.MouseEvent<HTMLAnchorElement>) {
    const target = document.getElementById(href.slice(1));
    // Sezione assente (o JS a metà strada): lascia fare al browser
    if (!target) return;
    e.preventDefault();
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    target.scrollIntoView({
      behavior: reduced ? "auto" : "smooth",
      block: "start",
    });
    // L'indirizzo resta condivisibile, senza aggiungere un passo indietro
    history.replaceState(null, "", href);
  }

  return (
    <a href={href} onClick={handleClick} className={className}>
      {children}
    </a>
  );
}
