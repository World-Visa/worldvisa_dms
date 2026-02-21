"use client";

import { UploadDocumentsModal } from "./UploadDocumentsModal";
import type { Document } from "@/types/applications";

interface ReuploadDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  applicationId: string;
  document: Document | null;
  documentType: string;
  category: string;
  isClientView?: boolean;
  instruction?: string;
}

export function ReuploadDocumentModal(props: ReuploadDocumentModalProps) {
  return (
    <UploadDocumentsModal
      mode="reupload"
      isOpen={props.isOpen}
      onClose={props.onClose}
      applicationId={props.applicationId}
      document={props.document}
      documentType={props.documentType}
      category={props.category}
      isClientView={props.isClientView}
      instruction={props.instruction}
    />
  );
}
