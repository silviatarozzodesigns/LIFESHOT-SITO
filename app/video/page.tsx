import type { Metadata } from "next";
import { Clapperboard, Instagram } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { FadeIn } from "@/components/motion/fade-in";
import { VideoPlayer } from "@/components/video/video-player";
import { getPublishedVideos } from "@/lib/data/videos";
import { getPublishedContent } from "@/lib/data/content";
import { getSpacingClass, getText } from "@/lib/content";
import { site } from "@/lib/site";
import { cn } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const { seo } = (await getPublishedContent()).pages.video;
  return {
    title: { absolute: seo.metaTitle },
    description: seo.metaDescription,
    openGraph: {
      title: seo.metaTitle,
      description: seo.metaDescription,
      ...(seo.ogImage ? { images: [seo.ogImage] } : {}),
    },
  };
}

export const dynamic = "force-dynamic";

export default async function VideoPage() {
  const [videos, content] = await Promise.all([
    getPublishedVideos(),
    getPublishedContent(),
  ]);
  const t = (key: string) => getText(content, "video", key);

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />

      <main
        className={cn(
          "container flex-1",
          getSpacingClass(content, "video", "header")
        )}
      >
        <FadeIn>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">
            {t("header.eyebrow")}
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
            {t("header.title")}
          </h1>
          <p className="mt-3 max-w-xl text-muted-foreground">
            {t("header.subtitle")}
          </p>
        </FadeIn>

        {videos.length > 0 ? (
          <div className="mt-12 grid gap-10 md:grid-cols-2">
            {videos.map((video, index) => (
              <FadeIn key={video.id} delay={Math.min(index * 0.08, 0.4)}>
                <article>
                  <VideoPlayer video={video} />
                  <h2 className="mt-4 text-lg font-semibold tracking-tight">
                    {video.title}
                  </h2>
                  {video.description && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {video.description}
                    </p>
                  )}
                  {/* C.T.A. per ogni video: testo + bottone DM (stile sito) */}
                  <p className="mt-3 text-sm text-muted-foreground">
                    {t("cta.label")}
                  </p>
                  <a
                    href={site.instagramDmUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group mt-4 inline-flex items-center gap-2.5 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:scale-[1.03] hover:shadow-primary/40 active:scale-95"
                  >
                    <Instagram className="h-6 w-6 transition-transform group-hover:rotate-[8deg]" />
                    Contattaci in DM
                  </a>
                </article>
              </FadeIn>
            ))}
          </div>
        ) : (
          <FadeIn
            delay={0.15}
            className="mt-12 flex flex-col items-center gap-4 rounded-2xl border border-dashed py-24 text-center"
          >
            <Clapperboard className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="font-medium">Il portfolio video sta arrivando</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Nel frattempo trovi i nostri reel su{" "}
                <a
                  href={site.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-primary hover:opacity-80"
                >
                  Instagram
                </a>
                .
              </p>
            </div>
          </FadeIn>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
