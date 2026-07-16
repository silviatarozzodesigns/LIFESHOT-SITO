import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { EventForm } from "@/components/admin/event-form";
import { FadeIn } from "@/components/motion/fade-in";
import type { EventCategory } from "@/models/Event";

export const metadata = { title: "Nuovo evento" };

function isCategory(v: string | undefined): v is EventCategory {
  return v === "motorsport" || v === "ristorazione" || v === "business";
}

export default async function NewEventPage({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string }>;
}) {
  const { categoria } = await searchParams;
  const category: EventCategory = isCategory(categoria)
    ? categoria
    : "motorsport";
  const isProject = category !== "motorsport";

  return (
    <div>
      <FadeIn>
        <Link
          href={`/admin?categoria=${category}`}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          {isProject ? "Tutti i progetti" : "Tutti gli eventi"}
        </Link>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">
          {isProject ? "Nuovo progetto" : "Nuovo evento"}
        </h1>
        <p className="mt-2 text-muted-foreground">
          Dopo la creazione potrai caricare le foto in blocco.
        </p>
      </FadeIn>
      <FadeIn delay={0.1} className="mt-8">
        <EventForm defaultCategory={category} />
      </FadeIn>
    </div>
  );
}
