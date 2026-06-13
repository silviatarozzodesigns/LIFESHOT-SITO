"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  CloudUpload,
  Droplet,
  Hash,
  Loader2,
  TriangleAlert,
} from "lucide-react";
import { extractRaceNumber } from "@/lib/parse-filename";
import { uploadFile, MAX_UPLOAD_BYTES } from "@/lib/upload-client";
import { cn } from "@/lib/utils";

type UploadStatus = "pending" | "uploading" | "done" | "error";

interface QueueItem {
  id: string;
  file: File;
  raceNumber: string | null;
  status: UploadStatus;
  error?: string;
}

const CONCURRENCY = 3;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/avif"];

/**
 * Bulk upload drag-and-drop.
 *
 * Il numero di gara viene mostrato in anteprima appena i file entrano in
 * coda (stessa logica del backend: lib/parse-filename.ts), poi confermato
 * dal server al termine dell'upload. I file salgono in parallelo (max 3)
 * verso /api/admin/upload.
 */
export function UploadDropzone({
  eventId,
  featured = false,
}: {
  eventId: string;
  /** Se true, le foto caricate entrano in "Dietro l'obiettivo" (featured) */
  featured?: boolean;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [watermark, setWatermark] = useState(true);
  // Ref letto dentro pump() per evitare closure stantie durante gli upload
  const watermarkRef = useRef(true);
  const activeUploads = useRef(0);
  const pendingItems = useRef<QueueItem[]>([]);

  const setItemState = useCallback(
    (id: string, patch: Partial<QueueItem>) => {
      setQueue((current) =>
        current.map((item) => (item.id === id ? { ...item, ...patch } : item))
      );
    },
    []
  );

  const pump = useCallback(() => {
    while (activeUploads.current < CONCURRENCY && pendingItems.current.length) {
      const item = pendingItems.current.shift()!;
      activeUploads.current += 1;
      setItemState(item.id, { status: "uploading" });

      uploadFile(eventId, item.file, "photo", {
        watermark: watermarkRef.current,
        featured,
      })
        .then((photo) => {
          setItemState(item.id, {
            status: "done",
            raceNumber: photo.raceNumber ?? item.raceNumber,
          });
        })
        .catch((error: Error) => {
          setItemState(item.id, { status: "error", error: error.message });
        })
        .finally(() => {
          activeUploads.current -= 1;
          if (pendingItems.current.length) {
            pump();
          } else if (activeUploads.current === 0) {
            // Coda esaurita: aggiorna la griglia foto della pagina
            router.refresh();
          }
        });
    }
  }, [eventId, featured, router, setItemState]);

  const enqueue = useCallback(
    (files: FileList | File[]) => {
      const items: QueueItem[] = Array.from(files)
        .filter(
          (file) =>
            ACCEPTED.includes(file.type) && file.size <= MAX_UPLOAD_BYTES
        )
        .map((file) => ({
          id: `${file.name}-${file.size}-${crypto.randomUUID()}`,
          file,
          raceNumber: extractRaceNumber(file.name),
          status: "pending" as const,
        }));
      if (!items.length) return;
      setQueue((current) => [...current, ...items]);
      pendingItems.current.push(...items);
      pump();
    },
    [pump]
  );

  const doneCount = queue.filter((i) => i.status === "done").length;
  const errorCount = queue.filter((i) => i.status === "error").length;
  const isWorking = queue.some(
    (i) => i.status === "pending" || i.status === "uploading"
  );

  return (
    <div>
      {/* Toggle filigrana: decide per QUESTI upload se imprimere il watermark */}
      <label
        htmlFor="wm-upload-toggle"
        className="mb-4 flex cursor-pointer items-center justify-between gap-3 rounded-2xl border bg-card px-4 py-3"
      >
        <span className="flex items-center gap-2.5">
          <Droplet
            className={cn(
              "h-4 w-4",
              watermark ? "text-primary" : "text-muted-foreground"
            )}
          />
          <span>
            <span className="block text-sm font-medium">
              Applica la filigrana a queste foto
            </span>
            <span className="block text-xs text-muted-foreground">
              Disattiva per caricare scatti senza watermark.
            </span>
          </span>
        </span>
        <button
          id="wm-upload-toggle"
          type="button"
          role="switch"
          aria-checked={watermark}
          onClick={() => {
            const next = !watermark;
            setWatermark(next);
            watermarkRef.current = next;
          }}
          className={cn(
            "relative h-6 w-11 shrink-0 rounded-full transition-colors",
            watermark ? "bg-primary" : "bg-muted-foreground/30"
          )}
        >
          <span
            className={cn(
              "absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform",
              watermark ? "translate-x-[1.4rem]" : "translate-x-0.5"
            )}
          />
        </button>
      </label>

      {/* Area drag-and-drop */}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          enqueue(e.dataTransfer.files);
        }}
        className={cn(
          "flex w-full flex-col items-center gap-3 rounded-2xl border-2 border-dashed px-6 py-14 text-center transition-all duration-300",
          "hover:border-primary/50 hover:bg-primary/5",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          isDragging
            ? "scale-[1.01] border-primary bg-primary/10 shadow-[0_0_50px_-12px_hsl(var(--primary)/0.4)]"
            : "border-border"
        )}
      >
        <CloudUpload
          className={cn(
            "h-8 w-8 transition-colors",
            isDragging ? "text-primary" : "text-muted-foreground"
          )}
        />
        <div>
          <p className="font-medium">
            Trascina qui le foto, o clicca per selezionarle
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            JPG, PNG, WebP o AVIF · fino a 5 GB per file · il numero di gara
            viene letto dal nome file (es.{" "}
            <code className="rounded bg-secondary px-1.5 py-0.5 text-xs">
              evento_45_01.jpg
            </code>{" "}
            → #45)
          </p>
        </div>
      </button>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ACCEPTED.join(",")}
        className="hidden"
        onChange={(e) => {
          if (e.target.files) enqueue(e.target.files);
          e.target.value = "";
        }}
      />

      {/* Coda upload */}
      {queue.length > 0 && (
        <div className="mt-6">
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {isWorking
              ? `Caricamento ${doneCount + errorCount + 1} di ${queue.length}…`
              : errorCount
                ? `Completato: ${doneCount} caricate, ${errorCount} con errori.`
                : `Completato: ${doneCount} foto caricate.`}
          </p>
          <ul className="mt-3 max-h-72 space-y-1.5 overflow-y-auto pr-1">
            {queue.map((item) => (
              <li
                key={item.id}
                className="flex items-center gap-3 rounded-xl border bg-card px-4 py-2.5 text-sm"
              >
                {item.status === "done" && (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                )}
                {item.status === "error" && (
                  <TriangleAlert className="h-4 w-4 shrink-0 text-destructive" />
                )}
                {item.status === "uploading" && (
                  <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />
                )}
                {item.status === "pending" && (
                  <span className="h-4 w-4 shrink-0 rounded-full border border-dashed" />
                )}

                <span className="min-w-0 flex-1 truncate">
                  {item.file.name}
                </span>

                {item.status === "error" ? (
                  <span className="shrink-0 text-xs text-destructive">
                    {item.error}
                  </span>
                ) : (
                  <span
                    className={cn(
                      "inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                      item.raceNumber
                        ? "bg-primary/15 text-primary"
                        : "text-muted-foreground"
                    )}
                  >
                    {item.raceNumber ? (
                      <>
                        <Hash className="h-3 w-3" />
                        {item.raceNumber}
                      </>
                    ) : (
                      "senza numero"
                    )}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
