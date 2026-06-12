"use client";

import { useActionState } from "react";
import { Loader2, LockKeyhole } from "lucide-react";
import { login } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(login, null);

  return (
    <form action={formAction} className="mt-8 space-y-4">
      <Input
        type="password"
        name="password"
        placeholder="Password"
        autoFocus
        required
        autoComplete="current-password"
        aria-label="Password amministratore"
      />
      {state?.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}
      <Button type="submit" size="lg" className="w-full" disabled={isPending}>
        {isPending ? <Loader2 className="animate-spin" /> : <LockKeyhole />}
        Accedi
      </Button>
    </form>
  );
}
