'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useCallback } from 'react';
import { getApplications } from '@/lib/api/getApplications';
import { ApplicationsFilters } from '@/types/applications';

interface UseOptimizedApplicationsOptions {
  filters: ApplicationsFilters;
  enabled?: boolean;
  prefetchNext?: boolean;
}

export function useOptimizedApplications({
  filters,
  enabled = true,
  prefetchNext = true
}: UseOptimizedApplicationsOptions) {
  const queryClient = useQueryClient();

  // Memoize query key to prevent unnecessary refetches
  const queryKey = useMemo(() => 
    ['applications', filters], 
    [filters]
  );

  // Main query
  const query = useQuery({
    queryKey,
    queryFn: () => getApplications(filters),
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 2,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Prefetch next page for better UX
  const prefetchNextPage = useCallback(() => {
    if (!prefetchNext || !query.data?.pagination) return;
    
    const { currentPage, totalPages } = query.data.pagination;
    if (currentPage < totalPages) {
      const nextPageFilters = {
        ...filters,
        page: currentPage + 1
      };
      
      queryClient.prefetchQuery({
        queryKey: ['applications', nextPageFilters],
        queryFn: () => getApplications(nextPageFilters),
        staleTime: 5 * 60 * 1000,
      });
    }
  }, [query.data?.pagination, filters, prefetchNext, queryClient]);

  // Prefetch on successful data load
  React.useEffect(() => {
    if (query.isSuccess && query.data) {
      prefetchNextPage();
    }
  }, [query.isSuccess, query.data, prefetchNextPage]);

  return {
    ...query,
    prefetchNextPage,
  };
}

// Hook for prefetching search results
export function usePrefetchSearchResults() {
  const queryClient = useQueryClient();

  const prefetchSearch = useCallback(async (
    searchParams: Record<string, string>,
    enabled: boolean = true
  ) => {
    if (!enabled || !Object.keys(searchParams).length) return;

    try {
      await queryClient.prefetchQuery({
        queryKey: ['search-applications', searchParams],
        queryFn: async () => {
          const { searchApplications } = await import('@/lib/search');
          return searchApplications(searchParams);
        },
        staleTime: 2 * 60 * 1000, // 2 minutes for search results
      });
    } catch (error) {
      // Silently fail prefetch
    }
  }, [queryClient]);

  return { prefetchSearch };
}

// Hook for managing application cache
export function useApplicationCache() {
  const queryClient = useQueryClient();

  const invalidateApplications = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['applications'] });
  }, [queryClient]);

  const updateApplicationInCache = useCallback((applicationId: string, updates: Partial<any>) => {
    queryClient.setQueryData(['application', applicationId], (old: any) => {
      if (!old) return old;
      return { ...old, ...updates };
    });
  }, [queryClient]);

  const getCachedApplication = useCallback((applicationId: string) => {
    return queryClient.getQueryData(['application', applicationId]);
  }, [queryClient]);

  return {
    invalidateApplications,
    updateApplicationInCache,
    getCachedApplication,
  };
}
