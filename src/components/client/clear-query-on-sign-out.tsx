"use client";

import { useAuth } from "@clerk/nextjs";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";

/** Clears React Query cache when the client session ends (parity with previous header logout). */
export function ClientQueryClearOnSignOut() {
  const { isSignedIn } = useAuth();
  const queryClient = useQueryClient();
  const prevSignedIn = useRef(isSignedIn);

  useEffect(() => {
    if (prevSignedIn.current === true && isSignedIn === false) {
      queryClient.clear();
    }
    prevSignedIn.current = isSignedIn;
  }, [isSignedIn, queryClient]);

  return null;
}
