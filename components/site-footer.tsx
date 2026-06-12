import { LogoWordmark } from "@/components/brand/logo";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/50">
      <div className="container flex h-16 items-center justify-center gap-2 text-xs text-muted-foreground">
        © {new Date().getFullYear()}
        <LogoWordmark className="h-2.5 w-auto text-foreground/80" />
        — Agenzia creativa · Fotografia, Video e Grafica
      </div>
    </footer>
  );
}
