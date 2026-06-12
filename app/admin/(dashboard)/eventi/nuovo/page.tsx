import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { EventForm } from "@/components/admin/event-form";
import { FadeIn } from "@/components/motion/fade-in";

export const metadata = { title: "Nuovo evento" };

export default function NewEventPage() {
  return (
    <div>
      <FadeIn>
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Tutti gli eventi
        </Link>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">
          Nuovo evento
        </h1>
        <p className="mt-2 text-muted-foreground">
          Dopo la creazione potrai caricare le foto in blocco.
        </p>
      </FadeIn>
      <FadeIn delay={0.1} className="mt-8">
        <EventForm />
      </FadeIn>
    </div>
  );
}
