export function SiteFooter() {
  return (
    <footer className="border-t border-border/50">
      <div className="container flex h-16 items-center justify-center gap-2 text-xs text-muted-foreground">
        © {new Date().getFullYear()}{" "}
        <span className="font-semibold tracking-[0.18em] text-foreground/80">
          LIFESHOT
        </span>{" "}
        — Agenzia creativa · Fotografia, Video e Grafica
      </div>
    </footer>
  );
}
