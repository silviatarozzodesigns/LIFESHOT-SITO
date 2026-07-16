import { getDraftContent } from "@/lib/data/content";
import { VisualStudio } from "@/components/admin/studio/visual-studio";
import { FadeIn } from "@/components/motion/fade-in";

export const metadata = { title: "Editor — Testi, spaziature e SEO" };

export default async function AdminContentPage() {
  const draft = await getDraftContent();

  return (
    <div>
      <FadeIn>
        <h1 className="text-3xl font-semibold tracking-tight">
          Editor
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Clicca i testi direttamente nell&apos;anteprima per modificarli,
          regola spaziature e SEO dalla sidebar. Gli sfondi e gli overlay
          delle hero si gestiscono dalla sezione Hero. Tutto resta in bozza
          finché non premi{" "}
          <strong className="font-medium text-foreground">
            Pubblica modifiche
          </strong>
          .
        </p>
      </FadeIn>
      <FadeIn delay={0.1} className="mt-8">
        <VisualStudio initial={draft} />
      </FadeIn>
    </div>
  );
}
