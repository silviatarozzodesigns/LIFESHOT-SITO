"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { deleteEvent } from "@/app/actions/events";
import { Button } from "@/components/ui/button";

interface EventDeleteButtonProps {
  eventId: string;
  eventName: string;
}

export function EventDeleteButton({
  eventId,
  eventName,
}: EventDeleteButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleDelete() {
    const confirmed = window.confirm(
      `Eliminare "${eventName}"?\n\nVerranno cancellate anche tutte le foto dell'evento, sia dal database che dallo storage. L'operazione non è reversibile.`
    );
    if (!confirmed) return;

    startTransition(async () => {
      const result = await deleteEvent(eventId);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex shrink-0 flex-col items-end gap-1">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={`Elimina ${eventName}`}
        className="text-muted-foreground hover:text-destructive"
        disabled={isPending}
        onClick={handleDelete}
      >
        {isPending ? <Loader2 className="animate-spin" /> : <Trash2 />}
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
