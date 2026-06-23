import type { InterestDocumentType } from "@/lib/stage2/eoiExpiry";

export const INTEREST_TYPE_OPTIONS = [
  { value: "eoi", label: "Expression of Interest (EOI)" },
  { value: "roi", label: "Register of Interest (ROI)" },
] as const;

export function getInterestUploadFields(
  type: InterestDocumentType,
  file: File,
) {
  return {
    type,
    document_name: file.name,
    document_type: file.type,
  };
}

export function isInterestDocumentType(
  type: string | undefined | null,
): type is InterestDocumentType {
  return type === "eoi" || type === "roi";
}
