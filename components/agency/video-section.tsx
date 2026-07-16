import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { FadeIn } from "@/components/motion/fade-in";
import { VideoPlayer } from "@/components/video/video-player";
import { EditableText } from "@/components/cms/editable-text";
import type { VideoDTO } from "@/lib/data/videos";
import { getText, getTextStyle, type CmsData, type PageSlug } from "@/lib/content";

/**
 * SEZIONE VIDEO DI UNA CATEGORIA — i video (YouTube, Vimeo, clip) caricati
 * dal CMS nella macrocartella di quella categoria. Stesso player della
 * pagina /video, qui in vetrina ridotta con rimando al portfolio completo.
 * Se la categoria non ha video, la sezione non compare affatto.
 */
export function VideoSection({
  content,
  page,
  videos,
}: {
  content: CmsData;
  /** Pagina CMS a cui appartengono i testi della sezione */
  page: PageSlug;
  videos: VideoDTO[];
}) {
  if (videos.length === 0) return null;

  const t = (key: string) => getText(content, page, key);
  const ts = (key: string) => getTextStyle(content, page, key);

  return (
    <section id="video" className="container scroll-mt-24 pt-16 sm:pt-24">
      <FadeIn className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-xl">
          <h2 className="text-3xl font-semibold tracking-tight">
            <EditableText
              page={page}
              k="videos.title"
              value={t("videos.title")}
              maxLength={80}
              style={ts("videos.title")}
            />
          </h2>
          <p className="mt-2 text-muted-foreground">
            <EditableText
              page={page}
              k="videos.subtitle"
              value={t("videos.subtitle")}
              as="span"
              maxLength={200}
              style={ts("videos.subtitle")}
            />
          </p>
        </div>
        <Link
          href="/video"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-primary"
        >
          Tutti i video
          <ArrowRight className="h-4 w-4" />
        </Link>
      </FadeIn>

      <div className="grid gap-8 md:grid-cols-2">
        {videos.map((video, index) => (
          <FadeIn key={video.id} delay={Math.min(index * 0.08, 0.3)}>
            <article>
              <VideoPlayer video={video} />
              <h3 className="mt-3 text-base font-medium tracking-tight">
                {video.title}
              </h3>
              {video.description && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {video.description}
                </p>
              )}
            </article>
          </FadeIn>
        ))}
      </div>
    </section>
  );
}
