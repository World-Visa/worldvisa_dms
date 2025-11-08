import { useMemo } from 'react';
import { useStage2Documents } from './useStage2Documents';
import type { ApplicationLayout } from '@/components/applications/layouts/LayoutChips';

/**
 * Hook to determine which layout chips should be shown based on available stage2 documents
 * Always includes 'skill-assessment', plus 'outcome', 'eoi', 'invitation' if they have documents
 */
export function useAvailableLayouts(applicationId: string): ApplicationLayout[] {
  const { data: stage2DocumentsData } = useStage2Documents(applicationId);

  return useMemo(() => {
    const availableLayouts: ApplicationLayout[] = ['skill-assessment']; // Always include skill assessment

    if (!stage2DocumentsData?.data || stage2DocumentsData.data.length === 0) {
      return availableLayouts;
    }

    const documentTypes = new Set(stage2DocumentsData.data.map((doc) => doc.type));

    // Add layout chips for document types that exist
    if (documentTypes.has('outcome')) {
      availableLayouts.push('outcome');
    }
    if (documentTypes.has('eoi')) {
      availableLayouts.push('eoi');
    }
    if (documentTypes.has('invitation')) {
      availableLayouts.push('invitation');
    }

    return availableLayouts;
  }, [stage2DocumentsData]);
}




