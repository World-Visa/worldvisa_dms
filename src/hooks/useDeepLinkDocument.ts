"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { Document } from "@/types/applications";

interface UseDeepLinkDocumentOptions {
  allDocuments: Document[] | undefined;
  documents: Document[] | undefined;
}

interface UseDeepLinkDocumentReturn {
  deepLinkDoc: Document | null;
  clearDeepLinkDoc: () => void;
}

/**
 * Resolves a ?documentId= URL param into the matching Document object and
 * opens it in a sheet. The URL param is removed immediately to prevent
 * oscillation on same-page navigation.
 */
export function useDeepLinkDocument({
  allDocuments,
  documents,
}: UseDeepLinkDocumentOptions): UseDeepLinkDocumentReturn {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const rawDocId = searchParams.get("documentId");
  const [targetDocId, setTargetDocId] = useState<string | null>(null);
  const [deepLinkDoc, setDeepLinkDoc] = useState<Document | null>(null);

  // Phase 1: capture the URL param into state and immediately clean the URL.
  // This prevents URL oscillation from canceling the sheet open on same-page navigation.
  useEffect(() => {
    if (!rawDocId) return;
    setTargetDocId(rawDocId);
    router.replace(pathname, { scroll: false });
  }, [rawDocId, pathname, router]);

  // Phase 2: once we have a captured ID and documents are loaded, find and open the sheet.
  useEffect(() => {
    if (!targetDocId) return;
    const allDocs = allDocuments ?? documents;
    if (!allDocs?.length) return;
    const found = allDocs.find((d) => d._id === targetDocId);
    if (!found) return;
    setDeepLinkDoc(found);
    setTargetDocId(null);
  }, [targetDocId, allDocuments, documents]);

  const clearDeepLinkDoc = useCallback(() => setDeepLinkDoc(null), []);

  return { deepLinkDoc, clearDeepLinkDoc };
}
