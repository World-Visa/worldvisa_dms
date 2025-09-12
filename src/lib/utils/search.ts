import Fuse, { FuseResultMatch, IFuseOptions } from 'fuse.js';
import { filterByQuery } from './highlight';
import { useMemo } from 'react';

export interface SearchOptions {
  keys: string[];
  threshold?: number;
  distance?: number;
  includeScore?: boolean;
  includeMatches?: boolean;
}

export interface SearchResult<T> {
  item: T;
  score?: number;
  matches?: readonly FuseResultMatch[];
}


export function createFuseInstance<T>(
  items: T[],
  options: SearchOptions = { keys: [], threshold: 0.3 }
): Fuse<T> {
  const fuseOptions: IFuseOptions<T> = {
    keys: options.keys,
    threshold: options.threshold || 0.3,
    distance: options.distance || 100,
    includeScore: options.includeScore || false,
    includeMatches: options.includeMatches || false,
    
    minMatchCharLength: 1,
    shouldSort: true,
    findAllMatches: true,
    
    ignoreLocation: true,
    useExtendedSearch: false,
  };

  return new Fuse(items, fuseOptions);
}


export function fuzzySearch<T>(
  fuse: Fuse<T>,
  query: string
): SearchResult<T>[] {
  if (!query.trim()) {
    return [];
  }

  const results = fuse.search(query);
  return results.map(result => ({
    item: result.item,
    score: result.score,
    matches: result.matches,
  }));
}

/**
 
 */
export function comprehensiveSearch<T>(
  items: T[],
  query: string,
  getText: (item: T) => string,
  options: SearchOptions = { keys: ['text'], threshold: 0.3 }
): T[] {
  if (!query.trim()) {
    return items;
  }

  
  const exactMatches = filterByQuery(items, query, getText);
  
  if (exactMatches.length > 0) {
    return exactMatches;
  }

  
  // For Fuse.js, we need to create a searchable object structure
  const searchableItems = items.map(item => ({
    originalItem: item,
    searchableText: getText(item)
  }));
  
  const fuse = createFuseInstance(searchableItems, {
    ...options,
    keys: ['searchableText'],
  });

  const fuzzyResults = fuzzySearch(fuse, query);
  return fuzzyResults.map(result => result.item.originalItem);
}


export function useSearchMemo<T>(
  items: T[],
  query: string,
  getText: (item: T) => string,
  options?: SearchOptions
): T[] {
  return useMemo(() => {
    return comprehensiveSearch(items, query, getText, options);
  }, [items, query, getText, options]);
}


export function getSearchStats<T>(
  items: T[],
  filteredItems: T[],
  query: string
): {
  totalItems: number;
  filteredItems: number;
  matchPercentage: number;
  hasQuery: boolean;
} {
  const totalItems = items.length;
  const filteredCount = filteredItems.length;
  const matchPercentage = totalItems > 0 ? (filteredCount / totalItems) * 100 : 0;

  return {
    totalItems,
    filteredItems: filteredCount,
    matchPercentage: Math.round(matchPercentage * 100) / 100,
    hasQuery: query.trim().length > 0,
  };
}
