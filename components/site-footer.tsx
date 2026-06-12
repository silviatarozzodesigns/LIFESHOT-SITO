import { LogoWordmark } from "@/components/brand/logo";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/50">
      <div className="container flex flex-wrap items-center justify-center gap-x-2 gap-y-1 py-6 text-center text-xs leading-relaxed text-muted-foreground">
        <span className="inline-flex items-center gap-2">
          © {new Date().getFullYear()}
          <LogoWordmark className="h-2.5 w-auto text-foreground/80" />
        </span>
        <span>— Agenzia creativa · Fotografia, Video e Grafica</span>
      </div>
    </footer>
  );
}
