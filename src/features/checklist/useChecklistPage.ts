'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useChecklist, useChecklistMutations } from '@/hooks/useChecklist';
import { updateChecklistRequested } from '@/lib/api/getApplicationById';
import {
  getAllDocumentTypes,
  getAvailableDocumentsForEditing,
  createChecklistItemsFromDocuments,
  validateChecklist,
  markSubmittedDocumentsAsMandatory,
} from '@/lib/checklist/utils';
import { generateChecklistCategories } from '@/lib/checklist/categoryUtils';
import {
  mapCategoryLabel,
  filterItemsByCategory,
  generateCreatingItems,
  generateEditingCurrentItems,
  generateEditingAvailableItems,
  generateSavedItems,
  matchesCategory,
} from '@/lib/checklist/dataProcessing';
import { generateCategories } from '@/components/applications/filter/CategoryGenerator';
import { useSearchMemo } from '@/lib/utils/search';
import type {
  ChecklistDocument,
  ChecklistItem,
  DocumentRequirement,
  ChecklistUpdateRequest,
} from '@/types/checklist';
import type { Document } from '@/types/applications';
import type { Company } from '@/types/documents';
import type { ChecklistPageMode } from './types';

function mapCategoryToApiFormat(category: string): string {
  switch (category) {
    case 'Identity Documents':
      return 'Identity';
    case 'Education Documents':
      return 'Education';
    case 'Other Documents':
      return 'Other';
    case 'Self Employment/Freelance':
      return 'Self Employment/Freelance';
    case 'Company':
      return 'Company';
    default:
      return category.includes('Company Documents') ? 'Company' : category;
  }
}

interface UseChecklistPageProps {
  applicationId: string;
  documents: Document[] | undefined;
  companies: Company[];
  recordType?: string;
}

export function useChecklistPage({
  applicationId,
  documents,
  companies,
  recordType = 'default_record_type',
}: UseChecklistPageProps) {
  const [mode, setMode] = useState<ChecklistPageMode>('create');
  // Default will be set via useEffect after categories are computed
  const [selectedCategory, setSelectedCategory] = useState<string>('identity');
  const [activeTab, setActiveTab] = useState<'current' | 'available'>('current');
  const [selectedDocuments, setSelectedDocuments] = useState<ChecklistDocument[]>([]);
  const [requirementMap, setRequirementMap] = useState<Record<string, DocumentRequirement>>({});
  const [pendingAdditions, setPendingAdditions] = useState<ChecklistDocument[]>([]);
  const [pendingDeletions, setPendingDeletions] = useState<string[]>([]);
  const [pendingUpdates, setPendingUpdates] = useState<
    Array<{ checklistId: string; required: boolean; documentType: string; documentCategory: string }>
  >([]);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: checklistData, isLoading: isChecklistLoading } = useChecklist(applicationId);
  const {
    batchSave,
    batchUpdate,
    batchDelete,
    isBatchSaving,
    isBatchUpdating,
    isBatchDeleting,
  } = useChecklistMutations(applicationId);

  const isSaving = isBatchSaving || isBatchUpdating || isBatchDeleting;

  const checklistItems = useMemo(() => {
    const data = checklistData?.data;
    if (!Array.isArray(data)) return [];
    return data;
  }, [checklistData]);

  const hasChecklist = useMemo(() => checklistItems.length > 0, [checklistItems]);

  // Update mode when checklist data loads
  useEffect(() => {
    if (!isChecklistLoading) {
      setMode(hasChecklist ? 'edit' : 'create');
    }
  }, [hasChecklist, isChecklistLoading]);

  const allDocumentTypes = useMemo(
    () => getAllDocumentTypes(companies),
    [companies]
  );

  const checklistCategories = useMemo(() => {
    const checklistDataForCategories = checklistData;
    const documentsData = documents?.length
      ? { data: { documents } }
      : undefined;
    return generateChecklistCategories(
      checklistDataForCategories,
      documentsData,
      companies
    );
  }, [checklistData, documents, companies]);

  const categories = useMemo(() => {
    const checklistState =
      mode === 'create'
        ? 'creating'
        : 'editing';
    const allCategories = generateCategories({
      isClientView: false,
      checklistState,
      checklistCategories,
      submittedDocumentsCount: documents?.length ?? 0,
    });
    // Filter out both 'submitted' and 'all' categories
    return allCategories.filter(cat => cat.id !== 'submitted' && cat.id !== 'all');
  }, [mode, checklistCategories, documents?.length]);

  // Compute first available category for default selection
  const firstAvailableCategory = useMemo(() => {
    if (categories.length === 0) return 'identity'; // fallback
    // Prefer 'checklist' in edit mode if available
    if (mode === 'edit') {
      const checklistCat = categories.find(cat => cat.id === 'checklist');
      if (checklistCat) return checklistCat.id;
    }
    return categories[0]?.id || 'identity';
  }, [categories, mode]);

  // Update selectedCategory if it becomes invalid (e.g., was 'all' but 'all' is now filtered out)
  // Also set initial category when categories first become available
  useEffect(() => {
    if (categories.length > 0) {
      const isValid = categories.some(cat => cat.id === selectedCategory);
      if (!isValid) {
        setSelectedCategory(firstAvailableCategory);
      }
    }
  }, [categories, selectedCategory, firstAvailableCategory]);

  const availableDocumentsForEditing = useMemo(
    () => getAvailableDocumentsForEditing(allDocumentTypes, checklistItems),
    [allDocumentTypes, checklistItems]
  );

  const currentChecklistDocuments = useMemo((): ChecklistDocument[] => {
    // Always return checklist documents when in edit mode or when checklist exists
    if (mode === 'edit' || hasChecklist) {
      return checklistItems.map((item: ChecklistItem) => ({
        category: mapCategoryLabel(item.document_category),
        documentType: item.document_type,
        isUploaded: false,
        uploadedDocument: undefined,
        requirement: (item.required ? 'mandatory' : 'optional') as DocumentRequirement,
        checklist_id: item.checklist_id,
        company_name: item.company_name,
        description: item.description,
      }));
    }
    return [];
  }, [mode, checklistItems, hasChecklist]);

  const filteredDocuments = useMemo(() => {
    if (mode === 'create') return allDocumentTypes;
    if (mode === 'edit') return availableDocumentsForEditing;
    return [];
  }, [mode, allDocumentTypes, availableDocumentsForEditing]);

  const checklistState = mode === 'create' ? 'creating' : mode === 'edit' ? 'editing' : 'saved';

  const creatingItems = useMemo(
    () =>
      generateCreatingItems(
        checklistState,
        filteredDocuments,
        requirementMap,
        selectedDocuments
      ),
    [checklistState, filteredDocuments, requirementMap, selectedDocuments]
  );

  const editingCurrentItems = useMemo(
    () => generateEditingCurrentItems(checklistState, currentChecklistDocuments),
    [checklistState, currentChecklistDocuments]
  );

  const editingAvailableItems = useMemo(
    () =>
      generateEditingAvailableItems(
        checklistState,
        availableDocumentsForEditing,
        requirementMap,
        pendingAdditions
      ),
    [
      checklistState,
      availableDocumentsForEditing,
      requirementMap,
      pendingAdditions,
    ]
  );

  const savedItems = useMemo(
    () =>
      generateSavedItems(
        checklistState,
        checklistData,
        documents ?? [],
        selectedCategory,
        companies
      ),
    [checklistState, checklistData, documents, selectedCategory, companies]
  );

  const checklistTableItems = useMemo(() => {
    if (mode === 'create') return creatingItems;
    if (mode === 'edit') {
      return activeTab === 'current' ? editingCurrentItems : editingAvailableItems;
    }
    return [];
  }, [
    mode,
    activeTab,
    creatingItems,
    editingCurrentItems,
    editingAvailableItems,
  ]);

  const categoryFilteredItems = useMemo(
    () => filterItemsByCategory(checklistTableItems, selectedCategory),
    [checklistTableItems, selectedCategory]
  );

  const filteredItems = useSearchMemo(
    categoryFilteredItems,
    searchQuery,
    (item) => item.documentType,
    { keys: ['documentType'], threshold: 0.3 }
  );

  const tabCounts = useMemo(() => {
    if (mode !== 'edit') return { currentCount: 0, availableCount: 0 };
    const currentCount = currentChecklistDocuments.filter((item) =>
      matchesCategory(item.category, selectedCategory)
    ).length;
    const availableCount = availableDocumentsForEditing.filter((item) =>
      matchesCategory(item.category, selectedCategory)
    ).length;
    return { currentCount, availableCount };
  }, [mode, currentChecklistDocuments, availableDocumentsForEditing, selectedCategory]);

  const startCreating = useCallback(() => {
    setMode('create');
    // Will be set to first available category via useEffect
    setSelectedDocuments([]);
    const autoRequirements = markSubmittedDocumentsAsMandatory(documents ?? [], allDocumentTypes);
    setRequirementMap(autoRequirements);
    const submitted: ChecklistDocument[] = [];
    Object.entries(autoRequirements).forEach(([key, req]) => {
      if (req === 'mandatory') {
        const [cat, docType] = key.split('-');
        submitted.push({
          category: cat,
          documentType: docType,
          isUploaded: true,
          company_name: cat.includes('Company Documents')
            ? companies.find((c) => c.category === cat)?.name
            : undefined,
        });
      }
    });
    setSelectedDocuments(submitted);
  }, [documents, allDocumentTypes, companies]);

  const startEditing = useCallback(() => {
    setMode('edit');
    // Will be set to first available category via useEffect
    setActiveTab('current');
    setPendingAdditions([]);
    setPendingDeletions([]);
    setPendingUpdates([]);
  }, []);

  const cancel = useCallback(() => {
    // Reset to appropriate mode based on checklist existence
    setMode(hasChecklist ? 'edit' : 'create');
    // Will be set to first available category via useEffect
    setPendingAdditions([]);
    setPendingDeletions([]);
    setPendingUpdates([]);
    setSelectedDocuments([]);
    setRequirementMap({});
  }, [hasChecklist]);

  const handleCategoryChange = useCallback((category: string) => {
    setSelectedCategory(category);
  }, []);

  const handleTabChange = useCallback((tab: 'current' | 'available') => {
    setActiveTab(tab);
  }, []);

  const updateDocumentRequirement = useCallback(
    (category: string, documentType: string, requirement: DocumentRequirement) => {
      const key = `${category}-${documentType}`;
      setRequirementMap((prev) => ({ ...prev, [key]: requirement }));

      if (mode === 'create') {
        if (requirement === 'not_required') {
          setSelectedDocuments((prev) =>
            prev.filter((d) => !(d.category === category && d.documentType === documentType))
          );
        } else {
          setSelectedDocuments((prev) => {
            const exists = prev.some((d) => d.category === category && d.documentType === documentType);
            if (exists) return prev;
            return [
              ...prev,
              {
                category,
                documentType,
                isUploaded: false,
                company_name: category.includes('Company Documents')
                  ? companies.find((c) => c.category === category)?.name
                  : undefined,
              },
            ];
          });
        }
      } else if (mode === 'edit') {
        if (requirement === 'not_required') {
          setPendingAdditions((prev) =>
            prev.filter((d) => !(d.category === category && d.documentType === documentType))
          );
        } else {
          const inChecklist = checklistItems.some(
            (i) => i.document_category === category && i.document_type === documentType
          );
          if (!inChecklist) {
            setPendingAdditions((prev) => {
              const exists = prev.some((d) => d.category === category && d.documentType === documentType);
              if (exists) {
                return prev.map((d) =>
                  d.category === category && d.documentType === documentType
                    ? { ...d, requirement }
                    : d
                );
              }
              return [
                ...prev,
                {
                  category,
                  documentType,
                  requirement,
                  isUploaded: false,
                  company_name: category.includes('Company Documents')
                    ? companies.find((c) => c.category === category)?.name
                    : undefined,
                },
              ];
            });
          } else {
            const item = checklistItems.find(
              (i) => i.document_category === category && i.document_type === documentType
            );
            const cid = item?.checklist_id;
            if (cid) {
              setPendingUpdates((prev) => {
                const existing = prev.find((p) => p.checklistId === cid);
                if (existing) {
                  return prev.map((p) =>
                    p.checklistId === cid ? { ...p, required: requirement === 'mandatory' } : p
                  );
                }
                return [
                  ...prev,
                  {
                    checklistId: cid,
                    required: requirement === 'mandatory',
                    documentType: item.document_type,
                    documentCategory: item.document_category,
                  },
                ];
              });
            }
          }
        }
      }
    },
    [mode, companies, checklistItems]
  );

  const addToPendingChanges = useCallback((document: ChecklistDocument) => {
    setPendingAdditions((prev) => {
      const exists = prev.some(
        (d) => d.category === document.category && d.documentType === document.documentType
      );
      if (exists) return prev;
      return [...prev, document];
    });
  }, []);

  const removeFromPendingChanges = useCallback((document: ChecklistDocument) => {
    setPendingAdditions((prev) =>
      prev.filter((d) => !(d.category === document.category && d.documentType === document.documentType))
    );
  }, []);

  const addToPendingDeletions = useCallback((checklistId: string) => {
    setPendingDeletions((prev) => (prev.includes(checklistId) ? prev : [...prev, checklistId]));
  }, []);

  const removeFromPendingDeletions = useCallback((checklistId: string) => {
    setPendingDeletions((prev) => prev.filter((id) => id !== checklistId));
  }, []);

  const clearPendingChanges = useCallback(() => {
    setPendingAdditions([]);
    setPendingDeletions([]);
    setPendingUpdates([]);
  }, []);

  const saveChecklist = useCallback(async () => {
    if (mode !== 'create') return;
    const validation = validateChecklist(selectedDocuments);
    if (!validation.isValid) throw new Error(validation.errors.join(', '));
    const items = createChecklistItemsFromDocuments(selectedDocuments, requirementMap);
    if (items.length === 0) throw new Error('No valid checklist items to save');
    await batchSave.mutateAsync(items);
    try {
      await updateChecklistRequested(applicationId, false, recordType);
    } catch {
      // non-blocking
    }
    // After creating, switch to edit mode
    setMode('edit');
    setSelectedDocuments([]);
    setRequirementMap({});
  }, [
    mode,
    selectedDocuments,
    requirementMap,
    batchSave,
    applicationId,
    recordType,
  ]);

  const savePendingChanges = useCallback(async () => {
    if (mode !== 'edit') return;
    const toAdd = pendingAdditions.map((d) => ({
      document_type: d.documentType,
      document_category: mapCategoryToApiFormat(d.category),
      required: d.requirement === 'mandatory',
      company_name: d.company_name,
    }));
    const toUpdate: ChecklistUpdateRequest[] = pendingUpdates.map((u) => ({
      checklist_id: u.checklistId,
      document_type: u.documentType,
      document_category: mapCategoryToApiFormat(u.documentCategory),
      required: u.required,
    }));

    if (toAdd.length) await batchSave.mutateAsync(toAdd);
    if (toUpdate.length) await batchUpdate.mutateAsync(toUpdate);
    if (pendingDeletions.length) await batchDelete.mutateAsync(pendingDeletions);

    try {
      await updateChecklistRequested(applicationId, false, recordType);
    } catch {
      // non-blocking
    }
    clearPendingChanges();
    // Stay in edit mode after saving
    setMode('edit');
  }, [
    mode,
    pendingAdditions,
    pendingUpdates,
    pendingDeletions,
    batchSave,
    batchUpdate,
    batchDelete,
    applicationId,
    recordType,
    clearPendingChanges,
  ]);

  const handleSave = useCallback(async () => {
    if (mode === 'create') await saveChecklist();
    else if (mode === 'edit') await savePendingChanges();
  }, [mode, saveChecklist, savePendingChanges]);

  return {
    mode,
    hasChecklist,
    isChecklistLoading,
    isSaving,
    categories,
    selectedCategory,
    activeTab,
    searchQuery,
    setSearchQuery,
    checklistData,
    checklistItems,
    currentChecklistDocuments,
    availableDocumentsForEditing,
    filteredDocuments,
    categoryFilteredItems,
    filteredItems,
    allDocumentTypes,
    selectedDocuments,
    requirementMap,
    pendingAdditions,
    pendingDeletions,
    pendingUpdates,
    tabCounts,
    startCreating,
    startEditing,
    cancel,
    handleCategoryChange,
    handleTabChange,
    updateDocumentRequirement,
    addToPendingChanges,
    removeFromPendingChanges,
    addToPendingDeletions,
    removeFromPendingDeletions,
    clearPendingChanges,
    handleSave,
    companies,
  };
}
