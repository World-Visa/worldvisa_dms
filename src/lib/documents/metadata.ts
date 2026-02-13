import {
  IDENTITY_DOCUMENTS,
  EDUCATION_DOCUMENTS,
  OTHER_DOCUMENTS,
  COMPANY_DOCUMENTS,
  SELF_EMPLOYMENT_DOCUMENTS,
  DOCUMENT_TYPES_WITH_SAMPLE_IN_MODALS,
} from "./checklist";

export interface ChecklistDocumentMetadata {
  category: string;
  documentType: string;
  allowedDocument?: number;
  instruction?: string;
  sampleDocument?: string;
  importantNote?: string;
}

const CHECKLIST_DOCUMENTS: ChecklistDocumentMetadata[] = [
  ...IDENTITY_DOCUMENTS,
  ...EDUCATION_DOCUMENTS,
  ...OTHER_DOCUMENTS,
  ...COMPANY_DOCUMENTS,
  ...SELF_EMPLOYMENT_DOCUMENTS,
];

const CATEGORY_ALIASES: Record<string, string> = {
  Identity: "Identity Documents",
  "Identity Documents": "Identity Documents",
  Education: "Education Documents",
  "Education Documents": "Education Documents",
  Other: "Other Documents",
  "Other Documents": "Other Documents",
  Company: "Company",
  "Company Documents": "Company",
  "Self Employment/Freelance": "Self Employment/Freelance",
  "Self Employment": "Self Employment/Freelance",
};

const sanitize = (value?: string): string =>
  value?.toLowerCase().replace(/[^a-z0-9]/g, "") ?? "";

const isCompanyLikeCategory = (category: string): boolean => {
  const lowered = category.toLowerCase();
  return (
    lowered.includes("company documents") ||
    (lowered.includes("documents") &&
      !CATEGORY_ALIASES[category] &&
      !["identity documents", "education documents", "other documents"].includes(
        lowered,
      ))
  );
};

export const resolveChecklistCategory = (category: string): string => {
  const trimmed = category?.trim() ?? "";
  if (!trimmed) {
    return "";
  }

  if (CATEGORY_ALIASES[trimmed]) {
    return CATEGORY_ALIASES[trimmed];
  }

  if (isCompanyLikeCategory(trimmed)) {
    return "Company";
  }

  return trimmed;
};

export const getChecklistDocumentMeta = (
  category: string,
  documentType: string,
): ChecklistDocumentMetadata | undefined => {
  if (!documentType) {
    return undefined;
  }

  const resolvedCategory = resolveChecklistCategory(category);
  const targetType = sanitize(documentType);

  const match = CHECKLIST_DOCUMENTS.find(
    (doc) =>
      sanitize(doc.documentType) === targetType &&
      (!resolvedCategory || doc.category === resolvedCategory),
  );

  if (match) {
    return match;
  }

  // Fallback: ignore category if nothing was found
  return CHECKLIST_DOCUMENTS.find(
    (doc) => sanitize(doc.documentType) === targetType,
  );
};

export const getAllChecklistDocuments = (): ChecklistDocumentMetadata[] =>
  CHECKLIST_DOCUMENTS;

export function isDocumentTypeWithSampleInModal(
  documentType: string,
  category: string
): boolean {
  if (!documentType?.trim()) return false;
  const resolvedCategory = resolveChecklistCategory(category);
  return DOCUMENT_TYPES_WITH_SAMPLE_IN_MODALS.some(
    (entry) =>
      entry.documentType === documentType && entry.category === resolvedCategory
  );
}


