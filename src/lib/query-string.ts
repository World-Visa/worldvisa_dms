import queryString, { ParsedQuery } from "query-string";

// Utility functions for working with query strings
export const queryStringUtils = {
  // Parse query string to object
  parse: (queryStr: string): ParsedQuery<string | number | boolean> => {
    return queryString.parse(queryStr, {
      parseBooleans: true,
      parseNumbers: true,
      arrayFormat: "bracket",
    });
  },

  // Convert object to query string
  stringify: (obj: Record<string, unknown>): string => {
    return queryString.stringify(obj, {
      skipNull: true,
      skipEmptyString: true,
      arrayFormat: "bracket",
    });
  },

  // Update URL with new query parameters
  updateUrl: (newParams: Record<string, unknown>, currentSearch?: string) => {
    const current = currentSearch ? queryStringUtils.parse(currentSearch) : {};
    const updated = { ...current, ...newParams };
    return queryStringUtils.stringify(updated);
  },

  // Remove specific parameters from query string
  removeParams: (paramsToRemove: string[], currentSearch?: string) => {
    const current = currentSearch ? queryStringUtils.parse(currentSearch) : {};
    paramsToRemove.forEach((param) => delete current[param]);
    return queryStringUtils.stringify(current);
  },
};
