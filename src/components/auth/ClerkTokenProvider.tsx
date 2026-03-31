"use client";

import { useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { setTokenProvider } from "@/lib/getToken";

/**
 * Registers Clerk's getToken with the module-level singleton so that
 * non-React code (fetcher, sockets) can obtain a JWT without hooks.
 *
 * Mount once inside <ClerkProvider> in the root layout.
 * Renders nothing.
 */
export function ClerkTokenProvider() {
  const { getToken } = useAuth();

  useEffect(() => {
    setTokenProvider(getToken);
  }, [getToken]);

  return null;
}
