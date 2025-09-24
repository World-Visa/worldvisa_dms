import { Company } from '@/types/documents';

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
  type: 'base' | 'company';
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
  finalCompanies: Company[]
): ChecklistCategory[] {
  if (!Array.isArray(checklistData?.data)) {
    return [];
  }

  const categoryMap = new Map<string, ChecklistCategory>();
  
  // Process base categories (Identity, Education, Other)
  checklistData.data.forEach(item => {
    const categoryKey = item.document_category;
    
    // Skip company documents - they will be handled separately
    if (categoryKey === 'Company' || categoryKey === 'Company Documents') {
      return;
    }
    
    // Create a consistent key for the category
    let displayLabel = categoryKey;
    if (categoryKey === 'Identity') {
      displayLabel = 'Identity Documents';
    } else if (categoryKey === 'Education') {
      displayLabel = 'Education Documents';
    } else if (categoryKey === 'Other') {
      displayLabel = 'Other Documents';
    } else if (categoryKey === 'Self Employment/Freelance') {
      displayLabel = 'Self Employment/Freelance';
    }
    
    // Use the display label as the key to avoid duplicates
    if (!categoryMap.has(displayLabel)) {
      categoryMap.set(displayLabel, {
        id: displayLabel.toLowerCase().replace(/\s+/g, '_'),
        label: displayLabel,
        count: 0,
        type: 'base',
        is_selected: true
      });
    }
    
    const category = categoryMap.get(displayLabel)!;
    category.count++;
  });
  
  // Extract company categories from uploaded documents
  const companyCategories = new Set<string>();
  
  // Get company categories from uploaded documents
  if (documentsData?.data?.documents) {
    documentsData.data.documents.forEach((doc: ClientDocument) => {
      if (doc.document_category && doc.document_category.includes('Company Documents')) {
        companyCategories.add(doc.document_category);
      }
    });
  }
  
  // Add company categories from finalCompanies (prioritize API data)
  // This will handle both uploaded documents and API data
  finalCompanies.forEach(company => {
    const companyCategoryKey = company.category; // e.g., "WorldVisa Company Documents"
    
    // Count items for this specific company
    let companyItems = checklistData?.data?.filter(item => 
      item.document_category === 'Company' && 
      item.company_name === company.name
    );
    
    // If no items found by company_name, fall back to counting all company items
    if (companyItems?.length === 0) {
      companyItems = checklistData?.data?.filter(item => item.document_category === 'Company');
    }
    
    // Always add company category from finalCompanies, even if no documents
    // This will override any locally generated data with API data
    categoryMap.set(companyCategoryKey, {
      id: companyCategoryKey.toLowerCase().replace(/\s+/g, '_'),
      label: companyCategoryKey,
      count: companyItems?.length || 0,
      type: 'company',
      company_name: company.name,
      is_selected: true,
      fromDate: company.fromDate,
      toDate: company.toDate || undefined,
      isCurrentEmployment: company.isCurrentEmployment
    });
  });
  
  // Add any additional company categories from uploaded documents that aren't in finalCompanies
  companyCategories.forEach(companyCategory => {
    // Only add if not already added from finalCompanies
    if (!categoryMap.has(companyCategory)) {
      const companyName = companyCategory.replace(' Company Documents', '');
      
      // Count items for this specific company
      let companyItems = checklistData?.data?.filter(item => 
        item.document_category === 'Company' && 
        item.company_name === companyName
      );
      
      // If no items found by company_name, fall back to counting all company items
      if (companyItems?.length === 0) {
        companyItems = checklistData?.data?.filter(item => item.document_category === 'Company');
      }
      
      // Find the company data to get dates
      const companyData = finalCompanies.find(company => company.name === companyName);
      
      // Add company category
      categoryMap.set(companyCategory, {
        id: companyCategory.toLowerCase().replace(/\s+/g, '_'),
        label: companyCategory,
        count: companyItems?.length || 0,
        type: 'company',
        company_name: companyName,
        is_selected: true,
        fromDate: companyData?.fromDate,
        toDate: companyData?.toDate || undefined,
        isCurrentEmployment: companyData?.isCurrentEmployment
      });
    }
  });
  
  return Array.from(categoryMap.values());
}
