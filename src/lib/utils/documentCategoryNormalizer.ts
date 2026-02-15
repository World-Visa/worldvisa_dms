/**
 * Document Category Normalization Utility
 *
 * This utility provides consistent category normalization across the application
 * to handle variations in document category storage and display formats.
 */

/**
 * Normalize document category for consistent display
 * Handles API format categories and variations like "Education Document."
 */
export function normalizeDocumentCategory(category: string): string {
  if (!category) return category;

  // Handle API format categories
  switch (category) {
    case "Identity":
      return "Identity Documents";
    case "Education":
      return "Education Documents";
    case "Other":
      return "Other Documents";
    case "Self Employment/Freelance":
      return "Self Employment/Freelance";
    case "Company":
      return "Company Documents";
    default:
      // Handle variations like "Education Document." or "Education Documents"
      if (category.includes("Education") && !category.includes("Documents")) {
        return "Education Documents";
      }
      if (category.includes("Identity") && !category.includes("Documents")) {
        return "Identity Documents";
      }
      if (category.includes("Other") && !category.includes("Documents")) {
        return "Other Documents";
      }
      if (
        category.includes("Self Employment") &&
        !category.includes("Documents")
      ) {
        return "Self Employment/Freelance";
      }
      // Return as-is for company documents and other categories
      return category;
  }
}

/**
 * Check if a category is a company document category
 */
export function isCompanyDocumentCategory(category: string): boolean {
  return category.includes("Company Documents");
}

/**
 * Get category display properties for consistent styling
 */
export function getCategoryDisplayProps(category: string) {
  const normalizedCategory = normalizeDocumentCategory(category);
  const isCompanyDoc = isCompanyDocumentCategory(normalizedCategory);

  return {
    category: normalizedCategory,
    isCompanyDoc,
    badgeVariant: isCompanyDoc ? "default" : ("outline" as const),
    badgeClassName: isCompanyDoc
      ? "bg-blue-100 text-blue-800 hover:bg-blue-200"
      : "",
    displayText:
      normalizedCategory.length > 18
        ? `${normalizedCategory.substring(0, 18)}...`
        : normalizedCategory,
  };
}
