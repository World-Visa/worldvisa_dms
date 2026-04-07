import type { Company } from "@/types/documents";
import {
  toDisplayCategory,
  isCompanyCategory,
  ChecklistApiCategory,
} from "@/lib/constants/checklistCategories";

interface ChecklistItem {
  document_category: string;
  company_name?: string;
}

interface ClientDocument {
  document_category?: string;
}

interface ChecklistCategory {
  id: string;
  label: string;
  count: number;
  type: "base" | "company";
  company_name?: string;
  is_selected: boolean;
  fromDate?: string;
  toDate?: string;
  isCurrentEmployment?: boolean;
}

interface ClientDocumentsResponse {
  data?: {
    documents?: ClientDocument[];
  };
}

interface ChecklistData {
  data?: ChecklistItem[];
}

export function generateChecklistCategories(
  checklistData: ChecklistData | undefined,
  documentsData: ClientDocumentsResponse | undefined,
  finalCompanies: Company[],
): ChecklistCategory[] {
  const items = Array.isArray(checklistData?.data) ? checklistData.data : [];
  const categoryMap = new Map<string, ChecklistCategory>();

  // Base categories (Identity, Education, Other, Self Employment)
  for (const item of items) {
    const key = item.document_category;
    if (isCompanyCategory(key)) continue;

    const displayLabel = toDisplayCategory(key);
    if (!categoryMap.has(displayLabel)) {
      categoryMap.set(displayLabel, {
        id: displayLabel.toLowerCase().replace(/\s+/g, "_"),
        label: displayLabel,
        count: 0,
        type: "base",
        is_selected: true,
      });
    }
    categoryMap.get(displayLabel)!.count++;
  }

  // Company categories from uploaded documents
  const companyCategoriesFromDocs = new Set<string>();
  for (const doc of documentsData?.data?.documents ?? []) {
    if (doc.document_category?.includes("Company Documents")) {
      companyCategoriesFromDocs.add(doc.document_category);
    }
  }

  // Company categories from API companies data (takes precedence / overrides)
  for (const company of finalCompanies) {
    const companyKey = company.category;
    const companyItemCount = items.filter(
      (i) =>
        i.document_category === ChecklistApiCategory.COMPANY &&
        i.company_name === company.name,
    ).length;

    categoryMap.set(companyKey, {
      id: companyKey.toLowerCase().replace(/\s+/g, "_"),
      label: companyKey,
      count: companyItemCount,
      type: "company",
      company_name: company.name,
      is_selected: true,
      fromDate: company.fromDate,
      toDate: company.toDate ?? undefined,
      isCurrentEmployment: company.isCurrentEmployment,
    });
  }

  // Any company categories from uploaded docs not already covered
  for (const companyCategory of companyCategoriesFromDocs) {
    if (categoryMap.has(companyCategory)) continue;

    const companyName = companyCategory.replace(" Company Documents", "");
    const companyData = finalCompanies.find((c) => c.name === companyName);
    const companyItemCount = items.filter(
      (i) =>
        i.document_category === ChecklistApiCategory.COMPANY &&
        i.company_name === companyName,
    ).length;

    categoryMap.set(companyCategory, {
      id: companyCategory.toLowerCase().replace(/\s+/g, "_"),
      label: companyCategory,
      count: companyItemCount,
      type: "company",
      company_name: companyName,
      is_selected: true,
      fromDate: companyData?.fromDate,
      toDate: companyData?.toDate ?? undefined,
      isCurrentEmployment: companyData?.isCurrentEmployment,
    });
  }

  return Array.from(categoryMap.values());
}
