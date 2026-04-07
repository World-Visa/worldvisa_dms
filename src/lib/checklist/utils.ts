import type {
  ChecklistItem,
  ChecklistDocument,
  DocumentRequirement,
  RequirementMap,
  ChecklistCreateRequest,
  DocumentTypeConfig,
} from "@/types/checklist";
import type { ChecklistDocumentGroup } from "@/types/checklistDocumentTemplates";
import type { Document } from "@/types/applications";
import {
  toDisplayCategory,
  toApiCategory,
  isCompanyCategory,
  ChecklistDisplayCategory,
  ChecklistApiCategory,
} from "@/lib/constants/checklistCategories";

// ─── Requirement conversion ────────────────────────────────────────────────────

export function requirementToBoolean(
  requirement: DocumentRequirement,
): boolean | null {
  switch (requirement) {
    case "mandatory":
      return true;
    case "optional":
      return false;
    case "not_required":
    default:
      return null;
  }
}

export function booleanToRequirement(required: boolean): DocumentRequirement {
  return required ? "mandatory" : "optional";
}

// ─── Document type building ────────────────────────────────────────────────────

/**
 * Build the list of available document types from the DB checklist library.
 * Company docs are always returned once under the generic "Company Documents"
 * category regardless of how many companies the applicant has — preventing
 * duplication in create/edit mode.
 */
export function buildDocumentTypesFromTemplates(
  groups: ChecklistDocumentGroup[],
): DocumentTypeConfig[] {
  const companyGroup = groups.find(
    (g) => g.category === ChecklistApiCategory.COMPANY,
  );
  const companyTemplateDocs =
    companyGroup?.documents.filter((d) => d.state === "active") ?? [];

  const baseDocuments = groups
    .filter((g) => g.category !== ChecklistApiCategory.COMPANY)
    .flatMap((group) =>
      group.documents
        .filter((d) => d.state === "active")
        .map((d) => ({
          category: toDisplayCategory(d.category),
          documentType: d.documentType,
          allowedDocument: d.allowedDocument,
          instruction: d.importantNote ?? undefined,
          template_id: d._id,
        })),
    );

  const companyDocuments = companyTemplateDocs.map((d) => ({
    category: ChecklistDisplayCategory.COMPANY,
    documentType: d.documentType,
    allowedDocument: d.allowedDocument,
    instruction: d.importantNote ?? undefined,
    template_id: d._id,
  }));

  return [...baseDocuments, ...companyDocuments];
}

// ─── Requirement auto-detection ────────────────────────────────────────────────

/**
 * Auto-mark document types that already have uploaded files as mandatory.
 */
export function markSubmittedDocumentsAsMandatory(
  documents: Document[],
  allDocumentTypes: DocumentTypeConfig[],
): RequirementMap {
  const requirementMap: RequirementMap = {};

  const validDocuments = documents.filter(
    (doc) => doc && typeof doc === "object" && doc.file_name,
  );

  for (const docType of allDocumentTypes) {
    const expectedDocType = docType.documentType
      .toLowerCase()
      .replace(/\s+/g, "_");

    const uploaded = validDocuments.find((doc) => {
      if (!doc.file_name) return false;

      if (doc.document_type && doc.document_type === expectedDocType) {
        if (
          isCompanyCategory(docType.category) &&
          !["Identity Documents", "Education Documents", "Other Documents"].includes(
            docType.category,
          )
        ) {
          return doc.document_category === docType.category;
        }
        return true;
      }

      return doc.file_name
        .toLowerCase()
        .includes(docType.documentType.toLowerCase());
    });

    if (uploaded) {
      requirementMap[`${docType.category}-${docType.documentType}`] =
        "mandatory";
    }
  }

  return requirementMap;
}


export function getAvailableDocumentsForEditing(
  allDocumentTypes: DocumentTypeConfig[],
  checklistItems: ChecklistItem[],
): DocumentTypeConfig[] {
  const inChecklist = new Set(
    checklistItems.map((item) => {
      let categoryLabel = toDisplayCategory(item.document_category);

      if (item.document_category === ChecklistApiCategory.COMPANY) {
        categoryLabel = item.company_name
          ? `${item.company_name} Company Documents`
          : ChecklistDisplayCategory.COMPANY;
      } else if (item.document_category.includes("Company Documents")) {
        categoryLabel = item.document_category;
      }

      return `${categoryLabel}-${item.document_type}`;
    }),
  );

  return allDocumentTypes.filter((docType) => {
    const key = `${docType.category}-${docType.documentType}`;
    if (inChecklist.has(key)) return false;

    // Extra company-specific de-dup: check both company-specific and generic keys
    if (isCompanyCategory(docType.category)) {
      const companyName = docType.category.replace(" Company Documents", "");
      if (
        inChecklist.has(
          `${companyName} Company Documents-${docType.documentType}`,
        )
      ) {
        return false;
      }
      if (
        inChecklist.has(
          `${ChecklistDisplayCategory.COMPANY}-${docType.documentType}`,
        )
      ) {
        return false;
      }
    }

    return true;
  });
}

// ─── Checklist creation ────────────────────────────────────────────────────────

export function createChecklistItemsFromDocuments(
  selectedDocuments: ChecklistDocument[],
  requirementMap: RequirementMap,
): ChecklistCreateRequest[] {
  return selectedDocuments
    .map((doc) => {
      const key = `${doc.category}-${doc.documentType}`;
      const requirement = requirementMap[key] ?? "not_required";
      const required = requirementToBoolean(requirement);

      if (required === null) return null;

      return {
        document_type: doc.documentType,
        document_category: toApiCategory(doc.category),
        required,
        company_name: doc.company_name,
        ...(doc.template_id ? { template_id: doc.template_id } : {}),
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);
}

// ─── Validation ────────────────────────────────────────────────────────────────

export function validateChecklist(selectedDocuments: ChecklistDocument[]): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!Array.isArray(selectedDocuments) || selectedDocuments.length === 0) {
    errors.push("Please select at least one document for the checklist");
    return { isValid: false, errors, warnings };
  }

  if (selectedDocuments.length > 50) {
    errors.push("Too many documents selected. Maximum allowed: 50");
    return { isValid: false, errors, warnings };
  }

  const documentKeys = new Set<string>();
  const duplicateKeys: string[] = [];

  for (const [index, doc] of selectedDocuments.entries()) {
    if (!doc.category || !doc.documentType) {
      errors.push(`Document ${index + 1}: Missing category or document type`);
      continue;
    }

    const key = `${doc.category}-${doc.documentType}`;
    if (documentKeys.has(key)) {
      duplicateKeys.push(`${doc.documentType} in ${doc.category}`);
    } else {
      documentKeys.add(key);
    }
  }

  if (duplicateKeys.length > 0) {
    errors.push(`Duplicate documents found: ${duplicateKeys.join(", ")}`);
  }

  if (selectedDocuments.length > 20) {
    warnings.push("Large number of documents selected. Save may take longer.");
  }

  return { isValid: errors.length === 0, errors, warnings };
}

export function hasCompanyDocumentsInChecklist(
  checklistItems: ChecklistItem[],
): boolean {
  return checklistItems.some((item) =>
    isCompanyCategory(item.document_category),
  );
}
