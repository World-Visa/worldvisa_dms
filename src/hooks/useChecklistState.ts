/**
 * Checklist State Management Hook
 *
 * This hook manages the complex state for the dynamic checklist system,
 * including creation, editing, and persistence of checklist data.
 */
import { useState, useEffect, useCallback, useMemo } from "react";
import { useChecklist, useChecklistMutations } from "./useChecklist";
import { localStorageUtils } from "@/lib/localStorage";
import type {
  ChecklistState,
  ChecklistStateData,
  ChecklistDocument,
  DocumentRequirement,
  ChecklistUpdateRequest,
} from "@/types/checklist";
import type { Document } from "@/types/applications";
import type { Company } from "@/types/documents";
import {
  getAllDocumentTypes,
  markSubmittedDocumentsAsMandatory,
  hasCompanyDocumentsInChecklist,
  getAvailableDocumentsForEditing,
  createChecklistItemsFromDocuments,
  validateChecklist,
} from "@/lib/checklist/utils";
import { generateChecklistCategories } from "@/lib/checklist/categoryUtils";
import { updateChecklistRequested } from "@/lib/api/getApplicationById";

interface UseChecklistStateProps {
  applicationId: string;
  documents: Document[] | undefined;
  companies: Company[];
  recordType?: string;
}

export function useChecklistState({
  applicationId,
  documents,
  companies,
  recordType = "default_record_type",
}: UseChecklistStateProps) {
  // Core state
  const [state, setState] = useState<ChecklistState>("none");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedDocuments, setSelectedDocuments] = useState<
    ChecklistDocument[]
  >([]);
  const [requirementMap, setRequirementMap] = useState<
    Record<string, DocumentRequirement>
  >({});

  // Pending changes for editing mode
  const [pendingAdditions, setPendingAdditions] = useState<ChecklistDocument[]>(
    [],
  );
  const [pendingDeletions, setPendingDeletions] = useState<string[]>([]);
  const [pendingUpdates, setPendingUpdates] = useState<
    Array<{
      checklistId: string;
      required: boolean;
      documentType: string;
      documentCategory: string;
    }>
  >([]);

  // API hooks
  const { data: checklistData, isLoading: isChecklistLoading } =
    useChecklist(applicationId);
  const {
    batchSave,
    batchUpdate,
    batchDelete,
    isBatchSaving,
    isBatchDeleting,
  } = useChecklistMutations(applicationId);

  // Get all available document types
  const allDocumentTypes = useMemo(
    () => getAllDocumentTypes(companies),
    [companies],
  );

  // Get checklist items from API
  const checklistItems = useMemo(() => {
    const data = checklistData?.data;
    if (Array.isArray(data)) {
      return data;
    }
    console.warn("useChecklistState: checklistData.data is not an array", data);
    return [];
  }, [checklistData]);

  // Check if checklist exists
  const hasChecklist = useMemo(
    () => checklistItems.length > 0,
    [checklistItems],
  );

  // Check if company documents are in checklist
  const hasCompanyDocuments = useMemo(
    () => hasCompanyDocumentsInChecklist(checklistItems),
    [checklistItems],
  );

  // Generate categories for saved checklist using the same function as client side
  const checklistCategories = useMemo(() => {
    // Convert checklistItems to the format expected by the client-side function
    const checklistData = { data: checklistItems };

    // Convert documents to the format expected by the client-side function
    const documentsData = documents
      ? { data: { documents: documents } }
      : undefined;

    return generateChecklistCategories(checklistData, documentsData, companies);
  }, [checklistItems, companies, documents]);

  // Get available documents for editing
  const availableDocumentsForEditing = useMemo(
    () => getAvailableDocumentsForEditing(allDocumentTypes, checklistItems),
    [allDocumentTypes, checklistItems],
  );

  // Load state from localStorage on mount
  useEffect(() => {
    if (!applicationId) return;

    // If we have checklist data from API, set state to 'saved'
    if (hasChecklist) {
      setState("saved");
      setSelectedCategories([]);
      setSelectedDocuments([]);
      setRequirementMap({});
      // Clear any temporary localStorage state when we have saved checklist
      localStorageUtils.saveChecklistState(applicationId, {
        state: "saved",
        selectedCategories: [],
        selectedDocuments: [],
        companyDocumentsSelected: false,
        lastSavedAt: new Date().toISOString(),
      });
      return;
    }

    // Otherwise, load from localStorage
    const savedState = localStorageUtils.loadChecklistState(
      applicationId,
      {},
    ) as ChecklistStateData;
    if (savedState && typeof savedState === "object" && "state" in savedState) {
      setState(savedState.state);
      setSelectedCategories(savedState.selectedCategories || []);
      setSelectedDocuments(savedState.selectedDocuments || []);
      setRequirementMap(
        (savedState as unknown as ChecklistStateData).requirementMap || {},
      );
    }
  }, [applicationId, hasChecklist, checklistData, checklistItems.length]);

  // Auto-mark submitted documents as mandatory when creating checklist
  useEffect(() => {
    if (state === "creating" && documents && allDocumentTypes.length > 0) {
      const autoRequirements = markSubmittedDocumentsAsMandatory(
        documents,
        allDocumentTypes,
      );
      setRequirementMap((prev) => ({ ...prev, ...autoRequirements }));

      // Also add submitted documents to selectedDocuments
      const submittedDocuments: ChecklistDocument[] = [];
      Object.entries(autoRequirements).forEach(([key, requirement]) => {
        if (requirement === "mandatory") {
          const [category, documentType] = key.split("-");
          submittedDocuments.push({
            category,
            documentType,
            isUploaded: true,
            company_name: category.includes("Company Documents")
              ? companies.find((c) => c.category === category)?.name
              : undefined,
          });
        }
      });

      setSelectedDocuments((prev) => {
        // Merge with existing selected documents, avoiding duplicates
        const existingKeys = new Set(
          prev.map((doc) => `${doc.category}-${doc.documentType}`),
        );
        const newDocuments = submittedDocuments.filter(
          (doc) => !existingKeys.has(`${doc.category}-${doc.documentType}`),
        );
        return [...prev, ...newDocuments];
      });
    }
  }, [state, documents, allDocumentTypes, companies]);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (!applicationId) return;

    const stateData: ChecklistStateData = {
      state,
      selectedCategories,
      selectedDocuments,
      companyDocumentsSelected: selectedCategories.includes("company"),
      lastSavedAt: new Date().toISOString(),
    };

    localStorageUtils.saveChecklistState(applicationId, stateData);
  }, [applicationId, state, selectedCategories, selectedDocuments]);

  // Actions
  const startCreatingChecklist = useCallback(() => {
    setState("creating");
    setSelectedCategories(["all"]); // Start with 'all' selected to show all documents
    setSelectedDocuments([]);
    setRequirementMap({});
  }, []);

  const startEditingChecklist = useCallback(() => {
    setState("editing");
    setSelectedCategories([]);
    setSelectedDocuments([]);
    setRequirementMap({});
  }, []);

  const cancelChecklistOperation = useCallback(() => {
    if (hasChecklist) {
      setState("saved");
    } else {
      setState("none");
    }
    setSelectedCategories([]);
    setSelectedDocuments([]);
    setRequirementMap({});
  }, [hasChecklist]);

  const selectCategory = useCallback((categoryId: string) => {
    setSelectedCategories((prev) => {
      if (prev.includes(categoryId)) {
        return prev.filter((id) => id !== categoryId);
      } else {
        return [...prev, categoryId];
      }
    });
  }, []);

  const selectDocument = useCallback((document: ChecklistDocument) => {
    setSelectedDocuments((prev) => {
      const exists = prev.some(
        (doc) =>
          doc.category === document.category &&
          doc.documentType === document.documentType,
      );

      if (exists) {
        return prev.filter(
          (doc) =>
            !(
              doc.category === document.category &&
              doc.documentType === document.documentType
            ),
        );
      } else {
        return [...prev, document];
      }
    });
  }, []);

  // Add document to pending additions (for editing mode)
  const addToPendingChanges = useCallback((document: ChecklistDocument) => {
    setPendingAdditions((prev) => {
      const exists = prev.some(
        (doc) =>
          doc.category === document.category &&
          doc.documentType === document.documentType,
      );

      if (!exists) {
        return [...prev, document];
      }
      return prev;
    });
  }, []);

  // Remove document from pending additions
  const removeFromPendingChanges = useCallback(
    (document: ChecklistDocument) => {
      setPendingAdditions((prev) =>
        prev.filter(
          (doc) =>
            !(
              doc.category === document.category &&
              doc.documentType === document.documentType
            ),
        ),
      );
    },
    [],
  );

  // Add document to pending deletions
  const addToPendingDeletions = useCallback((checklistId: string) => {
    setPendingDeletions((prev) => {
      if (!prev.includes(checklistId)) {
        return [...prev, checklistId];
      }
      return prev;
    });
  }, []);

  // Remove document from pending deletions
  const removeFromPendingDeletions = useCallback((checklistId: string) => {
    setPendingDeletions((prev) => prev.filter((id) => id !== checklistId));
  }, []);

  // Clear all pending changes
  const clearPendingChanges = useCallback(() => {
    setPendingAdditions([]);
    setPendingDeletions([]);
    setPendingUpdates([]);
  }, []);

  const updateDocumentRequirement = useCallback(
    (
      category: string,
      documentType: string,
      requirement: DocumentRequirement,
    ) => {
      const key = `${category}-${documentType}`;

      // Update requirement map
      setRequirementMap((prev) => ({
        ...prev,
        [key]: requirement,
      }));

      if (state === "creating") {
        // Creation mode: Update selected documents
        setSelectedDocuments((prev) => {
          const documentExists = prev.some(
            (doc) =>
              doc.category === category && doc.documentType === documentType,
          );

          if (requirement === "not_required") {
            // Remove from selected documents if marked as not required
            return prev.filter(
              (doc) =>
                !(
                  doc.category === category && doc.documentType === documentType
                ),
            );
          } else {
            // Add to selected documents if marked as mandatory or optional
            if (!documentExists) {
              const newDocument: ChecklistDocument = {
                category,
                documentType,
                isUploaded: false, // New documents are not uploaded yet
                company_name: category.includes("Company Documents")
                  ? companies.find((c) => c.category === category)?.name
                  : undefined,
              };
              return [...prev, newDocument];
            }
            return prev;
          }
        });
      } else if (state === "editing") {
        // Editing mode: Handle requirement changes for existing or new documents
        if (requirement === "not_required") {
          // Remove from pending additions if it was there
          setPendingAdditions((prev) =>
            prev.filter(
              (doc) =>
                !(
                  doc.category === category && doc.documentType === documentType
                ),
            ),
          );
        } else {
          // Check if document exists in current checklist
          const existsInChecklist = checklistItems.some(
            (item) =>
              item.document_category === category &&
              item.document_type === documentType,
          );

          if (!existsInChecklist) {
            // Document doesn't exist in checklist, add to pending additions
            const newDocument: ChecklistDocument = {
              category,
              documentType,
              requirement,
              isUploaded: false,
              company_name: category.includes("Company Documents")
                ? companies.find((c) => c.category === category)?.name
                : undefined,
            };

            setPendingAdditions((prev) => {
              const existsInPending = prev.some(
                (doc) =>
                  doc.category === category &&
                  doc.documentType === documentType,
              );

              if (!existsInPending) {
                return [...prev, newDocument];
              } else {
                // Update existing pending addition with new requirement
                return prev.map((doc) =>
                  doc.category === category && doc.documentType === documentType
                    ? { ...doc, requirement }
                    : doc,
                );
              }
            });
          } else {
            // Document exists in checklist, add to pending updates
            const existingItem = checklistItems.find(
              (item) =>
                item.document_category === category &&
                item.document_type === documentType,
            );

            if (existingItem && existingItem.checklist_id) {
              const required = requirement === "mandatory";
              const checklistId = existingItem.checklist_id;
              const documentType = existingItem.document_type;
              const documentCategory = existingItem.document_category;

              setPendingUpdates((prev) => {
                const existsInUpdates = prev.some(
                  (update) => update.checklistId === checklistId,
                );

                if (!existsInUpdates) {
                  return [
                    ...prev,
                    { checklistId, required, documentType, documentCategory },
                  ];
                } else {
                  // Update existing pending update
                  return prev.map((update) =>
                    update.checklistId === checklistId
                      ? { ...update, required }
                      : update,
                  );
                }
              });
            }
          }
        }
      }
    },
    [companies, state, checklistItems],
  );

  const saveChecklist = useCallback(async () => {
    const validation = validateChecklist(selectedDocuments);
    if (!validation.isValid) {
      throw new Error(validation.errors.join(", "));
    }

    // Log warnings if any (for debugging purposes)
    if (validation.warnings.length > 0) {
      console.warn("Checklist validation warnings:", validation.warnings);
    }

    const checklistItems = createChecklistItemsFromDocuments(
      selectedDocuments,
      requirementMap,
    );

    // Additional validation for the created items
    if (checklistItems.length === 0) {
      throw new Error(
        "No valid checklist items could be created from the selected documents",
      );
    }

    await batchSave.mutateAsync(checklistItems);

    // Update checklistRequested to false since checklist has been created
    try {
      await updateChecklistRequested(applicationId, false, recordType);
    } catch (error) {
      console.error("Failed to update checklistRequested status:", error);
      // Don't throw here as the checklist was already saved successfully
    }

    setState("saved");
    setSelectedCategories([]);
    setSelectedDocuments([]);
    setRequirementMap({});
  }, [selectedDocuments, requirementMap, batchSave, applicationId, recordType]);

  const updateChecklist = useCallback(
    async (
      itemsToUpdate: ChecklistUpdateRequest[],
      itemsToDelete: string[],
    ) => {
      const promises = [];

      if (itemsToUpdate.length > 0) {
        promises.push(batchUpdate.mutateAsync(itemsToUpdate));
      }

      if (itemsToDelete.length > 0) {
        promises.push(batchDelete.mutateAsync(itemsToDelete));
      }

      await Promise.all(promises);

      setState("saved");
      setSelectedCategories([]);
      setSelectedDocuments([]);
      setRequirementMap({});
    },
    [batchUpdate, batchDelete],
  );

  // Save pending changes (for editing mode)
  const savePendingChanges = useCallback(async () => {
    if (state !== "editing") return;

    try {
      // Convert pending additions to update requests
      const itemsToAdd = pendingAdditions.map((doc) => ({
        document_type: doc.documentType,
        document_category: doc.category,
        required: doc.requirement === "mandatory",
        company_name: doc.company_name,
      }));

      // Convert pending updates to update requests
      const itemsToUpdate = pendingUpdates.map((update) => ({
        checklist_id: update.checklistId,
        document_type: update.documentType,
        document_category: update.documentCategory,
        required: update.required,
      }));

      // Save additions
      if (itemsToAdd.length > 0) {
        await batchSave.mutateAsync(itemsToAdd);
      }

      // Save updates
      if (itemsToUpdate.length > 0) {
        await batchUpdate.mutateAsync(itemsToUpdate);
      }

      // Save deletions
      if (pendingDeletions.length > 0) {
        await batchDelete.mutateAsync(pendingDeletions);
      }

      // Update Checklist_Requested to false since checklist has been updated
      try {
        await updateChecklistRequested(applicationId, false, recordType);
      } catch (error) {
        console.error("Failed to update Checklist_Requested status:", error);
        // Don't throw here as the checklist changes were already saved successfully
      }

      // Clear pending changes and return to saved state
      clearPendingChanges();
      setState("saved");
    } catch (error) {
      console.error("Failed to save pending changes:", error);
      throw error;
    }
  }, [
    state,
    pendingAdditions,
    pendingUpdates,
    pendingDeletions,
    batchSave,
    batchUpdate,
    batchDelete,
    clearPendingChanges,
    applicationId,
    recordType,
  ]);

  // Get filtered documents based on selected categories
  const filteredDocuments = useMemo(() => {
    if (state === "creating") {
      // In creating mode, return all document types
      // The DocumentChecklistTable will handle filtering based on selectedCategory
      return allDocumentTypes;
    } else if (state === "editing") {
      return availableDocumentsForEditing;
    }
    return [];
  }, [state, allDocumentTypes, availableDocumentsForEditing]);

  // Get current checklist documents for editing
  const currentChecklistDocuments = useMemo(() => {
    if (state !== "editing") return [];

    return checklistItems.map((item) => ({
      category: item.document_category,
      documentType: item.document_type,
      isUploaded: false, // This would need to be determined from documents
      uploadedDocument: undefined,
      requirement: item.required
        ? "mandatory"
        : ("optional" as DocumentRequirement),
      checklist_id: item.checklist_id,
      company_name: item.company_name,
      description: item.description,
    }));
  }, [state, checklistItems]);

  return {
    // State
    state,
    selectedCategories,
    selectedDocuments,
    requirementMap,
    hasChecklist,
    hasCompanyDocuments,
    checklistCategories,
    filteredDocuments,
    currentChecklistDocuments,
    availableDocumentsForEditing,
    checklistData,

    // Pending changes
    pendingAdditions,
    pendingDeletions,
    pendingUpdates,

    // Loading states
    isChecklistLoading,
    isBatchSaving,
    isBatchDeleting,

    // Actions
    startCreatingChecklist,
    startEditingChecklist,
    cancelChecklistOperation,
    selectCategory,
    selectDocument,
    updateDocumentRequirement,
    saveChecklist,
    updateChecklist,

    // Pending changes actions
    addToPendingChanges,
    removeFromPendingChanges,
    addToPendingDeletions,
    removeFromPendingDeletions,
    clearPendingChanges,
    savePendingChanges,

    // Utilities
    validateChecklist: () => validateChecklist(selectedDocuments),
  };
}
