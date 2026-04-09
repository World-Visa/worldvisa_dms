'use client';

import { useMemo } from 'react';
import { useGroupedDocuments } from './useChecklistDocumentTemplates';
import type { ChecklistDocumentTemplate } from '@/types/checklistDocumentTemplates';

const normalize = (v: string) => v.toLowerCase().replace(/[^a-z0-9]/g, '');

/**
 * Returns the dynamic ChecklistDocumentTemplate for a given visa service type,
 * category, and document type. Returns undefined if no match or no visaServiceType.
 */
export function useChecklistTemplateForDocument(
  visaServiceType: string | undefined,
  category: string,
  documentType: string,
): ChecklistDocumentTemplate | undefined {
  const { data } = useGroupedDocuments(visaServiceType ?? '');

  return useMemo(() => {
    if (!visaServiceType || !documentType || !data?.data?.groups) return undefined;
    const normType = normalize(documentType);

    for (const group of data.data.groups) {
      const doc = group.documents.find(
        (d) => normalize(d.documentType) === normType,
      );
      if (doc) return doc;
    }
    return undefined;
  }, [data, visaServiceType, documentType]);
}
