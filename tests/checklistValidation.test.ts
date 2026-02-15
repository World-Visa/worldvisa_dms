import assert from "node:assert";

import { areAllMandatoryDocumentsReviewed } from "../src/utils/checklistValidation";
import type { ChecklistItem } from "../src/types/checklist";
import type { Document } from "../src/types/applications";

function createDocument(overrides: Partial<Document>): Document {
  const base: Document = {
    _id: overrides._id ?? "doc-id",
    record_id: overrides.record_id ?? "record-id",
    workdrive_file_id: overrides.workdrive_file_id ?? "workdrive-file",
    workdrive_parent_id: overrides.workdrive_parent_id ?? "workdrive-parent",
    file_name: overrides.file_name ?? "document.pdf",
    uploaded_by: overrides.uploaded_by ?? "tester",
    status: overrides.status ?? "reviewed",
    history: overrides.history ?? [],
    uploaded_at: overrides.uploaded_at ?? new Date().toISOString(),
    __v: overrides.__v ?? 0,
    document_name: overrides.document_name,
    document_category: overrides.document_category,
    document_type: overrides.document_type,
    company_name: overrides.company_name,
    description: overrides.description,
    document_link: overrides.document_link,
    download_url: overrides.download_url,
    comments: overrides.comments ?? [],
    reject_message: overrides.reject_message,
  };

  return base;
}

const checklistItems: ChecklistItem[] = [
  {
    checklist_id: "alpha-proof",
    document_type: "GST Registration",
    document_category: "Alpha LLC Company Documents",
    required: true,
    company_name: "Alpha LLC",
  },
  {
    checklist_id: "beta-proof",
    document_type: "GST Registration",
    document_category: "Beta Ltd Company Documents",
    required: true,
    company_name: "Beta Ltd",
  },
  {
    checklist_id: "beta-financials",
    document_type: "Financial Statement",
    document_category: "Beta Ltd Company Documents",
    required: true,
    company_name: "Beta Ltd",
  },
];

const alphaDocument = createDocument({
  _id: "alpha-doc",
  file_name: "alpha-gst.pdf",
  document_name: "GST Registration",
  document_category: "Alpha LLC Company Documents",
  company_name: "Alpha LLC",
});

const betaDocument = createDocument({
  _id: "beta-doc",
  file_name: "beta-gst.pdf",
  document_name: "GST Registration",
  document_category: "Beta Ltd Company Documents",
  company_name: "Beta Ltd",
});

const documentsMissingSecondBeta: Document[] = [alphaDocument, betaDocument];

assert.strictEqual(
  areAllMandatoryDocumentsReviewed(checklistItems, documentsMissingSecondBeta),
  false,
  "Should require all mandatory company documents before enabling quality check",
);

const betaDocumentWrongCompany = createDocument({
  _id: "beta-doc-wrong",
  file_name: "beta-financials.pdf",
  document_name: "Financial Statement",
  document_category: "Alpha LLC Company Documents",
  company_name: "Alpha LLC",
});

assert.strictEqual(
  areAllMandatoryDocumentsReviewed(checklistItems, [
    ...documentsMissingSecondBeta,
    betaDocumentWrongCompany,
  ]),
  false,
  "Documents from a different company should not satisfy another company's mandatory checklist item",
);

const betaFinancials = createDocument({
  _id: "beta-doc-financials",
  file_name: "beta-financials.pdf",
  document_name: "Financial Statement",
  document_category: "Beta Ltd Company Documents",
  company_name: "Beta Ltd",
});

assert.strictEqual(
  areAllMandatoryDocumentsReviewed(checklistItems, [
    alphaDocument,
    betaDocument,
    betaFinancials,
  ]),
  true,
  "All mandatory documents reviewed should enable quality check",
);

const mixedCaseChecklist: ChecklistItem[] = [
  {
    checklist_id: "gamma-proof",
    document_type: "Employment Contract",
    document_category: "microsoft Company Documents",
    required: true,
  },
];

const mixedCaseDocument = createDocument({
  _id: "gamma-doc",
  file_name: "gamma-contract.pdf",
  document_name: "Employment Contract",
  document_category: "Microsoft Company Documents",
});

assert.strictEqual(
  areAllMandatoryDocumentsReviewed(mixedCaseChecklist, [mixedCaseDocument]),
  true,
  "Company documents without company_name should match regardless of category casing",
);

const genericCompanyChecklist: ChecklistItem[] = [
  {
    checklist_id: "generic-company",
    document_type: "Reference Letter",
    document_category: "Company",
    required: true,
  },
];

const specificCompanyDocument = createDocument({
  _id: "generic-doc",
  file_name: "generic-reference.pdf",
  document_name: "Reference Letter",
  document_category: "worldvisa Company Documents",
});

assert.strictEqual(
  areAllMandatoryDocumentsReviewed(genericCompanyChecklist, [
    specificCompanyDocument,
  ]),
  true,
  "Generic company checklist rows should match documents from any company",
);

console.log("checklistValidation tests passed");
