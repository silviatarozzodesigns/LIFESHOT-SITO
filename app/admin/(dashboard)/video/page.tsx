import Link from "next/link";
import { getAllVideosAdmin } from "@/lib/data/videos";
import { VideoManager } from "@/components/admin/video-manager";
import { FadeIn } from "@/components/motion/fade-in";
import type { EventCategory } from "@/models/Event";
import { cn } from "@/lib/utils";

export const metadata = { title: "Gestione video" };
export const dynamic = "force-dynamic";

/** Le 3 macrocartelle VIDEO, come in Eventi e Gallery */
const FOLDERS: Array<{ id: EventCategory; label: string; where: string }> = [
  {
    id: "motorsport",
    label: "Motorsport",
    where: "nella sezione video della pagina Motorsport",
  },
  {
    id: "ristorazione",
    label: "Ristorazione",
    where: "nella sezione video di /ristorazione",
  },
  { id: "business", label: "Business", where: "nella sezione video di /business" },
];

function isCategory(v: string | undefined): v is EventCategory {
  return v === "motorsport" || v === "ristorazione" || v === "business";
}

export default async function AdminVideoPage({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string }>;
}) {
  const { categoria } = await searchParams;
  const active: EventCategory = isCategory(categoria) ? categoria : "motorsport";
  const [videos, folder] = [
    await getAllVideosAdmin(active),
    FOLDERS.find((f) => f.id === active)!,
  ];

  return (
    <div>
      <FadeIn>
        <h1 className="text-3xl font-semibold tracking-tight">Video</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Incolla un link YouTube (o carica una clip): i video di questa
          cartella compaiono {folder.where} e nella pagina /video.
        </p>
      </FadeIn>

      {/* Macrocartelle per categoria */}
      <FadeIn delay={0.05} className="mt-6">
        <div className="flex w-fit max-w-full flex-wrap items-center gap-1 rounded-full border bg-card p-1">
          {FOLDERS.map((f) => (
            <Link
              key={f.id}
              href={`/admin/video?categoria=${f.id}`}
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
      </FadeIn>

      <FadeIn delay={0.1} className="mt-8">
        <VideoManager videos={videos} category={active} />
      </FadeIn>
    </div>
  );
}
