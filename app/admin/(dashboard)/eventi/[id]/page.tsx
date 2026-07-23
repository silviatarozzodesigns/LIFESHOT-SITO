import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ImageIcon } from "lucide-react";
import { getEventByIdAdmin, getPhotosByEventAdmin } from "@/lib/data/admin";
import { EventForm } from "@/components/admin/event-form";
import { UploadDropzone } from "@/components/admin/upload-dropzone";
import { PhotoAdminGrid } from "@/components/admin/photo-admin-grid";
import { FadeIn } from "@/components/motion/fade-in";

interface EditEventPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: EditEventPageProps) {
  const { id } = await params;
  const event = await getEventByIdAdmin(id);
  return { title: event ? `Modifica — ${event.name}` : "Evento" };
}

export default async function EditEventPage({ params }: EditEventPageProps) {
  const { id } = await params;
  const [event, photos] = await Promise.all([
    getEventByIdAdmin(id),
    getPhotosByEventAdmin(id),
  ]);
  if (!event) notFound();

  return (
    <div className="space-y-12">
      <FadeIn>
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Tutti gli eventi
        </Link>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">
          {event.name}
        </h1>
        <p className="mt-2 text-muted-foreground">
          Modifica i dettagli dell&apos;evento e gestisci le foto.
        </p>
      </FadeIn>

      {/* Bulk upload */}
      <FadeIn delay={0.08}>
        <section>
          <h2 className="text-xl font-semibold tracking-tight">
            Carica foto
          </h2>
          <div className="mt-4">
            <UploadDropzone eventId={event.id} category={event.category} />
          </div>
        </section>
      </FadeIn>

      {/* Foto caricate */}
      <FadeIn delay={0.12}>
        <section>
          <h2 className="flex items-center gap-2 text-xl font-semibold tracking-tight">
            <ImageIcon className="h-5 w-5" />
            Foto dell&apos;evento
            <span className="text-base font-normal text-muted-foreground">
              ({photos.length})
            </span>
          </h2>
          <PhotoAdminGrid
            photos={photos}
            category={event.category}
            sortable
            orderScope="event"
          />
        </section>
      </FadeIn>

      {/* Dettagli evento */}
      <FadeIn delay={0.16}>
        <section>
          <h2 className="text-xl font-semibold tracking-tight">
            Dettagli evento
          </h2>
          <div className="mt-4">
            {/* key = id evento: rimonta il form quando cambi evento, così lo
                stato locale (categoria, opzioni menù) non resta "fotografato"
                dall'evento precedente e non riscrive la categoria al salvataggio. */}
            <EventForm key={event.id} event={event} />
          </div>
        </section>
      </FadeIn>
    </div>
  );
}
