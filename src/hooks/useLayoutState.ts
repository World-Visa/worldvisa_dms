import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useURLState } from '@/lib/urlState';
import type { ApplicationLayout } from '@/components/applications/layouts/LayoutChips';

const VALID_LAYOUTS: ApplicationLayout[] = ['skill-assessment', 'outcome', 'eoi', 'invitation'];

export function useLayoutState() {
  const searchParams = useSearchParams();
  const { setParam } = useURLState({
    defaultValues: { layout: 'skill-assessment' }
  });

  const getValidatedLayout = useCallback((layoutParam: string | null): ApplicationLayout => {
    if (layoutParam && VALID_LAYOUTS.includes(layoutParam as ApplicationLayout)) {
      return layoutParam as ApplicationLayout;
    }
    return 'skill-assessment';
  }, []);

  const [selectedLayout, setSelectedLayout] = useState<ApplicationLayout>(() => {
    const layoutParam = searchParams.get('layout');
    return getValidatedLayout(layoutParam);
  });

  // Sync with URL changes
  useEffect(() => {
    const layoutParam = searchParams.get('layout');
    const validatedLayout = getValidatedLayout(layoutParam);
    if (validatedLayout !== selectedLayout) {
      setSelectedLayout(validatedLayout);
    }
  }, [searchParams, getValidatedLayout, selectedLayout]);

  const handleLayoutChange = useCallback((layout: ApplicationLayout) => {
    setSelectedLayout(layout);
    setParam('layout', layout);
  }, [setParam]);

  return {
    selectedLayout,
    handleLayoutChange,
  };
}

