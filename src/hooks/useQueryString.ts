'use client';

import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useCallback, useMemo } from 'react';
import queryString from 'query-string';
import { FilterParams } from '@/types/common';

export function useQueryString() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Parse current query parameters
  const queryParams = useMemo(() => {
    return queryString.parse(searchParams.toString(), {
      parseNumbers: true,
      parseBooleans: true,
    }) as FilterParams;
  }, [searchParams]);

  // Update query parameters
  const updateQuery = useCallback(
    (params: Partial<FilterParams>, options?: { replace?: boolean }) => {
      const newParams = { ...queryParams, ...params };
      
      // Remove undefined values
      Object.keys(newParams).forEach(key => {
        if (newParams[key] === undefined || newParams[key] === '') {
          delete newParams[key];
        }
      });

      const queryStringResult = queryString.stringify(newParams, {
        arrayFormat: 'bracket',
        skipNull: true,
        skipEmptyString: true,
      });

      const url = queryStringResult ? `${pathname}?${queryStringResult}` : pathname;
      
      if (options?.replace) {
        router.replace(url);
      } else {
        router.push(url);
      }
    },
    [queryParams, pathname, router]
  );

  // Remove specific query parameter
  const removeQuery = useCallback(
    (key: string) => {
      const newParams = { ...queryParams };
      delete newParams[key];
      
      const queryStringResult = queryString.stringify(newParams, {
        arrayFormat: 'bracket',
        skipNull: true,
        skipEmptyString: true,
      });

      const url = queryStringResult ? `${pathname}?${queryStringResult}` : pathname;
      router.push(url);
    },
    [queryParams, pathname, router]
  );

  // Clear all query parameters
  const clearQuery = useCallback(() => {
    router.push(pathname);
  }, [pathname, router]);

  // Get specific query parameter
  const getQuery = useCallback(
    (key: string) => {
      return queryParams[key];
    },
    [queryParams]
  );

  return {
    queryParams,
    updateQuery,
    removeQuery,
    clearQuery,
    getQuery,
  };
}
