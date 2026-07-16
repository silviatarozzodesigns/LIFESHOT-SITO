import { getDraftContent } from "@/lib/data/content";
import { CursorStudio } from "@/components/admin/cursori/cursor-studio";
import { FadeIn } from "@/components/motion/fade-in";

export const metadata = { title: "Cursori — Testi dei servizi" };
export const dynamic = "force-dynamic";

/**
 * Sezione CURSORI dell'admin: i testi che compaiono nell'overlay quando un
 * visitatore clicca una pillola-cursore nella hero della homepage.
 */
export default async function AdminCursoriPage() {
  const draft = await getDraftContent();

  return (
    <div>
      <FadeIn>
        <h1 className="text-3xl font-semibold tracking-tight">Cursori</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Le pillole che girano attorno allo slogan della homepage. Cliccandole
          si apre un riquadro che spiega il servizio: qui ne scrivi titolo e
          descrizione. Tutto resta in bozza finché non premi{" "}
          <strong className="font-medium text-foreground">
            Pubblica modifiche
          </strong>
          .
        </p>
      </FadeIn>
      <FadeIn delay={0.1} className="mt-8">
        <CursorStudio initial={draft} />
      </FadeIn>
    </div>
  );
}
