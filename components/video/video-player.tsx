"use client";

import { useState } from "react";
import Image from "next/image";
import { Play } from "lucide-react";
import type { VideoDTO } from "@/lib/data/videos";
import { InstagramEmbed } from "@/components/video/instagram-embed";
import { InlineVideoPlayer } from "@/components/video/inline-video-player";
import { cn } from "@/lib/utils";

/**
 * Player adattivo del portfolio:
 * - Instagram Reel → embed nativo (iframe instagram.com/.../embed)
 * - YouTube → player "lite" custom: thumbnail + play giallo; l'iframe
 *   (youtube-nocookie, modestbranding) si carica solo al click — niente
 *   loghi invasivi né JS di terze parti finché non serve
 * - Vimeo → player minimale (senza titolo/byline/ritratto, accento giallo)
 * - File .webm/.mp4 → micro-clip locale in loop, utilizzabile anche come
 *   sfondo dinamico o anteprima animata
 */
export function VideoPlayer({ video }: { video: VideoDTO }) {
  const [activated, setActivated] = useState(false);

  if (video.provider === "instagram") {
    return <InstagramEmbed shortcode={video.embedId} title={video.title} />;
  }

  if (video.provider === "vimeo") {
    return (
      <div className="overflow-hidden rounded-2xl bg-black">
        <iframe
          src={`https://player.vimeo.com/video/${video.embedId}?title=0&byline=0&portrait=0&dnt=1&color=fbbf24`}
          title={video.title}
          className="aspect-video w-full border-0"
          loading="lazy"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  if (video.provider === "file") {
    // File .mp4/.webm diretto (R2, Vercel Blob, Cloudinary…): player
    // inline custom, full-width con effetto cover, senza loghi esterni
    return (
      <div className="aspect-video w-full overflow-hidden rounded-2xl">
        <InlineVideoPlayer src={video.embedId} title={video.title} />
      </div>
    );
  }

  // YouTube — lite player custom
  if (activated) {
    return (
      <div className="overflow-hidden rounded-2xl bg-black">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${video.embedId}?autoplay=1&rel=0&modestbranding=1&color=white`}
          title={video.title}
          className="aspect-video w-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setActivated(true)}
      aria-label={`Riproduci: ${video.title}`}
      className={cn(
        "group relative block aspect-video w-full overflow-hidden rounded-2xl bg-black",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      )}
    >
      <Image
        src={`https://i.ytimg.com/vi/${video.embedId}/hqdefault.jpg`}
        alt={video.title}
        fill
        unoptimized
        sizes="(max-width: 768px) 100vw, 50vw"
        className="object-cover opacity-80 transition-all duration-700 group-hover:scale-[1.04] group-hover:opacity-100"
      />
      <span className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
      <span className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_0_40px_-8px_hsl(var(--primary)/0.8)] transition-transform duration-300 group-hover:scale-110">
        <Play className="ml-1 h-6 w-6 fill-current" />
      </span>
    </button>
  );
}
