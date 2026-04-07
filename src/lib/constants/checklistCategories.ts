
export enum ChecklistApiCategory {
  IDENTITY = "Identity",
  EDUCATION = "Education",
  OTHER = "Other",
  SELF_EMPLOYMENT = "Self Employment/Freelance",
  COMPANY = "Company",
}

export enum ChecklistDisplayCategory {
  IDENTITY = "Identity Documents",
  EDUCATION = "Education Documents",
  OTHER = "Other Documents",
  SELF_EMPLOYMENT = "Self Employment/Freelance",
  COMPANY = "Company Documents",
}

export function toDisplayCategory(apiCategory: string): string {
  switch (apiCategory) {
    case ChecklistApiCategory.IDENTITY:
      return ChecklistDisplayCategory.IDENTITY;
    case ChecklistApiCategory.EDUCATION:
      return ChecklistDisplayCategory.EDUCATION;
    case ChecklistApiCategory.OTHER:
      return ChecklistDisplayCategory.OTHER;
    case ChecklistApiCategory.SELF_EMPLOYMENT:
      return ChecklistDisplayCategory.SELF_EMPLOYMENT;
    case ChecklistApiCategory.COMPANY:
      return ChecklistDisplayCategory.COMPANY;
    default:
      return apiCategory;
  }
}

export function toApiCategory(displayCategory: string): string {
  switch (displayCategory) {
    case ChecklistDisplayCategory.IDENTITY:
      return ChecklistApiCategory.IDENTITY;
    case ChecklistDisplayCategory.EDUCATION:
      return ChecklistApiCategory.EDUCATION;
    case ChecklistDisplayCategory.OTHER:
      return ChecklistApiCategory.OTHER;
    case ChecklistDisplayCategory.SELF_EMPLOYMENT:
      return ChecklistApiCategory.SELF_EMPLOYMENT;
    default:
      if (displayCategory.includes("Company Documents")) {
        return ChecklistApiCategory.COMPANY;
      }
      return displayCategory;
  }
}

export function isCompanyCategory(category: string): boolean {
  return (
    category === ChecklistApiCategory.COMPANY ||
    category === ChecklistDisplayCategory.COMPANY ||
    category.includes("Company Documents")
  );
}

export function categoryIdToDisplayLabel(categoryId: string): string | null {
  switch (categoryId) {
    case "identity":
    case "identity_documents":
      return ChecklistDisplayCategory.IDENTITY;
    case "education":
    case "education_documents":
      return ChecklistDisplayCategory.EDUCATION;
    case "other":
    case "other_documents":
      return ChecklistDisplayCategory.OTHER;
    case "self_employment":
    case "self_employment/freelance":
      return ChecklistDisplayCategory.SELF_EMPLOYMENT;
    case "all":
      return null;
    default:
      return null;
  }
}
