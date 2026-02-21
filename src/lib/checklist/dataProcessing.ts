import {
  IDENTITY_DOCUMENTS,
  EDUCATION_DOCUMENTS,
  OTHER_DOCUMENTS,
  COMPANY_DOCUMENTS,
  SELF_EMPLOYMENT_DOCUMENTS,
} from "@/lib/documents/checklist";
import { Document } from "@/types/applications";
import { Company } from "@/types/documents";
import { parseCompaniesFromDocuments } from "@/utils/companyParsing";

import type {
  ChecklistState,
  ChecklistDocument,
  DocumentRequirement,
  ChecklistItem,
} from "@/types/checklist";

interface DocumentType {
  category: string;
  documentType: string;
  companyName?: string;
  allowedDocument?: number;
  instruction?: string;
}

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

function getAllowedDocumentCount(
  category: string,
  documentType: string,
): number | undefined {
  const allBaseDocuments = [
    ...IDENTITY_DOCUMENTS,
    ...EDUCATION_DOCUMENTS,
    ...OTHER_DOCUMENTS,
    ...SELF_EMPLOYMENT_DOCUMENTS,
    ...COMPANY_DOCUMENTS,
  ];

  const foundDoc = allBaseDocuments.find(
    (doc) => doc.category === category && doc.documentType === documentType,
  );

  // Return undefined if allowedDocument is not specified (allows multiple uploads)
  // Return the specific number if allowedDocument is specified (limits uploads)
  if (
    foundDoc &&
    "allowedDocument" in foundDoc &&
    typeof foundDoc.allowedDocument === "number"
  ) {
    return foundDoc.allowedDocument;
  }
  return undefined;
}

/**
 * Helper function to get instruction from base document types
 */
function getInstruction(
  category: string,
  documentType: string,
): string | undefined {
  const allBaseDocuments = [
    ...IDENTITY_DOCUMENTS,
    ...EDUCATION_DOCUMENTS,
    ...OTHER_DOCUMENTS,
    ...SELF_EMPLOYMENT_DOCUMENTS,
    ...COMPANY_DOCUMENTS,
  ];

  const foundDoc = allBaseDocuments.find(
    (doc) => doc.category === category && doc.documentType === documentType,
  );

  // Return instruction if it exists
  if (
    foundDoc &&
    "instruction" in foundDoc &&
    typeof foundDoc.instruction === "string"
  ) {
    return foundDoc.instruction;
  }
  return undefined;
}

export function generateAllDocumentTypes(
  companies: Company[],
  isClientView: boolean,
  checklistData?: { success: boolean; data: ChecklistItem[] },
): DocumentType[] {
  if (isClientView && checklistData?.data) {
    return checklistData.data.map(
      (item: { document_category: string; document_type: string }) => {
        let categoryLabel = item.document_category;
        if (item.document_category === "Identity") {
          categoryLabel = "Identity Documents";
        } else if (item.document_category === "Education") {
          categoryLabel = "Education Documents";
        } else if (item.document_category === "Other") {
          categoryLabel = "Other Documents";
        } else if (item.document_category === "Self Employment/Freelance") {
          categoryLabel = "Self Employment/Freelance";
        } else if (item.document_category === "Company") {
          categoryLabel = "Company Documents";
        }

        // Get allowedDocument and instruction from the base document types
        const allowedDocument = getAllowedDocumentCount(
          categoryLabel,
          item.document_type,
        );
        const instruction = getInstruction(categoryLabel, item.document_type);

        return {
          documentType: item.document_type,
          category: categoryLabel,
          allowedDocument,
          instruction,
        };
      },
    );
  }

  const baseDocuments = [
    ...IDENTITY_DOCUMENTS,
    ...EDUCATION_DOCUMENTS,
    ...OTHER_DOCUMENTS,
    ...SELF_EMPLOYMENT_DOCUMENTS,
  ];

  const companyDocuments = companies.flatMap((company) =>
    COMPANY_DOCUMENTS.map((doc) => ({
      ...doc,
      category: company.category,
      companyName: company.name,
    })),
  );

  // If no companies are added yet, still include generic company documents
  // so users can see them in the checklist creation mode
  const genericCompanyDocuments =
    companies.length === 0
      ? COMPANY_DOCUMENTS.map((doc) => ({
          ...doc,
          category: "Company Documents",
          companyName: undefined,
        }))
      : [];

  return [...baseDocuments, ...companyDocuments, ...genericCompanyDocuments];
}

export function extractCompaniesFromDocuments(
  documents: Document[],
): Company[] {
  if (!documents || documents.length === 0) return [];

  // Use parseCompaniesFromDocuments instead of hardcoding dates
  // This will properly parse dates from document descriptions or return empty array
  // if dates cannot be parsed (avoiding default dates)
  return parseCompaniesFromDocuments(documents);
}

export function mapCategoryLabel(category: string): string {
  if (category === "Identity") return "Identity Documents";
  if (category === "Education") return "Education Documents";
  if (category === "Other") return "Other Documents";
  if (category === "Self Employment/Freelance")
    return "Self Employment/Freelance";
  if (category === "Company") return "Company Documents";

  if (category.includes("Company Documents")) {
    return category;
  }

  return category;
}

export function matchesCategory(
  itemCategory: string,
  targetCategory: string,
): boolean {
  const categoryLabel = mapCategoryLabel(itemCategory);

  if (targetCategory === "company") {
    return categoryLabel === "Company Documents" || categoryLabel === "Company";
  }

  if (targetCategory.includes("Company Documents")) {
    return categoryLabel === targetCategory;
  }

  switch (targetCategory) {
    case "identity":
    case "identity_documents":
      return categoryLabel === "Identity Documents";
    case "education":
    case "education_documents":
      return categoryLabel === "Education Documents";
    case "other":
    case "other_documents":
      return categoryLabel === "Other Documents";
    case "self_employment":
    case "self_employment/freelance":
      return categoryLabel === "Self Employment/Freelance";
    case "all":
    default:
      return true;
  }
}

export function generateCreatingItems(
  checklistState: ChecklistState,
  filteredDocuments: DocumentType[],
  requirementMap: Record<string, DocumentRequirement>,
  selectedDocuments: ChecklistDocument[],
): ChecklistTableItem[] {
  if (checklistState !== "creating") return [];

  return filteredDocuments.map((docType: DocumentType) => {
    const key = `${docType.category}-${docType.documentType}`;
    const requirement = requirementMap[key] || "not_required";
    const isSelected = selectedDocuments.some(
      (doc) =>
        doc.category === docType.category &&
        doc.documentType === docType.documentType,
    );

    return {
      category: docType.category,
      documentType: docType.documentType,
      isUploaded: false,
      uploadedDocument: undefined,
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

  return currentChecklistDocuments.map((item: ChecklistDocument) => ({
    ...item,
    category: mapCategoryLabel(item.category),
    description: item.description,
  }));
}

export function generateEditingAvailableItems(
  checklistState: ChecklistState,
  availableDocumentsForEditing: DocumentType[],
  requirementMap: Record<string, DocumentRequirement>,
  pendingAdditions: ChecklistDocument[],
): ChecklistTableItem[] {
  if (checklistState !== "editing") return [];

  return availableDocumentsForEditing.map((docType: DocumentType) => {
    const key = `${docType.category}-${docType.documentType}`;

    const pendingAddition = pendingAdditions.find(
      (doc) =>
        doc.category === docType.category &&
        doc.documentType === docType.documentType,
    );

    const requirement =
      pendingAddition?.requirement || requirementMap[key] || "not_required";

    return {
      category: docType.category,
      documentType: docType.documentType,
      isUploaded: false,
      uploadedDocument: undefined,
      requirement: requirement as DocumentRequirement,
      isSelected: false,
      company_name: docType.companyName,
      instruction: docType.instruction,
    };
  });
}

export function generateDefaultItems(
  checklistState: ChecklistState,
  allDocumentTypes: DocumentType[],
  documents: Document[],
): ChecklistTableItem[] {
  if (checklistState !== "none" && checklistState !== "saved") return [];

  const validDocuments =
    documents?.filter(
      (doc) => doc && typeof doc === "object" && doc.file_name,
    ) || [];

  return allDocumentTypes.map((docType: DocumentType) => {
    const expectedDocType = docType.documentType
      .toLowerCase()
      .replace(/\s+/g, "_");

    const uploadedDoc = validDocuments.find((doc) => {
      if (!doc || !doc.file_name) return false;

      // First, try to match by document_name field (API field)
      const docTypeFromName = doc.document_name;
      if (docTypeFromName) {
        const normalizedDocName = docTypeFromName
          .toLowerCase()
          .replace(/\s+/g, "_");
        const normalizedExpectedType = expectedDocType.toLowerCase();

        // Exact match
        if (normalizedDocName === normalizedExpectedType) {
          // For company documents, also check category match
          if (
            docType.category.includes("Documents") &&
            ![
              "Identity Documents",
              "Education Documents",
              "Other Documents",
              "Self Employment/Freelance",
            ].includes(docType.category)
          ) {
            // For company documents, use more flexible matching
            const docCategory = doc.document_category;
            if (docCategory) {
              // Direct match
              if (doc.document_category === docType.category) {
                return true;
              }
              // Check if both are company documents (exact match only)
              if (
                doc.document_category?.includes("Company Documents") &&
                docType.category.includes("Company Documents")
              ) {
                // Only match if it's the exact same company category
                return doc.document_category === docType.category;
              }
              // Check mapped category
              const mappedCategory = mapCategoryLabel(docCategory);
              if (mappedCategory === docType.category) {
                return true;
              }
            }

            return false;
          }
          const docCategory = doc.document_category;
          if (docCategory) {
            const mappedCategory = mapCategoryLabel(docCategory);
            return mappedCategory === docType.category;
          }
          return true;
        }

        // Partial match - check if the document name contains the expected type
        if (
          normalizedDocName.includes(normalizedExpectedType) ||
          normalizedExpectedType.includes(normalizedDocName)
        ) {
          const docCategory = doc.document_category;
          if (docCategory) {
            // For company documents, use more flexible matching
            if (
              docType.category.includes("Documents") &&
              ![
                "Identity Documents",
                "Education Documents",
                "Other Documents",
              ].includes(docType.category)
            ) {
              // Direct match
              if (doc.document_category === docType.category) {
                return true;
              }
              // Check if both are company documents (exact match only)
              if (
                doc.document_category?.includes("Company Documents") &&
                docType.category.includes("Company Documents")
              ) {
                // Only match if it's the exact same company category
                return doc.document_category === docType.category;
              }
              // Check mapped category
              const mappedCategory = mapCategoryLabel(docCategory);
              if (mappedCategory === docType.category) {
                return true;
              }
            }
            const mappedCategory = mapCategoryLabel(docCategory);
            return mappedCategory === docType.category;
          }
        }
      }

      // Fallback: try to match by document_type field
      const docTypeFromField = doc.document_type;
      if (docTypeFromField && docTypeFromField === expectedDocType) {
        // For company documents, also check category match
        if (
          docType.category.includes("Documents") &&
          ![
            "Identity Documents",
            "Education Documents",
            "Other Documents",
          ].includes(docType.category)
        ) {
          // For company documents, use more flexible matching
          const docCategory = doc.document_category;
          if (docCategory) {
            // Direct match
            if (doc.document_category === docType.category) {
              return true;
            }
            // Check if both are company documents (exact match only)
            if (
              doc.document_category?.includes("Company Documents") &&
              docType.category.includes("Company Documents")
            ) {
              // Only match if it's the exact same company category
              return doc.document_category === docType.category;
            }
            // Check mapped category
            const mappedCategory = mapCategoryLabel(docCategory);
            if (mappedCategory === docType.category) {
              return true;
            }
          }
          return false;
        }
        // For standard documents, check if category matches (with mapping)
        const docCategory = doc.document_category;
        if (docCategory) {
          const mappedCategory = mapCategoryLabel(docCategory);
          return mappedCategory === docType.category;
        }
        return true;
      }

      // Fallback: try to match by filename
      const fileName = doc.file_name.toLowerCase();
      const docTypeName = docType.documentType.toLowerCase();
      const fileNameMatch = fileName.includes(docTypeName);

      if (fileNameMatch) {
        // For company documents, also check category match
        if (
          docType.category.includes("Documents") &&
          ![
            "Identity Documents",
            "Education Documents",
            "Other Documents",
          ].includes(docType.category)
        ) {
          // For company documents, use more flexible matching
          const docCategory = doc.document_category;
          if (docCategory) {
            // Direct match
            if (doc.document_category === docType.category) {
              return true;
            }
            // Check if both are company documents (exact match only)
            if (
              doc.document_category?.includes("Company Documents") &&
              docType.category.includes("Company Documents")
            ) {
              // Only match if it's the exact same company category
              return doc.document_category === docType.category;
            }
            // Check mapped category
            const mappedCategory = mapCategoryLabel(docCategory);
            if (mappedCategory === docType.category) {
              return true;
            }
          }
          return false;
        }
        // For standard documents, check if category matches (with mapping)
        const docCategory = doc.document_category;
        if (docCategory) {
          const mappedCategory = mapCategoryLabel(docCategory);
          return mappedCategory === docType.category;
        }
        return true;
      }

      // Special case for promotion letters - try more aggressive matching
      if (docType.documentType.toLowerCase().includes("promotion")) {
        // Check if the document name or filename contains "promotion"
        const docNameContainsPromotion =
          doc.document_name?.toLowerCase().includes("promotion") ||
          doc.file_name.toLowerCase().includes("promotion");

        if (docNameContainsPromotion) {
          // For company documents, check if both are company-related
          if (
            docType.category.includes("Documents") &&
            ![
              "Identity Documents",
              "Education Documents",
              "Other Documents",
              "Self Employment/Freelance",
            ].includes(docType.category)
          ) {
            const docCategory = doc.document_category;
            if (docCategory) {
              // Direct match
              if (doc.document_category === docType.category) {
                return true;
              }
              // Check if both are company documents (exact match only)
              if (
                doc.document_category?.includes("Company Documents") &&
                docType.category.includes("Company Documents")
              ) {
                // Only match if it's the exact same company category
                return doc.document_category === docType.category;
              }
              // Check mapped category
              const mappedCategory = mapCategoryLabel(docCategory);
              if (mappedCategory === docType.category) {
                return true;
              }
            }
          }
        }
      }
      return false;
    });

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
  if (
    checklistState !== "saved" ||
    !checklistData?.data ||
    !Array.isArray(checklistData.data)
  ) {
    return [];
  }

  let currentCompanyForSavedItems = null;

  if (selectedCategory === "company") {
    currentCompanyForSavedItems = null;
  } else if (selectedCategory.includes("company_documents")) {
    // Convert underscore format back to proper category format
    // e.g., "radicalstart_infolab_pvt.ltd_company_documents" -> "radicalstart infolab pvt.ltd Company Documents"
    const parts = selectedCategory.split("_");
    const companyParts = parts.slice(0, -2); // All parts except "company" and "documents"
    const companyName = companyParts.join(" ").toLowerCase(); // Keep company name in lowercase
    const categoryLabel = `${companyName} Company Documents`;

    if (extractedCompanies.length === 0) {
      currentCompanyForSavedItems = null;
    } else {
      currentCompanyForSavedItems = extractedCompanies.find(
        (company) =>
          company.category.toLowerCase() === categoryLabel.toLowerCase(),
      );
    }
  }

  const validDocuments =
    documents?.filter(
      (doc) => doc && typeof doc === "object" && doc.file_name,
    ) || [];

  return checklistData.data.map((checklistItem: ChecklistItem) => {
    let categoryLabel = mapCategoryLabel(checklistItem.document_category);

    if (
      (checklistItem.document_category === "Company" ||
        checklistItem.document_category === "Company Documents" ||
        categoryLabel === "Company Documents") &&
      currentCompanyForSavedItems
    ) {
      categoryLabel = currentCompanyForSavedItems.category;
    }

    const expectedDocType = checklistItem.document_type
      .toLowerCase()
      .replace(/\s+/g, "_");

    const uploadedDoc = validDocuments.find((doc) => {
      if (!doc || !doc.file_name) return false;

      // First, try to match by document_name field (API field)
      const docTypeFromName = doc.document_name;

      if (
        docTypeFromName &&
        docTypeFromName.toLowerCase().replace(/\s+/g, "_") === expectedDocType
      ) {
        // Check category match with mapping
        const docCategory = doc.document_category;
        if (docCategory) {
          // Direct match
          if (doc.document_category === categoryLabel) return true;
          // For company documents, only match if it's the exact same company category
          if (
            categoryLabel.includes("Company Documents") &&
            doc.document_category?.includes("Company Documents")
          ) {
            return doc.document_category === categoryLabel;
          }
          // Check mapped category
          const mappedCategory = mapCategoryLabel(docCategory);
          return mappedCategory === categoryLabel;
        }
        return true;
      }

      // Fallback: try to match by document_type field
      const docTypeFromField = doc.document_type;

      if (docTypeFromField && docTypeFromField === expectedDocType) {
        // Check category match with mapping
        const docCategory = doc.document_category;
        if (docCategory) {
          // Direct match
          if (doc.document_category === categoryLabel) return true;
          // For company documents, only match if it's the exact same company category
          if (
            categoryLabel.includes("Company Documents") &&
            doc.document_category?.includes("Company Documents")
          ) {
            // Only match if it's the exact same company category
            return doc.document_category === categoryLabel;
          }
          // Check mapped category
          const mappedCategory = mapCategoryLabel(docCategory);
          return mappedCategory === categoryLabel;
        }
        return true;
      }

      // Fallback: try to match by filename
      const fileName = doc.file_name.toLowerCase();
      const docTypeName = checklistItem.document_type.toLowerCase();
      const fileNameMatch = fileName.includes(docTypeName);

      if (fileNameMatch) {
        // Check category match with mapping
        const docCategory = doc.document_category;
        if (docCategory) {
          // Direct match
          if (doc.document_category === categoryLabel) return true;
          // For company documents, only match if it's the exact same company category
          if (
            categoryLabel.includes("Company Documents") &&
            doc.document_category?.includes("Company Documents")
          ) {
            // Only match if it's the exact same company category
            return doc.document_category === categoryLabel;
          }
          // Check mapped category
          const mappedCategory = mapCategoryLabel(docCategory);
          return mappedCategory === categoryLabel;
        }
        return true;
      }

      return false;
    });

    // Get instruction from base document types
    const instruction = getInstruction(
      categoryLabel,
      checklistItem.document_type,
    );

    return {
      category: categoryLabel,
      documentType: checklistItem.document_type,
      isUploaded: !!uploadedDoc,
      uploadedDocument: uploadedDoc,
      requirement: (checklistItem.required
        ? "mandatory"
        : "optional") as DocumentRequirement,
      checklist_id: checklistItem.checklist_id,
      rejectedRemark: uploadedDoc?.reject_message,
      documentStatus: uploadedDoc?.status,
      description: checklistItem.description,
      instruction,
    };
  });
}

export function filterItemsByCategory(
  checklistItems: ChecklistTableItem[],
  selectedCategory: string,
): ChecklistTableItem[] {
  // Handle company documents — match any company-specific category (e.g. "worldvisa Company Documents")
  if (selectedCategory === "company") {
    return checklistItems.filter(
      (item) =>
        item.category.includes("Company Documents") ||
        item.category === "Company",
    );
  }

  // Handle dynamic company documents (with company names)
  if (selectedCategory.includes("company_documents")) {
    // Convert underscore format back to proper category format
    // e.g., "radicalstart_infolab_pvt.ltd_company_documents" -> "radicalstart infolab pvt.ltd Company Documents"
    const parts = selectedCategory.split("_");
    const companyParts = parts.slice(0, -2); // All parts except "company" and "documents"
    const companyName = companyParts.join(" ").toLowerCase(); // Keep company name in lowercase
    const categoryLabel = `${companyName} Company Documents`;

    return checklistItems.filter(
      (item) => item.category.toLowerCase() === categoryLabel.toLowerCase(),
    );
  }

  switch (selectedCategory) {
    case "identity":
    case "identity_documents":
      return checklistItems.filter(
        (item) => item.category === "Identity Documents",
      );
    case "education":
    case "education_documents":
      return checklistItems.filter(
        (item) => item.category === "Education Documents",
      );
    case "other":
    case "other_documents":
      return checklistItems.filter(
        (item) => item.category === "Other Documents",
      );
    case "self_employment":
    case "self_employment/freelance":
      return checklistItems.filter(
        (item) => item.category === "Self Employment/Freelance",
      );
    case "all":
    default:
      return checklistItems;
  }
}

export function getCategoryBadgeStyle(category: string): string {
  if (
    category.endsWith(" Documents") &&
    ![
      "Identity Documents",
      "Education Documents",
      "Other Documents",
      "Self Employment/Freelance",
    ].includes(category)
  ) {
    return "bg-orange-500 hover:bg-orange-600"; // Company documents
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
