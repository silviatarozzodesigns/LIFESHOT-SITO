import type { Metadata } from "next";
import { Clapperboard, Instagram } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { FadeIn } from "@/components/motion/fade-in";
import { VideoPlayer } from "@/components/video/video-player";
import { getPublishedVideos } from "@/lib/data/videos";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Video",
  description:
    "Il portfolio video di Lifeshot: montaggi delle gare, reel e clip cinematiche.",
};

export const dynamic = "force-dynamic";

export default async function VideoPage() {
  const videos = await getPublishedVideos();

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />

      <main className="container flex-1 py-12 sm:py-16">
        <FadeIn>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">
            Portfolio
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
            Video
          </h1>
          <p className="mt-3 max-w-xl text-muted-foreground">
            Montaggi delle gare, reel e clip cinematiche firmate Lifeshot.
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
                  {/* C.T.A. per ogni video */}
                  <a
                    href={site.instagramDmUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-primary transition-opacity hover:opacity-80"
                  >
                    <Instagram className="h-4 w-4" />
                    Vuoi un video personalizzato o una clip della tua prossima
                    gara? Contattaci in DM!
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
