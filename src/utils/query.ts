import parse from "query-string";
import { FilterParams } from "@/types/common";

// Parse query string to object
export function parseQueryString(queryString: string): FilterParams {
  return parse.parse(queryString, {
    parseNumbers: true,
    parseBooleans: true,
  }) as FilterParams;
}

// Convert object to query string
export function stringifyQueryString(params: FilterParams): string {
  return parse.stringify(params, {
    skipNull: true,
    skipEmptyString: true,
  });
}

// Build URL with query parameters
export function buildUrlWithQuery(
  baseUrl: string,
  params: FilterParams,
): string {
  const queryString = stringifyQueryString(params);
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
}

// Update query parameters
export function updateQueryParams(
  currentParams: FilterParams,
  updates: Partial<FilterParams>,
): FilterParams {
  return { ...currentParams, ...updates };
}

// Remove query parameters
export function removeQueryParams(
  currentParams: FilterParams,
  keysToRemove: string[],
): FilterParams {
  const newParams = { ...currentParams };
  keysToRemove.forEach((key) => {
    delete newParams[key];
  });
  return newParams;
}

// Clear all query parameters
export function clearQueryParams(): FilterParams {
  return {};
}

// Get specific query parameter
export function getQueryParam(params: FilterParams, key: string): unknown {
  return params[key];
}

// Check if query parameters are empty
export function isQueryParamsEmpty(params: FilterParams): boolean {
  return Object.keys(params).length === 0;
}
