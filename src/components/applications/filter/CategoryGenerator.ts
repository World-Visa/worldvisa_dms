import { DocumentCategoryInfo } from '@/types/documents';
import { ChecklistState, ChecklistCategory } from '@/types/checklist';

const baseCategories: DocumentCategoryInfo[] = [
  { id: 'submitted', label: 'Submitted Documents', count: 0 },
  { id: 'all', label: 'All Documents', count: 0 },
  { id: 'identity', label: 'Identity Documents', count: 0 },
  { id: 'education', label: 'Education Documents', count: 0 },
  { id: 'other', label: 'Other Documents', count: 0 },
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
  submittedDocumentsCount
}: CategoryGeneratorProps): DocumentCategoryInfo[] {
  if (isClientView) {
    return generateClientCategories(checklistCategories, submittedDocumentsCount);
  }
  
  return generateAdminCategories(checklistState, checklistCategories);
}

function generateClientCategories(
  checklistCategories: ChecklistCategory[],
  submittedDocumentsCount: number
): DocumentCategoryInfo[] {
  if (!checklistCategories || checklistCategories.length === 0) {
    return submittedDocumentsCount > 0 
      ? [{ id: 'submitted', label: 'Submitted Documents', count: submittedDocumentsCount }]
      : [];
  }

  const categories: DocumentCategoryInfo[] = [];

  if (submittedDocumentsCount > 0) {
    categories.push({ id: 'submitted', label: 'Submitted Documents', count: submittedDocumentsCount });
  }

  categories.push(...checklistCategories.map(cat => ({
    id: cat.id,
    label: cat.label,
    count: cat.count,
    fromDate: cat.fromDate,
    toDate: cat.toDate
  })));

  return categories;
}

function generateAdminCategories(
  checklistState: ChecklistState,
  checklistCategories: ChecklistCategory[]
): DocumentCategoryInfo[] {
  switch (checklistState) {
    case 'none':
      return [{ id: 'submitted', label: 'Submitted Documents', count: 0 }];

    case 'creating':
      return [
        { id: 'all', label: 'All Documents', count: 0 },
        { id: 'identity', label: 'Identity Documents', count: 0 },
        { id: 'education', label: 'Education Documents', count: 0 },
        { id: 'other', label: 'Other Documents', count: 0 },
        { id: 'company', label: 'Company Documents', count: 0 }
      ];

    case 'saved':
      return [
        { id: 'submitted', label: 'Submitted Documents', count: 0 },
        ...checklistCategories.map(cat => ({
          id: cat.id,
          label: cat.label,
          count: cat.count,
          fromDate: cat.fromDate,
          toDate: cat.toDate
        }))
      ];

    case 'editing':
      return [
        { id: 'submitted', label: 'Submitted Documents', count: 0 },
        { id: 'checklist', label: 'Current Checklist', count: checklistCategories.reduce((sum, cat) => sum + cat.count, 0) },
        { id: 'all', label: 'All Documents', count: 0 },
        { id: 'identity', label: 'Identity Documents', count: 0 },
        { id: 'education', label: 'Education Documents', count: 0 },
        { id: 'other', label: 'Other Documents', count: 0 },
        { id: 'company', label: 'Company Documents', count: 0 }
      ];

    default:
      return baseCategories;
  }
}
