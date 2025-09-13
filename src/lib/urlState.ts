/**
 * URL State Management Utilities
 * 
 * This module provides utilities for managing application state through URL parameters.
 * It allows for deep linking, browser back/forward navigation, and state persistence.
 */

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo } from 'react';

export interface URLStateConfig {
  defaultValues?: Record<string, string>;
  persistKeys?: string[];
}

/**
 * Hook for managing URL state parameters
 */
export function useURLState(config: URLStateConfig = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const { defaultValues = {}, persistKeys = [] } = config;

  // Get current URL state
  const urlState = useMemo(() => {
    const state: Record<string, string> = {};
    
    // Get values from URL params
    searchParams.forEach((value, key) => {
      state[key] = value;
    });
    
    // Apply default values for missing keys
    Object.entries(defaultValues).forEach(([key, defaultValue]) => {
      if (!(key in state)) {
        state[key] = defaultValue;
      }
    });
    
    return state;
  }, [searchParams, defaultValues]);

  // Update URL state
  const updateURLState = useCallback((updates: Record<string, string | null>) => {
    const newSearchParams = new URLSearchParams(searchParams.toString());
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === undefined || value === '') {
        newSearchParams.delete(key);
      } else {
        newSearchParams.set(key, value);
      }
    });
    
    const newURL = `${window.location.pathname}?${newSearchParams.toString()}`;
    router.replace(newURL, { scroll: false });
  }, [router, searchParams]);

  // Get specific parameter value
  const getParam = useCallback((key: string): string | null => {
    return searchParams.get(key);
  }, [searchParams]);

  // Set specific parameter value
  const setParam = useCallback((key: string, value: string | null) => {
    updateURLState({ [key]: value });
  }, [updateURLState]);

  // Clear all parameters
  const clearParams = useCallback(() => {
    router.replace(window.location.pathname, { scroll: false });
  }, [router]);

  return {
    urlState,
    updateURLState,
    getParam,
    setParam,
    clearParams
  };
}

/**
 * Hook specifically for checklist state management
 */
export function useChecklistURLState(applicationId: string) {
  const { urlState, setParam, getParam } = useURLState({
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
