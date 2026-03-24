import { useCallback, useState } from "react";
import { toast } from "sonner";
import { useDeleteDocument } from "@/hooks/useMutationsDocuments";
import {
  getCompanyDocuments,
  filterDocumentsWithValidIds,
} from "@/utils/companyDocuments";
import type { Document } from "@/types/applications";
import type { Company } from "@/types/documents";

interface RemoveCompanyDialogState {
  isOpen: boolean;
  company: Company | null;
  hasDocuments: boolean;
  documentCount: number;
}

const CLOSED_DIALOG: RemoveCompanyDialogState = {
  isOpen: false,
  company: null,
  hasDocuments: false,
  documentCount: 0,
};

interface UseRemoveCompanyOptions {
  allDocuments: Document[] | undefined;
  companies: Company[];
  onRemoveCompany: (companyName: string) => void;
}

interface UseRemoveCompanyReturn {
  removeCompanyDialog: RemoveCompanyDialogState;
  isDeletingDocuments: boolean;
  handleRemoveCompanyWithDocuments: (companyName: string, companyCategory: string) => void;
  handleRemoveDocumentsAndCompany: () => Promise<void>;
  handleRemoveCompanyDirect: () => void;
  handleCloseRemoveCompanyDialog: () => void;
}

export function useRemoveCompany({
  allDocuments,
  companies,
  onRemoveCompany,
}: UseRemoveCompanyOptions): UseRemoveCompanyReturn {
  const [removeCompanyDialog, setRemoveCompanyDialog] =
    useState<RemoveCompanyDialogState>(CLOSED_DIALOG);
  const [isDeletingDocuments, setIsDeletingDocuments] = useState(false);
  const deleteDocumentMutation = useDeleteDocument();

  const handleRemoveCompanyWithDocuments = useCallback(
    (companyName: string, companyCategory: string) => {
      const company = companies.find(
        (c) => c.name.toLowerCase() === companyName.toLowerCase(),
      );

      if (!company) {
        toast.error("Company not found");
        return;
      }

      const companyDocuments = getCompanyDocuments(
        companyCategory,
        allDocuments || [],
      );

      setRemoveCompanyDialog({
        isOpen: true,
        company,
        hasDocuments: companyDocuments.length > 0,
        documentCount: companyDocuments.length,
      });
    },
    [companies, allDocuments],
  );

  const handleRemoveDocumentsAndCompany = useCallback(async () => {
    const { company, hasDocuments, documentCount } = removeCompanyDialog;

    if (!company) return;

    if (!hasDocuments || documentCount === 0) {
      onRemoveCompany(company.name);
      setRemoveCompanyDialog(CLOSED_DIALOG);
      toast.success("Company removed successfully");
      return;
    }

    const companyCategory = company.category || `${company.name} Company Documents`;
    const companyDocuments = getCompanyDocuments(companyCategory, allDocuments || []);

    if (companyDocuments.length === 0) {
      onRemoveCompany(company.name);
      setRemoveCompanyDialog(CLOSED_DIALOG);
      toast.success("Company removed successfully");
      return;
    }

    const validDocuments = filterDocumentsWithValidIds(companyDocuments);

    if (validDocuments.length === 0) {
      onRemoveCompany(company.name);
      setRemoveCompanyDialog(CLOSED_DIALOG);
      toast.success("Company removed successfully");
      return;
    }

    setIsDeletingDocuments(true);

    try {
      const deletionResults: Array<{
        success: boolean;
        documentId: string;
        fileName?: string;
        error?: string;
      }> = [];

      for (const doc of validDocuments) {
        if (!doc._id || typeof doc._id !== "string" || doc._id.trim() === "") {
          deletionResults.push({
            success: false,
            documentId: doc._id || "unknown",
            fileName: doc.file_name,
            error: "Invalid document ID",
          });
          continue;
        }

        try {
          await deleteDocumentMutation.mutateAsync(doc._id);
          deletionResults.push({
            success: true,
            documentId: doc._id,
            fileName: doc.file_name,
          });
        } catch (err) {
          deletionResults.push({
            success: false,
            documentId: doc._id,
            fileName: doc.file_name,
            error: err instanceof Error ? err.message : "Unknown error",
          });
        }
      }

      const successCount = deletionResults.filter((r) => r.success).length;
      const failureCount = deletionResults.filter((r) => !r.success).length;

      if (successCount === 0 && validDocuments.length > 0) {
        setIsDeletingDocuments(false);
        toast.error(
          "Failed to delete all documents. Company was not removed. Please try again.",
        );
        return;
      }

      if (failureCount > 0) {
        toast.warning(
          `Company removed. ${successCount} document${successCount !== 1 ? "s" : ""} deleted successfully, but ${failureCount} document${failureCount !== 1 ? "s" : ""} could not be deleted.`,
        );
      } else {
        toast.success(
          `Company and ${successCount} document${successCount !== 1 ? "s" : ""} removed successfully`,
        );
      }

      onRemoveCompany(company.name);
      setRemoveCompanyDialog(CLOSED_DIALOG);
      setIsDeletingDocuments(false);
    } catch {
      setIsDeletingDocuments(false);
      toast.error(
        "An unexpected error occurred. Company was not removed. Please try again.",
      );
    }
  }, [removeCompanyDialog, allDocuments, onRemoveCompany, deleteDocumentMutation]);

  const handleCloseRemoveCompanyDialog = useCallback(() => {
    if (isDeletingDocuments) return;
    setRemoveCompanyDialog(CLOSED_DIALOG);
  }, [isDeletingDocuments]);

  const handleRemoveCompanyDirect = useCallback(() => {
    const { company } = removeCompanyDialog;
    if (!company) return;
    onRemoveCompany(company.name);
    setRemoveCompanyDialog(CLOSED_DIALOG);
    toast.success("Company removed successfully");
  }, [removeCompanyDialog, onRemoveCompany]);

  return {
    removeCompanyDialog,
    isDeletingDocuments,
    handleRemoveCompanyWithDocuments,
    handleRemoveDocumentsAndCompany,
    handleRemoveCompanyDirect,
    handleCloseRemoveCompanyDialog,
  };
}
