export function SiteFooter() {
  return (
    <footer className="border-t border-border/50">
      <div className="container flex h-16 items-center justify-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Lifeshot — Agenzia creativa · Fotografia,
        Video e Grafica
      </div>
    </footer>
  );
}
