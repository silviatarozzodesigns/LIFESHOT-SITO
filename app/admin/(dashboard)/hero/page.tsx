import { getDraftContent } from "@/lib/data/content";
import { HeroStudio } from "@/components/admin/hero/hero-studio";
import { FadeIn } from "@/components/motion/fade-in";

export const metadata = { title: "Hero — Sfondi & Overlay" };
export const dynamic = "force-dynamic";

/**
 * Sezione HERO dell'admin: sfondi e overlay 3D delle hero di Motorsport,
 * Ristorazione e Business, per ogni dispositivo (computer, tablet
 * verticale/orizzontale, mobile) con inquadratura e zoom.
 */
export default async function AdminHeroPage() {
  const draft = await getDraftContent();

  return (
    <div>
      <FadeIn>
        <h1 className="text-3xl font-semibold tracking-tight">Hero</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Sfondi e soggetti in overlay delle hero 3D, per ogni categoria e
          dispositivo. Tutto resta in bozza finché non premi{" "}
          <strong className="font-medium text-foreground">
            Pubblica modifiche
          </strong>
          .
        </p>
      </FadeIn>
      <FadeIn delay={0.1} className="mt-8">
        <HeroStudio initial={draft} />
      </FadeIn>
    </div>
  );
}
