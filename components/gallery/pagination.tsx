import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { galleryHref } from "@/lib/gallery-url";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

interface GalleryPaginationProps {
  page: number;
  totalPages: number;
  /** Filtri correnti da preservare nei link di pagina */
  filtri: { evento?: string; numero?: string; pilota?: string };
}

export function GalleryPagination({
  page,
  totalPages,
  filtri,
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
        href={galleryHref({ ...filtri, pagina: page - 1 })}
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
        href={galleryHref({ ...filtri, pagina: page + 1 })}
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
