import type { Document } from "@/types/applications";
import type { Company } from "@/types/documents";
import type {
  ChecklistState,
  ChecklistDocument,
  DocumentRequirement,
  ChecklistItem,
  DocumentTypeConfig,
} from "@/types/checklist";
import {
  toDisplayCategory,
  isCompanyCategory,
  categoryIdToDisplayLabel,
} from "@/lib/constants/checklistCategories";

interface ChecklistTableItem {
  category: string;
  documentType: string;
  isUploaded: boolean;
  uploadedDocument?: Document | unknown;
  requirement?: DocumentRequirement;
  isSelected?: boolean;
  company_name?: string;
  checklist_id?: string;
  rejectedRemark?: string;
  documentStatus?: string;
  description?: string;
  instruction?: string;
}

// ─── Shared helpers ────────────────────────────────────────────────────────────


export function mapCategoryLabel(category: string): string {
  return toDisplayCategory(category);
}

function categoryMatches(
  docCategory: string | undefined,
  expectedLabel: string,
): boolean {
  if (!docCategory) return true;
  if (docCategory === expectedLabel) return true;

  // For company-specific categories, require an exact match
  if (
    expectedLabel.includes("Company Documents") &&
    docCategory.includes("Company Documents")
  ) {
    return docCategory === expectedLabel;
  }

  return toDisplayCategory(docCategory) === expectedLabel;
}

/**
 * Single 3-level document-upload matcher.
 * Tries document_name → document_type → filename, checking category each time.
 */
function matchDocumentUpload(
  doc: Document,
  expectedType: string, // snake_case, e.g. "passport"
  categoryLabel: string, // display label, e.g. "Identity Documents"
): boolean {
  // 1. Match by document_name field
  if (
    doc.document_name?.toLowerCase().replace(/\s+/g, "_") === expectedType &&
    categoryMatches(doc.document_category, categoryLabel)
  ) {
    return true;
  }

  // 2. Match by document_type field
  if (
    doc.document_type === expectedType &&
    categoryMatches(doc.document_category, categoryLabel)
  ) {
    return true;
  }

  // 3. Match by filename inclusion
  const fileName = doc.file_name?.toLowerCase() ?? "";
  const readable = expectedType.replace(/_/g, " ");
  if (fileName.includes(readable) && categoryMatches(doc.document_category, categoryLabel)) {
    return true;
  }

  return false;
}

/**
 * Resolve the Company object for a company-specific selectedCategory id.
 * Returns null for non-company or unresolvable categories.
 */
function resolveCompanyFromCategory(
  selectedCategory: string,
  companies: Company[],
): Company | null {
  if (!selectedCategory.includes("company_documents")) return null;

  // e.g. "radicalstart_infolab_pvt.ltd_company_documents"
  // → "radicalstart infolab pvt.ltd Company Documents"
  const parts = selectedCategory.split("_");
  const companyName = parts.slice(0, -2).join(" ").toLowerCase();
  const categoryLabel = `${companyName} Company Documents`;

  return (
    companies.find(
      (c) => c.category.toLowerCase() === categoryLabel.toLowerCase(),
    ) ?? null
  );
}

// ─── Public generators ─────────────────────────────────────────────────────────

export function generateCreatingItems(
  checklistState: ChecklistState,
  filteredDocuments: DocumentTypeConfig[],
  requirementMap: Record<string, DocumentRequirement>,
  selectedDocuments: ChecklistDocument[],
): ChecklistTableItem[] {
  if (checklistState !== "creating") return [];

  return filteredDocuments.map((docType) => {
    const key = `${docType.category}-${docType.documentType}`;
    const requirement = requirementMap[key] ?? "not_required";
    const isSelected = selectedDocuments.some(
      (doc) =>
        doc.category === docType.category &&
        doc.documentType === docType.documentType,
    );

    return {
      category: docType.category,
      documentType: docType.documentType,
      isUploaded: false,
      requirement,
      isSelected,
      company_name: docType.companyName,
      instruction: docType.instruction,
    };
  });
}

export function generateEditingCurrentItems(
  checklistState: ChecklistState,
  currentChecklistDocuments: ChecklistDocument[],
): ChecklistTableItem[] {
  if (checklistState !== "editing") return [];

  return currentChecklistDocuments.map((item) => ({
    ...item,
    category: toDisplayCategory(item.category),
  }));
}

export function generateEditingAvailableItems(
  checklistState: ChecklistState,
  availableDocumentsForEditing: DocumentTypeConfig[],
  requirementMap: Record<string, DocumentRequirement>,
  pendingAdditions: ChecklistDocument[],
): ChecklistTableItem[] {
  if (checklistState !== "editing") return [];

  return availableDocumentsForEditing.map((docType) => {
    const key = `${docType.category}-${docType.documentType}`;
    const pendingAddition = pendingAdditions.find(
      (doc) =>
        doc.category === docType.category &&
        doc.documentType === docType.documentType,
    );
    const requirement =
      pendingAddition?.requirement ?? requirementMap[key] ?? "not_required";

    return {
      category: docType.category,
      documentType: docType.documentType,
      isUploaded: false,
      requirement: requirement as DocumentRequirement,
      isSelected: false,
      company_name: docType.companyName,
      instruction: docType.instruction,
    };
  });
}

export function generateDefaultItems(
  checklistState: ChecklistState,
  allDocumentTypes: DocumentTypeConfig[],
  documents: Document[],
): ChecklistTableItem[] {
  if (checklistState !== "none" && checklistState !== "saved") return [];

  const validDocs = documents.filter((d) => d?.file_name);

  return allDocumentTypes.map((docType) => {
    const expectedType = docType.documentType
      .toLowerCase()
      .replace(/\s+/g, "_");
    const uploadedDoc = validDocs.find((d) =>
      matchDocumentUpload(d, expectedType, docType.category),
    );

    return {
      category: docType.category,
      documentType: docType.documentType,
      isUploaded: !!uploadedDoc,
      uploadedDocument: uploadedDoc,
      rejectedRemark: uploadedDoc?.reject_message,
      documentStatus: uploadedDoc?.status,
      instruction: docType.instruction,
    };
  });
}

export function generateSavedItems(
  checklistState: ChecklistState,
  checklistData: { success: boolean; data: ChecklistItem[] } | undefined,
  documents: Document[],
  selectedCategory: string,
  extractedCompanies: Company[],
): ChecklistTableItem[] {
  if (checklistState !== "saved" || !checklistData?.data?.length) return [];

  const validDocs = documents.filter((d) => d?.file_name);
  const companyForCategory = resolveCompanyFromCategory(
    selectedCategory,
    extractedCompanies,
  );

  return checklistData.data.map((item) => {
    let categoryLabel = toDisplayCategory(item.document_category);

    // Map generic "Company Documents" to the selected company category
    if (categoryLabel === "Company Documents" && companyForCategory) {
      categoryLabel = companyForCategory.category;
    }

    const expectedType = item.document_type.toLowerCase().replace(/\s+/g, "_");
    const uploadedDoc = validDocs.find((d) =>
      matchDocumentUpload(d, expectedType, categoryLabel),
    );

    return {
      category: categoryLabel,
      documentType: item.document_type,
      isUploaded: !!uploadedDoc,
      uploadedDocument: uploadedDoc,
      requirement: (item.required
        ? "mandatory"
        : "optional") as DocumentRequirement,
      checklist_id: item.checklist_id,
      rejectedRemark: uploadedDoc?.reject_message,
      documentStatus: uploadedDoc?.status,
      description: item.description,
    };
  });
}

export function filterItemsByCategory(
  checklistItems: ChecklistTableItem[],
  selectedCategory: string,
): ChecklistTableItem[] {
  // Company bucket — match any company-specific category
  if (selectedCategory === "company") {
    return checklistItems.filter((item) => isCompanyCategory(item.category));
  }

  // Specific company category (e.g. "worldvisa_company_documents")
  if (selectedCategory.includes("company_documents")) {
    const parts = selectedCategory.split("_");
    const companyName = parts.slice(0, -2).join(" ").toLowerCase();
    const categoryLabel = `${companyName} Company Documents`;
    return checklistItems.filter(
      (item) => item.category.toLowerCase() === categoryLabel.toLowerCase(),
    );
  }

  // Base categories (identity, education, other, self_employment)
  const displayLabel = categoryIdToDisplayLabel(selectedCategory);
  if (displayLabel === null) return checklistItems; // "all" or unknown → return all

  return checklistItems.filter((item) => item.category === displayLabel);
}

export function getCategoryBadgeStyle(category: string): string {
  if (
    isCompanyCategory(category) &&
    category !== "Company" &&
    category !== "Company Documents"
  ) {
    return "bg-orange-500 hover:bg-orange-600";
  }

  switch (category) {
    case "Identity Documents":
      return "bg-blue-500 hover:bg-blue-600";
    case "Education Documents":
      return "bg-green-500 hover:bg-green-600";
    case "Other Documents":
      return "bg-purple-500 hover:bg-purple-600";
    case "Self Employment/Freelance":
      return "bg-yellow-500 hover:bg-yellow-600";
    default:
      return "bg-gray-500 hover:bg-gray-600";
  }
}

/** @deprecated Use DocumentTypeConfig from @/types/checklist */
export function getAllowedDocumentCount(
  _category: string,
  _documentType: string,
): number | undefined {
  return undefined;
}
