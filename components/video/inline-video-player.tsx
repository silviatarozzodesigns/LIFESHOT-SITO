"use client";

import { useRef, useState } from "react";
import { Pause, Play, Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";

interface InlineVideoPlayerProps {
  /** URL diretto del file video (.mp4/.webm) — R2, Vercel Blob, Cloudinary… */
  src: string;
  title?: string;
  /** Frame di copertina mostrato prima del caricamento */
  poster?: string;
  /** Parte da solo (muto, requisito dei browser mobile) */
  autoPlay?: boolean;
  className?: string;
}

/**
 * Player video inline ad alto impatto: riempie il 100% del contenitore
 * con effetto cover (niente bande nere), si riproduce direttamente sul
 * sito senza redirect né loghi di terze parti.
 *
 * - `playsInline` + partenza muta → autoplay affidabile anche su iOS
 * - loop continuo, ideale per clip di background e anteprime
 * - overlay minimale: tap/click per play-pausa, bottone volume in basso
 *   a destra; i controlli appaiono in hover (desktop) o al tocco (mobile)
 */
export function InlineVideoPlayer({
  src,
  title,
  poster,
  autoPlay = true,
  className,
}: InlineVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(autoPlay);
  const [muted, setMuted] = useState(true);

  function togglePlay() {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) void video.play();
    else video.pause();
  }

  function toggleMute(e: React.MouseEvent) {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setMuted(video.muted);
  }

  return (
    <div
      onClick={togglePlay}
      role="button"
      tabIndex={0}
      aria-label={title ? `Video: ${title}` : "Video"}
      onKeyDown={(e) => {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          togglePlay();
        }
      }}
      className={cn(
        "group relative h-full w-full cursor-pointer overflow-hidden bg-black",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className
      )}
    >
      {/* Cover: riempie tutto il contenitore senza bande nere */}
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        autoPlay={autoPlay}
        muted
        loop
        playsInline
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        className="absolute inset-0 h-full w-full object-cover"
      />

      {/* Velo sfumato per la leggibilità dei controlli */}
      <div
        className={cn(
          "pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent transition-opacity duration-300",
          playing ? "opacity-0 group-hover:opacity-100" : "opacity-100"
        )}
      />

      {/* Play/Pausa centrale */}
      <span
        className={cn(
          "absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_0_40px_-8px_hsl(var(--primary)/0.8)] transition-all duration-300",
          playing
            ? "scale-75 opacity-0 group-hover:scale-100 group-hover:opacity-100"
            : "scale-100 opacity-100"
        )}
        aria-hidden
      >
        {playing ? (
          <Pause className="h-6 w-6 fill-current" />
        ) : (
          <Play className="ml-1 h-6 w-6 fill-current" />
        )}
      </span>

      {/* Volume */}
      <button
        type="button"
        onClick={toggleMute}
        aria-label={muted ? "Attiva audio" : "Disattiva audio"}
        className={cn(
          "absolute bottom-3 right-3 flex h-10 w-10 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-sm transition-all duration-300 hover:bg-black/75",
          playing ? "opacity-0 group-hover:opacity-100" : "opacity-100"
        )}
      >
        {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
      </button>
    </div>
  );
}
