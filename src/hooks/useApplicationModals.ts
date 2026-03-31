import { useState, useCallback } from "react";
import type { Document } from "@/types/applications";

export function useApplicationModals() {
  const [isAddCompanyDialogOpen, setIsAddCompanyDialogOpen] = useState(false);
  const [isReuploadModalOpen, setIsReuploadModalOpen] = useState(false);
  const [selectedReuploadDocument, setSelectedReuploadDocument] =
    useState<Document | null>(null);
  const [selectedReuploadDocumentType, setSelectedReuploadDocumentType] =
    useState<string>("");
  const [
    selectedReuploadDocumentCategory,
    setSelectedReuploadDocumentCategory,
  ] = useState<string>("");
  const [isQualityCheckModalOpen, setIsQualityCheckModalOpen] = useState(false);
  const [isDownloadAllModalOpen, setIsDownloadAllModalOpen] = useState(false);
  const [isEmailHistoryModalOpen, setIsEmailHistoryModalOpen] = useState(false);

  // Memoized handlers
  const openAddCompanyDialog = useCallback(() => {
    setIsAddCompanyDialogOpen(true);
  }, []);

  const closeAddCompanyDialog = useCallback(() => {
    setIsAddCompanyDialogOpen(false);
  }, []);

  const openReuploadModal = useCallback(
    (document: Document, documentType: string, category: string) => {
      setSelectedReuploadDocument(document);
      setSelectedReuploadDocumentType(documentType);
      setSelectedReuploadDocumentCategory(category);
      setIsReuploadModalOpen(true);
    },
    [],
  );

  const closeReuploadModal = useCallback(() => {
    setIsReuploadModalOpen(false);
    setSelectedReuploadDocument(null);
    setSelectedReuploadDocumentType("");
    setSelectedReuploadDocumentCategory("");
  }, []);

  const openQualityCheckModal = useCallback(() => {
    setIsQualityCheckModalOpen(true);
  }, []);

  const closeQualityCheckModal = useCallback(() => {
    setIsQualityCheckModalOpen(false);
  }, []);

  const openDownloadAllModal = useCallback(() => {
    setIsDownloadAllModalOpen(true);
  }, []);

  const closeDownloadAllModal = useCallback(() => {
    setIsDownloadAllModalOpen(false);
  }, []);

  // Handlers for onOpenChange pattern (accept boolean)
  const setQualityCheckModalOpen = useCallback((open: boolean) => {
    setIsQualityCheckModalOpen(open);
  }, []);

  const setDownloadAllModalOpen = useCallback((open: boolean) => {
    setIsDownloadAllModalOpen(open);
  }, []);

  const openEmailHistoryModal = useCallback(() => {
    setIsEmailHistoryModalOpen(true);
  }, []);

  const setEmailHistoryModalOpen = useCallback((open: boolean) => {
    setIsEmailHistoryModalOpen(open);
  }, []);

  return {
    // States
    isAddCompanyDialogOpen,
    isReuploadModalOpen,
    selectedReuploadDocument,
    selectedReuploadDocumentType,
    selectedReuploadDocumentCategory,
    isQualityCheckModalOpen,
    isDownloadAllModalOpen,

    // Handlers
    openAddCompanyDialog,
    closeAddCompanyDialog,
    openReuploadModal,
    closeReuploadModal,
    openQualityCheckModal,
    closeQualityCheckModal,
    openDownloadAllModal,
    closeDownloadAllModal,

    // Setters for onOpenChange pattern
    setQualityCheckModalOpen,
    setDownloadAllModalOpen,

    // Email history modal
    isEmailHistoryModalOpen,
    openEmailHistoryModal,
    setEmailHistoryModalOpen,
  };
}
