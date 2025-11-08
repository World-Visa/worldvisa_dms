import { useState, useCallback } from 'react';

interface UseClientApplicationStateProps {
  initialCategory?: string;
}


export function useClientApplicationState({
  initialCategory = "submitted",
}: UseClientApplicationStateProps = {}) {
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [documentsPage, setDocumentsPage] = useState(1);
  const [isCategoryChanging, setIsCategoryChanging] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const documentsLimit = 10;

  const handleDocumentsPageChange = useCallback((page: number) => {
    setDocumentsPage(page);
  }, []);

  const handleCategoryChange = useCallback(async (category: string) => {
    setIsCategoryChanging(true);
    try {
      setSelectedCategory(category);
      setDocumentsPage(1);
      await new Promise((resolve) => setTimeout(resolve, 300));
    } finally {
      setIsCategoryChanging(false);
    }
  }, []);

  const setRefreshing = useCallback((isRefreshing: boolean) => {
    setIsRefreshing(isRefreshing);
  }, []);

  return {
    selectedCategory,
    documentsPage,
    documentsLimit,
    isCategoryChanging,
    isRefreshing,
    handleCategoryChange,
    handleDocumentsPageChange,
    setRefreshing,
  };
}




