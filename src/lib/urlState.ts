/**
 * URL State Management Utilities
 * 
 * This module provides utilities for managing application state through URL parameters.
 * It allows for deep linking, browser back/forward navigation, and state persistence.
 */

import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export interface URLStateConfig {
  defaultValues?: Record<string, string>;
  persistKeys?: string[];
}

/**
 * Hook for managing URL state parameters
 */
export function useURLState(config: URLStateConfig = {}) {
  const searchParams = useSearchParams();
  const { defaultValues = {} } = config;

  const parseParams = useCallback(
    (params: URLSearchParams | null): Record<string, string> => {
      const state: Record<string, string> = {};

      if (params) {
        params.forEach((value, key) => {
          state[key] = value;
        });
      }

      Object.entries(defaultValues).forEach(([key, defaultValue]) => {
        if (!(key in state)) {
          state[key] = defaultValue;
        }
      });

      return state;
    },
    [defaultValues]
  );

  const initialStateRef = useRef<null | Record<string, string>>(null);
  if (initialStateRef.current === null) {
    const params = typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search)
      : new URLSearchParams(searchParams.toString());
    initialStateRef.current = parseParams(params);
  }

  const [urlState, setUrlState] = useState<Record<string, string>>(
    () => initialStateRef.current ?? {}
  );

  const syncState = useCallback(
    (params: URLSearchParams) => {
      const nextState = parseParams(params);
      setUrlState(prevState => {
        const keys = new Set([...Object.keys(prevState), ...Object.keys(nextState)]);
        const isSame = Array.from(keys).every(key => prevState[key] === nextState[key]);
        return isSame ? prevState : nextState;
      });
    },
    [parseParams]
  );

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    syncState(params);
  }, [searchParams, syncState]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const handlePopState = () => {
      syncState(new URLSearchParams(window.location.search));
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [syncState]);

  const updateURLState = useCallback(
    (updates: Record<string, string | null>) => {
      if (typeof window === 'undefined') {
        return;
      }

      const currentParams = new URLSearchParams(window.location.search);

      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === undefined || value === '') {
          currentParams.delete(key);
        } else {
          currentParams.set(key, value);
        }
      });

      const query = currentParams.toString();
      const pathname = window.location.pathname;
      const newUrl = query ? `${pathname}?${query}` : pathname;

      const currentRelativeUrl = `${pathname}${window.location.search}`;
      if (currentRelativeUrl !== newUrl) {
        window.history.replaceState(null, '', newUrl);
        syncState(currentParams);
      } else {
        // Even if URL is identical we may have removed keys that resulted in defaults
        syncState(currentParams);
      }
    },
    [syncState]
  );

  const getParam = useCallback(
    (key: string): string | null => {
      return urlState[key] ?? null;
    },
    [urlState]
  );

  const setParam = useCallback(
    (key: string, value: string | null) => {
      updateURLState({ [key]: value });
    },
    [updateURLState]
  );

  const clearParams = useCallback(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const pathname = window.location.pathname;
    window.history.replaceState(null, '', pathname);
    syncState(new URLSearchParams());
  }, [syncState]);

  return {
    urlState,
    updateURLState,
    getParam,
    setParam,
    clearParams,
  };
}

/**
 * Hook specifically for checklist state management
 */
export function useChecklistURLState(applicationId: string) {
  const { urlState, setParam} = useURLState({
    defaultValues: {
      category: 'submitted',
      checklistState: 'none'
    }
  });

  const category = urlState.category || 'submitted';
  const checklistState = urlState.checklistState || 'none';

  const setCategory = useCallback((newCategory: string) => {
    setParam('category', newCategory);
  }, [setParam]);

  const setChecklistState = useCallback((newState: string) => {
    setParam('checklistState', newState);
  }, [setParam]);

  const resetToDefault = useCallback(() => {
    setParam('category', 'submitted');
    setParam('checklistState', 'none');
  }, [setParam]);

  return {
    category,
    checklistState,
    setCategory,
    setChecklistState,
    resetToDefault,
    urlState
  };
}
