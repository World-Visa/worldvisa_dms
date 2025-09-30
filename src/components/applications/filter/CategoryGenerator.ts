import { DocumentCategoryInfo } from "@/types/documents";
import { ChecklistState, ChecklistCategory } from "@/types/checklist";

const baseCategories: DocumentCategoryInfo[] = [
  { id: "submitted", label: "Submitted Documents", count: 0 },
  { id: "all", label: "All Documents", count: 0 },
  { id: "identity", label: "Identity Documents", count: 0 },
  { id: "education", label: "Education Documents", count: 0 },
  { id: "other", label: "Other Documents", count: 0 },
  { id: "self_employment", label: "Self Employment/Freelance", count: 0 },
];

export interface CategoryGeneratorProps {
  isClientView: boolean;
  checklistState: ChecklistState;
  checklistCategories: ChecklistCategory[];
  submittedDocumentsCount: number;
}

export function generateCategories({
  isClientView,
  checklistState,
  checklistCategories,
  submittedDocumentsCount,
}: CategoryGeneratorProps): DocumentCategoryInfo[] {
  // Deduplicate checklist categories by label (most important) and then by id
  const seenLabels = new Set<string>();
  const uniqueChecklistCategories = checklistCategories.filter((cat) => {
    if (seenLabels.has(cat.label)) {
      return false; // Skip if we've already seen this label
    }
    seenLabels.add(cat.label);
    return true;
  });

  if (isClientView) {
    return generateClientCategories(
      uniqueChecklistCategories,
      submittedDocumentsCount
    );
  }

  return generateAdminCategories(checklistState, uniqueChecklistCategories);
}

function generateClientCategories(
  checklistCategories: ChecklistCategory[],
  submittedDocumentsCount: number
): DocumentCategoryInfo[] {
  if (!checklistCategories || checklistCategories.length === 0) {
    return submittedDocumentsCount > 0
      ? [
          {
            id: "submitted",
            label: "Submitted Documents",
            count: submittedDocumentsCount,
          },
        ]
      : [];
  }

  // Create a map to avoid duplicates
  const categoryMap = new Map<string, DocumentCategoryInfo>();

  if (submittedDocumentsCount > 0) {
    categoryMap.set("submitted", {
      id: "submitted",
      label: "Submitted Documents",
      count: submittedDocumentsCount,
    });
  }

  // Add checklist categories, avoiding duplicates
  checklistCategories.forEach((cat) => {
    if (!categoryMap.has(cat.id)) {
      categoryMap.set(cat.id, {
        id: cat.id,
        label: cat.label,
        count: cat.count,
        fromDate: cat.fromDate,
        toDate: cat.toDate,
        isCurrentEmployment: cat.isCurrentEmployment,
      });
    }
  });

  return Array.from(categoryMap.values());
}

function generateAdminCategories(
  checklistState: ChecklistState,
  checklistCategories: ChecklistCategory[]
): DocumentCategoryInfo[] {
  switch (checklistState) {
    case "none":
      return [{ id: "submitted", label: "Submitted Documents", count: 0 }];

    case "creating":
      return [
        { id: "all", label: "All Documents", count: 0 },
        { id: "identity", label: "Identity Documents", count: 0 },
        { id: "education", label: "Education Documents", count: 0 },
        { id: "other", label: "Other Documents", count: 0 },
        { id: "self_employment", label: "Self Employment/Freelance", count: 0 },
        { id: "company", label: "Company Documents", count: 0 },
      ];

    case "saved":
      // Create a map to avoid duplicates
      const categoryMap = new Map<string, DocumentCategoryInfo>();

      // Add submitted documents first
      categoryMap.set("submitted", {
        id: "submitted",
        label: "Submitted Documents",
        count: 0,
      });

      // Add checklist categories, avoiding duplicates
      checklistCategories.forEach((cat) => {
        if (!categoryMap.has(cat.id)) {
          categoryMap.set(cat.id, {
            id: cat.id,
            label: cat.label,
            count: cat.count,
            fromDate: cat.fromDate,
            toDate: cat.toDate,
            isCurrentEmployment: cat.isCurrentEmployment,
          });
        }
      });

      return Array.from(categoryMap.values());

    case "editing":
      return [
        { id: "submitted", label: "Submitted Documents", count: 0 },
        {
          id: "checklist",
          label: "Current Checklist",
          count: checklistCategories.reduce((sum, cat) => sum + cat.count, 0),
        },
        { id: "all", label: "All Documents", count: 0 },
        { id: "identity", label: "Identity Documents", count: 0 },
        { id: "education", label: "Education Documents", count: 0 },
        { id: "other", label: "Other Documents", count: 0 },
        { id: "self_employment", label: "Self Employment/Freelance", count: 0 },
        { id: "company", label: "Company Documents", count: 0 },
      ];

    default:
      return baseCategories;
  }
}
