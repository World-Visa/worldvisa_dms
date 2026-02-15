import { useState, useCallback } from "react";
import type { ApplicationLayout } from "@/components/applications/layouts/LayoutChips";

const VALID_LAYOUTS: ApplicationLayout[] = [
  "skill-assessment",
  "outcome",
  "eoi",
  "invitation",
];

export function useLayoutState() {
  const [selectedLayout, setSelectedLayout] =
    useState<ApplicationLayout>("skill-assessment");

  const handleLayoutChange = useCallback((layout: ApplicationLayout) => {
    if (VALID_LAYOUTS.includes(layout)) {
      setSelectedLayout(layout);
    }
  }, []);

  return {
    selectedLayout,
    handleLayoutChange,
  };
}
