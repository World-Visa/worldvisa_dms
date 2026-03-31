"use client";

import { useEffect, useRef, useState } from "react";
import { useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

const POLL_INTERVAL_MS = 2000;
const MAX_ATTEMPTS = 15;

export default function VerifyingPage() {
  const { session } = useClerk();
  const router = useRouter();
  const attemptsRef = useRef(0);
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (!session) return;

    let cancelled = false;

    const poll = async () => {
      if (cancelled) return;

      await session.reload();
      if (cancelled) return;

      const role = session.user?.publicMetadata?.role as string | undefined;

      if (role) {
        router.replace("/");
        return;
      }

      attemptsRef.current += 1;
      if (attemptsRef.current >= MAX_ATTEMPTS) {
        setTimedOut(true);
        return;
      }

      setTimeout(poll, POLL_INTERVAL_MS);
    };

    const timer = setTimeout(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [session, router]);

  if (timedOut) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
        <p className="text-sm text-muted-foreground">
          Account setup is taking longer than expected.
        </p>
        <button
          type="button"
          className="text-sm underline"
          onClick={() => {
            attemptsRef.current = 0;
            setTimedOut(false);
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">Setting up your account…</p>
    </div>
  );
}
