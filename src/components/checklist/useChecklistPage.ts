"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useChecklist, useChecklistMutations } from "@/hooks/useChecklist";
import { useGroupedDocuments } from "@/hooks/useChecklistDocumentTemplates";
import { updateChecklistRequested } from "@/lib/api/getApplicationById";
import {
  buildDocumentTypesFromTemplates,
  getAvailableDocumentsForEditing,
  createChecklistItemsFromDocuments,
  validateChecklist,
  markSubmittedDocumentsAsMandatory,
} from "@/lib/checklist/utils";
import { generateChecklistCategories } from "@/lib/checklist/categoryUtils";
import {
  mapCategoryLabel,
  filterItemsByCategory,
  generateCreatingItems,
  generateEditingCurrentItems,
  generateEditingAvailableItems,
} from "@/lib/checklist/dataProcessing";
import { generateCategories } from "@/components/applications/filter/CategoryGenerator";
import { useSearchMemo } from "@/lib/utils/search";
import { toApiCategory } from "@/lib/constants/checklistCategories";
import type {
  ChecklistDocument,
  ChecklistItem,
  DocumentRequirement,
  ChecklistUpdateRequest,
} from "@/types/checklist";
import type { Document } from "@/types/applications";
import type { Company } from "@/types/documents";
import type { ChecklistPageMode } from "./types";

interface UseChecklistPageProps {
  applicationId: string;
  documents: Document[] | undefined;
  companies: Company[];
  recordType?: string;
  visaServiceType?: string;
}

export function useChecklistPage({
  applicationId,
  documents,
  companies,
  recordType = "default_record_type",
  visaServiceType = "",
}: UseChecklistPageProps) {
  const [mode, setMode] = useState<ChecklistPageMode>("create");
  const [selectedCategory, setSelectedCategory] = useState<string>("identity");
  const [activeTab, setActiveTab] = useState<"current" | "available">(
    "current",
  );
  const [selectedDocuments, setSelectedDocuments] = useState<
    ChecklistDocument[]
  >([]);
  const [requirementMap, setRequirementMap] = useState<
    Record<string, DocumentRequirement>
  >({});
  const [pendingAdditions, setPendingAdditions] = useState<ChecklistDocument[]>(
    [],
  );
  const [pendingUpdates, setPendingUpdates] = useState<
    Array<{
      checklistId: string;
      required: boolean;
      documentType: string;
      documentCategory: string;
    }>
  >([]);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: checklistData, isLoading: isChecklistLoading } =
    useChecklist(applicationId);

  // Dynamic templates from the checklist library keyed by visa service type
  const { data: templateData, isLoading: isTemplatesLoading } =
    useGroupedDocuments(visaServiceType);

  const {
    batchSave,
    batchUpdate,
    isBatchSaving,
    isBatchUpdating,
  } = useChecklistMutations(applicationId);

  const isSaving = isBatchSaving || isBatchUpdating;

  // Gate on both checklist fetch and template fetch
  const isPageLoading = isChecklistLoading || (!!visaServiceType && isTemplatesLoading);

  const checklistItems = useMemo(() => {
    const data = checklistData?.data;
    if (!Array.isArray(data)) return [];
    return data;
  }, [checklistData]);

  const hasChecklist = useMemo(
    () => checklistItems.length > 0,
    [checklistItems],
  );

  useEffect(() => {
    if (!isPageLoading) {
      setMode(hasChecklist ? "edit" : "create");
    }
  }, [hasChecklist, isPageLoading]);

  // Build all available document types from DB templates
  const allDocumentTypes = useMemo(
    () => buildDocumentTypesFromTemplates(templateData?.data?.groups ?? []),
    [templateData],
  );

  const checklistCategories = useMemo(() => {
    const documentsData = documents?.length
      ? { data: { documents } }
      : undefined;
    return generateChecklistCategories(checklistData, documentsData, companies);
  }, [checklistData, documents, companies]);

  const categories = useMemo(() => {
    const checklistState = mode === "create" ? "creating" : "editing";
    const allCategories = generateCategories({
      isClientView: false,
      checklistState,
      checklistCategories,
      submittedDocumentsCount: documents?.length ?? 0,
    });
    return allCategories.filter(
      (cat) => cat.id !== "submitted" && cat.id !== "all",
    );
  }, [mode, checklistCategories, documents?.length]);

  const firstAvailableCategory = useMemo(() => {
    if (categories.length === 0) return "identity";
    if (mode === "edit") {
      const checklistCat = categories.find((cat) => cat.id === "checklist");
      if (checklistCat) return checklistCat.id;
    }
    return categories[0]?.id ?? "identity";
  }, [categories, mode]);

  useEffect(() => {
    if (categories.length > 0) {
      const isValid = categories.some((cat) => cat.id === selectedCategory);
      if (!isValid) {
        setSelectedCategory(firstAvailableCategory);
      }
    }
  }, [categories, selectedCategory, firstAvailableCategory]);

  const availableDocumentsForEditing = useMemo(
    () => getAvailableDocumentsForEditing(allDocumentTypes, checklistItems),
    [allDocumentTypes, checklistItems],
  );

  const currentChecklistDocuments = useMemo((): ChecklistDocument[] => {
    if (mode === "edit" || hasChecklist) {
      return checklistItems.map((item: ChecklistItem) => ({
        category: mapCategoryLabel(item.document_category),
        documentType: item.document_type,
        isUploaded: false,
        requirement: (item.required
          ? "mandatory"
          : "optional") as DocumentRequirement,
        checklist_id: item.checklist_id,
        company_name: item.company_name,
        description: item.description,
      }));
    }
    return [];
  }, [mode, checklistItems, hasChecklist]);

  const filteredDocuments = useMemo(() => {
    if (mode === "create") return allDocumentTypes;
    if (mode === "edit") return availableDocumentsForEditing;
    return [];
  }, [mode, allDocumentTypes, availableDocumentsForEditing]);

  const checklistState =
    mode === "create" ? "creating" : mode === "edit" ? "editing" : "saved";

  const creatingItems = useMemo(
    () =>
      generateCreatingItems(
        checklistState,
        filteredDocuments,
        requirementMap,
        selectedDocuments,
      ),
    [checklistState, filteredDocuments, requirementMap, selectedDocuments],
  );

  const editingCurrentItems = useMemo(
    () =>
      generateEditingCurrentItems(checklistState, currentChecklistDocuments),
    [checklistState, currentChecklistDocuments],
  );

  const editingAvailableItems = useMemo(
    () =>
      generateEditingAvailableItems(
        checklistState,
        availableDocumentsForEditing,
        requirementMap,
        pendingAdditions,
      ),
    [
      checklistState,
      availableDocumentsForEditing,
      requirementMap,
      pendingAdditions,
    ],
  );

  const checklistTableItems = useMemo(() => {
    if (mode === "create") return creatingItems;
    if (mode === "edit") {
      return activeTab === "current" ? editingCurrentItems : editingAvailableItems;
    }
    return [];
  }, [mode, activeTab, creatingItems, editingCurrentItems, editingAvailableItems]);

  const categoryFilteredItems = useMemo(
    () => filterItemsByCategory(checklistTableItems, selectedCategory),
    [checklistTableItems, selectedCategory],
  );

  const filteredItems = useSearchMemo(
    categoryFilteredItems,
    searchQuery,
    (item) => item.documentType,
    { keys: ["documentType"], threshold: 0.3 },
  );

  const startCreating = useCallback(() => {
    setMode("create");
    setSelectedDocuments([]);
    const autoRequirements = markSubmittedDocumentsAsMandatory(
      documents ?? [],
      allDocumentTypes,
    );
    setRequirementMap(autoRequirements);
    const submitted: ChecklistDocument[] = [];
    for (const [key, req] of Object.entries(autoRequirements)) {
      if (req === "mandatory") {
        const dashIdx = key.indexOf("-");
        const cat = key.slice(0, dashIdx);
        const docType = key.slice(dashIdx + 1);
        submitted.push({
          category: cat,
          documentType: docType,
          isUploaded: true,
          company_name: cat.includes("Company Documents")
            ? companies.find((c) => c.category === cat)?.name
            : undefined,
        });
      }
    }
    setSelectedDocuments(submitted);
  }, [documents, allDocumentTypes, companies]);

  const startEditing = useCallback(() => {
    setMode("edit");
    setActiveTab("current");
    setPendingAdditions([]);
    setPendingUpdates([]);
  }, []);

  const cancel = useCallback(() => {
    setMode(hasChecklist ? "edit" : "create");
    setPendingAdditions([]);
    setPendingUpdates([]);
    setSelectedDocuments([]);
    setRequirementMap({});
  }, [hasChecklist]);

  const handleCategoryChange = useCallback((category: string) => {
    setSelectedCategory(category);
  }, []);

  const handleTabChange = useCallback((tab: "current" | "available") => {
    setActiveTab(tab);
  }, []);

  const updateDocumentRequirement = useCallback(
    (
      category: string,
      documentType: string,
      requirement: DocumentRequirement,
    ) => {
      const key = `${category}-${documentType}`;
      setRequirementMap((prev) => ({ ...prev, [key]: requirement }));

      if (mode === "create") {
        if (requirement === "not_required") {
          setSelectedDocuments((prev) =>
            prev.filter(
              (d) =>
                !(d.category === category && d.documentType === documentType),
            ),
          );
        } else {
          setSelectedDocuments((prev) => {
            const exists = prev.some(
              (d) =>
                d.category === category && d.documentType === documentType,
            );
            if (exists) return prev;
            // Find the template_id for this doc type if available
            const template = allDocumentTypes.find(
              (t) =>
                t.category === category && t.documentType === documentType,
            );
            return [
              ...prev,
              {
                category,
                documentType,
                isUploaded: false,
                company_name: category.includes("Company Documents")
                  ? companies.find((c) => c.category === category)?.name
                  : undefined,
                template_id: template?.template_id,
              },
            ];
          });
        }
      } else if (mode === "edit") {
        if (requirement === "not_required") {
          setPendingAdditions((prev) =>
            prev.filter(
              (d) =>
                !(d.category === category && d.documentType === documentType),
            ),
          );
        } else {
          const inChecklist = checklistItems.some(
            (i) =>
              i.document_category === category &&
              i.document_type === documentType,
          );
          if (!inChecklist) {
            setPendingAdditions((prev) => {
              const exists = prev.some(
                (d) =>
                  d.category === category && d.documentType === documentType,
              );
              if (exists) {
                return prev.map((d) =>
                  d.category === category && d.documentType === documentType
                    ? { ...d, requirement }
                    : d,
                );
              }
              const template = allDocumentTypes.find(
                (t) =>
                  t.category === category && t.documentType === documentType,
              );
              return [
                ...prev,
                {
                  category,
                  documentType,
                  requirement,
                  isUploaded: false,
                  company_name: category.includes("Company Documents")
                    ? companies.find((c) => c.category === category)?.name
                    : undefined,
                  template_id: template?.template_id,
                },
              ];
            });
          } else {
            const item = checklistItems.find(
              (i) =>
                i.document_category === category &&
                i.document_type === documentType,
            );
            const cid = item?.checklist_id;
            if (cid) {
              setPendingUpdates((prev) => {
                const existing = prev.find((p) => p.checklistId === cid);
                if (existing) {
                  return prev.map((p) =>
                    p.checklistId === cid
                      ? { ...p, required: requirement === "mandatory" }
                      : p,
                  );
                }
                return [
                  ...prev,
                  {
                    checklistId: cid,
                    required: requirement === "mandatory",
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
    [mode, companies, checklistItems, allDocumentTypes],
  );

  const addToPendingChanges = useCallback((document: ChecklistDocument) => {
    setPendingAdditions((prev) => {
      const exists = prev.some(
        (d) =>
          d.category === document.category &&
          d.documentType === document.documentType,
      );
      if (exists) return prev;
      return [...prev, document];
    });
  }, []);

  const removeFromPendingChanges = useCallback(
    (document: ChecklistDocument) => {
      setPendingAdditions((prev) =>
        prev.filter(
          (d) =>
            !(
              d.category === document.category &&
              d.documentType === document.documentType
            ),
        ),
      );
    },
    [],
  );

  const clearPendingChanges = useCallback(() => {
    setPendingAdditions([]);
    setPendingUpdates([]);
  }, []);

  const saveChecklist = useCallback(async () => {
    if (mode !== "create") return;
    const validation = validateChecklist(selectedDocuments);
    if (!validation.isValid) throw new Error(validation.errors.join(", "));
    const items = createChecklistItemsFromDocuments(
      selectedDocuments,
      requirementMap,
    );
    if (items.length === 0) throw new Error("No valid checklist items to save");
    await batchSave.mutateAsync(items);
    try {
      await updateChecklistRequested(applicationId, false, recordType);
    } catch {
      // non-blocking
    }
    setMode("edit");
    setSelectedDocuments([]);
    setRequirementMap({});
  }, [mode, selectedDocuments, requirementMap, batchSave, applicationId, recordType]);

  const savePendingChanges = useCallback(async () => {
    if (mode !== "edit") return;

    const toAdd = pendingAdditions.map((d) => ({
      document_type: d.documentType,
      document_category: toApiCategory(d.category),
      required: d.requirement === "mandatory",
      company_name: d.company_name,
      ...(d.template_id ? { template_id: d.template_id } : {}),
    }));

    const toUpdate: ChecklistUpdateRequest[] = pendingUpdates.map((u) => ({
      checklist_id: u.checklistId,
      document_type: u.documentType,
      document_category: toApiCategory(u.documentCategory),
      required: u.required,
    }));

    if (toAdd.length) await batchSave.mutateAsync(toAdd);
    if (toUpdate.length) await batchUpdate.mutateAsync(toUpdate);

    try {
      await updateChecklistRequested(applicationId, false, recordType);
    } catch {
      // non-blocking
    }
    clearPendingChanges();
    setMode("edit");
  }, [
    mode,
    pendingAdditions,
    pendingUpdates,
    batchSave,
    batchUpdate,
    applicationId,
    recordType,
    clearPendingChanges,
  ]);

  const handleSave = useCallback(async () => {
    if (mode === "create") await saveChecklist();
    else if (mode === "edit") await savePendingChanges();
  }, [mode, saveChecklist, savePendingChanges]);

  const hasChanges = useMemo(() => {
    if (mode === "create") return selectedDocuments.length > 0;
    return pendingAdditions.length > 0 || pendingUpdates.length > 0;
  }, [mode, selectedDocuments, pendingAdditions, pendingUpdates]);

  return {
    mode,
    hasChanges,
    hasChecklist,
    isChecklistLoading: isPageLoading,
    isSaving,
    visaServiceType,
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
    pendingUpdates,
    startCreating,
    startEditing,
    cancel,
    handleCategoryChange,
    handleTabChange,
    updateDocumentRequirement,
    addToPendingChanges,
    removeFromPendingChanges,
    clearPendingChanges,
    handleSave,
    companies,
  };
}
