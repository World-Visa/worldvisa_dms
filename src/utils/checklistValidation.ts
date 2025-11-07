import { Document } from "@/types/applications";
import { ChecklistItem } from "@/types/checklist";

/**
 * Maps category labels from API format to display format
 */
function mapCategoryLabel(category: string): string {
  if (category === "Identity") return "Identity Documents";
  if (category === "Education") return "Education Documents";
  if (category === "Other") return "Other Documents";
  if (category === "Self Employment/Freelance") return "Self Employment/Freelance";
  if (category === "Company") return "Company Documents";
  
  if (category.includes("Company Documents")) {
    return category; 
  }
  
  return category;
}


function matchesCompanyRequirement(
  doc: Document,
  checklistItem: ChecklistItem,
  categoryLabel: string,
  originalCategory: string
): boolean {
  const normalizedCategoryLabel = categoryLabel.toLowerCase();
  if (!normalizedCategoryLabel.includes("company documents")) {
    return true;
  }

  const normalizedOriginalCategory = originalCategory.toLowerCase();
  const docCategory = doc.document_category?.toLowerCase() ?? "";
  if (!docCategory.includes("company documents")) {
    return false;
  }

  const requiredCompanyName = checklistItem.company_name?.trim().toLowerCase();
  if (requiredCompanyName) {
    const docCompanyName = doc.company_name?.trim().toLowerCase();
    if (docCompanyName && docCompanyName === requiredCompanyName) {
      return true;
    }
    if (docCategory.includes(requiredCompanyName)) {
      return true;
    }
    return false;
  }

  const normalizedDocCategory = doc.document_category?.toLowerCase();
  if (normalizedDocCategory === normalizedCategoryLabel) {
    return true;
  }

  if (normalizedOriginalCategory === "company" || normalizedCategoryLabel === "company documents") {
    return docCategory.includes("company documents");
  }

  return docCategory.trim().replace(/\s+/g, " ") === normalizedCategoryLabel.trim().replace(/\s+/g, " ");
}

function matchDocumentToChecklistItem(
  doc: Document,
  checklistItem: ChecklistItem
): boolean {
  if (!doc || !doc.file_name) return false;

  const expectedDocType = checklistItem.document_type
    .toLowerCase()
    .replace(/\s+/g, "_");
  
  let categoryLabel = mapCategoryLabel(checklistItem.document_category);
    
  const docTypeFromName = doc.document_name;
  
  if (docTypeFromName) {
    const normalizedDocName = docTypeFromName.toLowerCase().replace(/\s+/g, "_");
    const normalizedExpectedType = expectedDocType.toLowerCase();
    
    if (normalizedDocName === normalizedExpectedType) {
      const docCategory = doc.document_category;
      if (docCategory) {
        if (doc.document_category === categoryLabel) {
          return matchesCompanyRequirement(doc, checklistItem, categoryLabel, checklistItem.document_category);
        }
        if (
          categoryLabel.includes("Company Documents") &&
          doc.document_category?.includes("Company Documents")
        ) {
          if (matchesCompanyRequirement(doc, checklistItem, categoryLabel, checklistItem.document_category)) {
            return true;
          }
          return false;
        }
        const mappedCategory = mapCategoryLabel(docCategory);
        if (mappedCategory === categoryLabel) {
          return matchesCompanyRequirement(doc, checklistItem, categoryLabel, checklistItem.document_category);
        }
        return false;
      }
      return matchesCompanyRequirement(doc, checklistItem, categoryLabel, checklistItem.document_category);
    }
    
    if (
      normalizedDocName.includes(normalizedExpectedType) ||
      normalizedExpectedType.includes(normalizedDocName)
    ) {
      const docCategory = doc.document_category;
      if (docCategory) {
        if (
          categoryLabel.includes("Documents") &&
          ![
            "Identity Documents",
            "Education Documents",
            "Other Documents",
          ].includes(categoryLabel)
        ) {
          // Direct match
          if (doc.document_category === categoryLabel) {
            return matchesCompanyRequirement(doc, checklistItem, categoryLabel, checklistItem.document_category);
          }
          // Check if both are company documents
          if (
            doc.document_category?.includes("Company Documents") &&
            categoryLabel.includes("Company Documents")
          ) {
          if (matchesCompanyRequirement(doc, checklistItem, categoryLabel, checklistItem.document_category)) {
              return true;
            }
            return false;
          }
          // Check mapped category
          const mappedCategory = mapCategoryLabel(docCategory);
          if (mappedCategory === categoryLabel) {
            return matchesCompanyRequirement(doc, checklistItem, categoryLabel, checklistItem.document_category);
          }
          return false;
        }
        const mappedCategory = mapCategoryLabel(docCategory);
        if (mappedCategory === categoryLabel) {
          return matchesCompanyRequirement(doc, checklistItem, categoryLabel, checklistItem.document_category);
        }
        return false;
      }
      return matchesCompanyRequirement(doc, checklistItem, categoryLabel, checklistItem.document_category);
    }
  }

  const docTypeFromField = doc.document_type;
  
  if (docTypeFromField && docTypeFromField === expectedDocType) {
    const docCategory = doc.document_category;
    if (docCategory) {
      if (doc.document_category === categoryLabel) {
        return matchesCompanyRequirement(doc, checklistItem, categoryLabel, checklistItem.document_category);
      }
      if (
        categoryLabel.includes("Company Documents") &&
        doc.document_category?.includes("Company Documents")
      ) {
          if (matchesCompanyRequirement(doc, checklistItem, categoryLabel, checklistItem.document_category)) {
          return true;
        }
        return false;
      }
      const mappedCategory = mapCategoryLabel(docCategory);
      if (mappedCategory === categoryLabel) {
        return matchesCompanyRequirement(doc, checklistItem, categoryLabel, checklistItem.document_category);
      }
      return false;
    }
    return matchesCompanyRequirement(doc, checklistItem, categoryLabel, checklistItem.document_category);
  }

  const fileName = doc.file_name.toLowerCase();
  const docTypeName = checklistItem.document_type.toLowerCase();
  const fileNameMatch = fileName.includes(docTypeName);

  if (fileNameMatch) {
    const docCategory = doc.document_category;
    if (docCategory) {
      if (doc.document_category === categoryLabel) {
        return matchesCompanyRequirement(doc, checklistItem, categoryLabel, checklistItem.document_category);
      }
      if (
        categoryLabel.includes("Company Documents") &&
        doc.document_category?.includes("Company Documents")
      ) {
        if (matchesCompanyRequirement(doc, checklistItem, categoryLabel, checklistItem.document_category)) {
          return true;
        }
        return false;
      }
      const mappedCategory = mapCategoryLabel(docCategory);
      if (mappedCategory === categoryLabel) {
        return matchesCompanyRequirement(doc, checklistItem, categoryLabel, checklistItem.document_category);
      }
      return false;
    }
    return matchesCompanyRequirement(doc, checklistItem, categoryLabel, checklistItem.document_category);
  }

  return false;
}


export function areAllMandatoryDocumentsReviewed(
  checklistItems: ChecklistItem[] | undefined,
  documents: Document[] | undefined
): boolean {
  if (!checklistItems || !Array.isArray(checklistItems) || checklistItems.length === 0) {
    return false;
  }

  const mandatoryItems = checklistItems.filter(item => item.required === true);

  if (mandatoryItems.length === 0) {
    return true;
  }

  if (!documents || !Array.isArray(documents) || documents.length === 0) {
    return false;
  }

  const validDocuments = documents.filter(
    (doc) => doc && typeof doc === "object" && doc.file_name
  );

  for (const mandatoryItem of mandatoryItems) {
    const matchingDoc = validDocuments.find((doc) =>
      matchDocumentToChecklistItem(doc, mandatoryItem)
    );

    if (!matchingDoc) {
      return false;
    }

    const docStatus = matchingDoc.status?.toLowerCase();
    if (docStatus !== "reviewed" && docStatus !== "approved") {
      return false;
    }
  }

  return true;
}

