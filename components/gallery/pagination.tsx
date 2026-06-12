import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

interface GalleryPaginationProps {
  page: number;
  totalPages: number;
  /** Parametri filtro correnti da preservare nei link di pagina */
  searchParams: { evento?: string; numero?: string; pilota?: string };
}

function pageHref(
  page: number,
  { evento, numero, pilota }: GalleryPaginationProps["searchParams"]
) {
  const params = new URLSearchParams();
  if (evento) params.set("evento", evento);
  if (numero) params.set("numero", numero);
  if (pilota) params.set("pilota", pilota);
  if (page > 1) params.set("pagina", String(page));
  const query = params.toString();
  return `/galleria${query ? `?${query}` : ""}`;
}

export function GalleryPagination({
  page,
  totalPages,
  searchParams,
}: GalleryPaginationProps) {
  if (totalPages <= 1) return null;

  const prevDisabled = page <= 1;
  const nextDisabled = page >= totalPages;

  return (
    <nav
      aria-label="Paginazione galleria"
      className="flex items-center justify-center gap-4 pt-4"
    >
      <Link
        href={pageHref(page - 1, searchParams)}
        aria-disabled={prevDisabled}
        tabIndex={prevDisabled ? -1 : undefined}
        className={cn(
          buttonVariants({ variant: "outline", size: "icon" }),
          prevDisabled && "pointer-events-none opacity-40"
        )}
      >
        <ChevronLeft />
        <span className="sr-only">Pagina precedente</span>
      </Link>

      <span className="text-sm tabular-nums text-muted-foreground">
        Pagina {page} di {totalPages}
      </span>

      <Link
        href={pageHref(page + 1, searchParams)}
        aria-disabled={nextDisabled}
        tabIndex={nextDisabled ? -1 : undefined}
        className={cn(
          buttonVariants({ variant: "outline", size: "icon" }),
          nextDisabled && "pointer-events-none opacity-40"
        )}
      >
        <ChevronRight />
        <span className="sr-only">Pagina successiva</span>
      </Link>
    </nav>
  );
}
