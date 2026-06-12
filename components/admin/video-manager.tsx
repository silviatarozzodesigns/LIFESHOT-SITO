"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Clapperboard,
  Instagram,
  Link2,
  Loader2,
  Plus,
  Trash2,
  Youtube,
} from "lucide-react";
import { createVideo, deleteVideo } from "@/app/actions/videos";
import type { VideoDTO } from "@/lib/data/videos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const providerLabel: Record<string, string> = {
  youtube: "YouTube",
  vimeo: "Vimeo",
  instagram: "Instagram Reel",
  file: "Micro-clip (file)",
};

function ProviderIcon({ provider }: { provider: string }) {
  if (provider === "youtube") return <Youtube className="h-4 w-4" />;
  if (provider === "instagram") return <Instagram className="h-4 w-4" />;
  if (provider === "file") return <Link2 className="h-4 w-4" />;
  return <Clapperboard className="h-4 w-4" />;
}

/**
 * Gestione video del portfolio: si incolla un link (YouTube, Vimeo,
 * Reel Instagram o .webm) e il provider viene riconosciuto dal server.
 * Zero spazio occupato su R2.
 */
export function VideoManager({ videos }: { videos: VideoDTO[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createVideo({ title, url });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setTitle("");
      setUrl("");
      router.refresh();
    });
  }

  function handleDelete(video: VideoDTO) {
    if (!window.confirm(`Rimuovere "${video.title}" dal portfolio?`)) return;
    startTransition(async () => {
      const result = await deleteVideo(video.id);
      if (result.ok) router.refresh();
      else setError(result.error);
    });
  }

  return (
    <div className="space-y-10">
      {/* Aggiunta per link */}
      <form
        onSubmit={handleAdd}
        className="max-w-2xl space-y-4 rounded-2xl border bg-card p-6"
      >
        <div className="space-y-2">
          <Label htmlFor="video-title">Titolo *</Label>
          <Input
            id="video-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            maxLength={200}
            placeholder="es. Best of — Granfondo 2026"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="video-url">Link del video *</Label>
          <Input
            id="video-url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
            type="url"
            placeholder="https://youtu.be/… · https://www.instagram.com/reel/… · https://…/clip.webm"
          />
          <p className="text-xs text-muted-foreground">
            YouTube e Vimeo → player cinematico custom · Reel Instagram →
            embed nativo · .webm/.mp4 → micro-clip in loop. Nessun file viene
            caricato su R2.
          </p>
        </div>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <Button type="submit" disabled={isPending}>
          {isPending ? <Loader2 className="animate-spin" /> : <Plus />}
          Aggiungi video
        </Button>
      </form>

      {/* Lista */}
      {videos.length > 0 ? (
        <ul className="space-y-3">
          {videos.map((video) => (
            <li
              key={video.id}
              className="flex items-center gap-4 rounded-2xl border bg-card p-4"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                <ProviderIcon provider={video.provider} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium tracking-tight">
                  {video.title}
                </p>
                <p className="truncate text-sm text-muted-foreground">
                  {providerLabel[video.provider] ?? video.provider} ·{" "}
                  {video.url}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Elimina ${video.title}`}
                className="shrink-0 text-muted-foreground hover:text-destructive"
                disabled={isPending}
                onClick={() => handleDelete(video)}
              >
                <Trash2 />
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">
          Nessun video nel portfolio: incolla il primo link qui sopra.
        </p>
      )}
    </div>
  );
}
