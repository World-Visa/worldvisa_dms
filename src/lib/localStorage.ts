// Utility functions for persistent storage operations with error handling
// This will persist data across logout/login and hard refresh

export const localStorageUtils = {
  // Save data to localStorage with error handling
  setItem: (key: string, value: unknown): boolean => {
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
      }
      return false;
    } catch (error) {
      console.warn("Failed to save to localStorage:", error);
      return false;
    }
  },

  // Get data from localStorage with error handling
  getItem: <T>(key: string, defaultValue: T): T => {
    try {
      if (typeof window !== "undefined") {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
      }
      return defaultValue;
    } catch (error) {
      console.warn("Failed to read from localStorage:", error);
      return defaultValue;
    }
  },

  // Remove item from localStorage
  removeItem: (key: string): boolean => {
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem(key);
        return true;
      }
      return false;
    } catch (error) {
      console.warn("Failed to remove from localStorage:", error);
      return false;
    }
  },

  // Clear all application-related localStorage items
  clearApplicationData: (applicationId: string): boolean => {
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem(
          localStorageUtils.getCompaniesKey(applicationId),
        );
        localStorage.removeItem(
          localStorageUtils.getCategoryKey(applicationId),
        );
        localStorage.removeItem(
          localStorageUtils.getChecklistStateKey(applicationId),
        );
        return true;
      }
      return false;
    } catch (error) {
      console.warn(
        "Failed to clear application data from localStorage:",
        error,
      );
      return false;
    }
  },

  // Application-specific storage keys
  getCompaniesKey: (applicationId: string) =>
    `worldvisa-companies-${applicationId}`,
  getCategoryKey: (applicationId: string) =>
    `worldvisa-category-${applicationId}`,
  getChecklistStateKey: (applicationId: string) =>
    `worldvisa-checklist-state-${applicationId}`,

  // Save companies data with application-specific key
  saveCompanies: (applicationId: string, companies: unknown[]): boolean => {
    return localStorageUtils.setItem(
      localStorageUtils.getCompaniesKey(applicationId),
      companies,
    );
  },

  // Load companies data with application-specific key
  loadCompanies: <T>(applicationId: string, defaultValue: T): T => {
    return localStorageUtils.getItem(
      localStorageUtils.getCompaniesKey(applicationId),
      defaultValue,
    );
  },

  // Save selected category with application-specific key
  saveCategory: (applicationId: string, category: string): boolean => {
    return localStorageUtils.setItem(
      localStorageUtils.getCategoryKey(applicationId),
      category,
    );
  },

  // Load selected category with application-specific key
  loadCategory: (applicationId: string, defaultValue: string): string => {
    return localStorageUtils.getItem(
      localStorageUtils.getCategoryKey(applicationId),
      defaultValue,
    );
  },

  // Save checklist state with application-specific key
  saveChecklistState: (applicationId: string, state: unknown): boolean => {
    return localStorageUtils.setItem(
      localStorageUtils.getChecklistStateKey(applicationId),
      state,
    );
  },

  // Load checklist state with application-specific key
  loadChecklistState: <T>(applicationId: string, defaultValue: T): T => {
    return localStorageUtils.getItem(
      localStorageUtils.getChecklistStateKey(applicationId),
      defaultValue,
    );
  },
};
