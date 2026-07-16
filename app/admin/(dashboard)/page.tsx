import Image from "next/image";
import Link from "next/link";
import { Calendar, Camera, ImageIcon, MapPin, Plus } from "lucide-react";
import { getAllEventsAdmin } from "@/lib/data/admin";
import type { EventCategory } from "@/models/Event";
import { formatDate } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { EventDeleteButton } from "@/components/admin/event-delete-button";
import { FadeIn } from "@/components/motion/fade-in";
import { cn } from "@/lib/utils";

export const metadata = { title: "Gestione eventi" };
export const dynamic = "force-dynamic";

/** Le 3 macrocartelle EVENTI */
const FOLDERS: Array<{ id: EventCategory; label: string; hint: string }> = [
  {
    id: "motorsport",
    label: "Motorsport",
    hint: "Gli eventi in pista, con ricerca per numero di gara.",
  },
  {
    id: "ristorazione",
    label: "Ristorazione",
    hint: "I progetti mostrati in “Progetti recenti” su /ristorazione.",
  },
  {
    id: "business",
    label: "Business",
    hint: "I progetti mostrati in “Progetti recenti” su /business.",
  },
];

function isCategory(v: string | undefined): v is EventCategory {
  return v === "motorsport" || v === "ristorazione" || v === "business";
}

export default async function AdminEventsPage({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string }>;
}) {
  const { categoria } = await searchParams;
  const active: EventCategory = isCategory(categoria) ? categoria : "motorsport";
  const events = await getAllEventsAdmin(active);
  const folder = FOLDERS.find((f) => f.id === active)!;

  return (
    <div>
      <FadeIn className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Eventi</h1>
          <p className="mt-2 text-muted-foreground">
            Crea un evento o un progetto, poi aprilo per caricare le foto in
            blocco.
          </p>
        </div>
        <Link
          href={`/admin/eventi/nuovo?categoria=${active}`}
          className={buttonVariants()}
        >
          <Plus />
          {active === "motorsport" ? "Nuovo evento" : "Nuovo progetto"}
        </Link>
      </FadeIn>

      {/* Macrocartelle per categoria */}
      <FadeIn delay={0.05} className="mt-6">
        <div className="flex w-fit items-center gap-1 rounded-full border bg-card p-1">
          {FOLDERS.map((f) => (
            <Link
              key={f.id}
              href={`/admin?categoria=${f.id}`}
              className={cn(
                "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                active === f.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {f.label}
            </Link>
          ))}
        </div>
        <p className="mt-2 text-sm text-muted-foreground">{folder.hint}</p>
      </FadeIn>

      {events.length > 0 ? (
        <ul className="mt-8 space-y-3">
          {events.map((event, index) => (
            <FadeIn key={event.id} delay={Math.min(index * 0.05, 0.3)}>
              <li className="flex items-center gap-4 rounded-2xl border bg-card p-4 transition-colors hover:border-foreground/20">
                <Link
                  href={`/admin/eventi/${event.id}`}
                  className="flex min-w-0 flex-1 items-center gap-4"
                >
                  <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-muted">
                    {event.coverImage ? (
                      <Image
                        src={event.coverImage}
                        alt=""
                        fill
                        sizes="96px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <Camera className="h-5 w-5 text-muted-foreground/50" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 font-medium tracking-tight">
                      <span className="truncate">{event.name}</span>
                      {!event.published && (
                        <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
                          Bozza
                        </span>
                      )}
                    </p>
                    <p className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-sm text-muted-foreground">
                      {event.date && (
                        <span className="inline-flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5" />
                          {formatDate(event.date)}
                        </span>
                      )}
                      {event.location && (
                        <span className="inline-flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5" />
                          {event.location}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1.5">
                        <ImageIcon className="h-3.5 w-3.5" />
                        {event.photoCount} foto
                      </span>
                    </p>
                  </div>
                </Link>
                <EventDeleteButton eventId={event.id} eventName={event.name} />
              </li>
            </FadeIn>
          ))}
        </ul>
      ) : (
        <FadeIn
          delay={0.1}
          className="mt-8 flex flex-col items-center gap-3 rounded-2xl border border-dashed py-20 text-center"
        >
          <Camera className="h-8 w-8 text-muted-foreground" />
          <p className="font-medium">
            {active === "motorsport" ? "Nessun evento" : "Nessun progetto"}
          </p>
          <p className="text-sm text-muted-foreground">
            {active === "motorsport"
              ? "Crea il primo evento per iniziare a caricare le foto."
              : "Crea il primo progetto: apparirà tra i Progetti recenti della pagina."}
          </p>
        </FadeIn>
      )}
    </div>
  );
}
