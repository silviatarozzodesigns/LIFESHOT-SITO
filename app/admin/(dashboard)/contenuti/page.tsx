import { getDraftContent } from "@/lib/data/content";
import { ContentStudio } from "@/components/admin/content-studio";
import { FadeIn } from "@/components/motion/fade-in";

export const metadata = { title: "Contenuti del sito" };

export default async function AdminContentPage() {
  const draft = await getDraftContent();

  return (
    <div>
      <FadeIn>
        <h1 className="text-3xl font-semibold tracking-tight">Contenuti</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Modifica testi, SEO e spaziature con anteprima in tempo reale. Le
          modifiche restano in bozza finché non premi{" "}
          <strong className="font-medium text-foreground">
            Salva e pubblica
          </strong>
          .
        </p>
      </FadeIn>
      <FadeIn delay={0.1} className="mt-8">
        <ContentStudio initial={draft} />
      </FadeIn>
    </div>
  );
}
