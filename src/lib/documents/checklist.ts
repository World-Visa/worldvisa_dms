export const IDENTITY_DOCUMENTS = [
  {
    category: "Identity Documents",
    documentType: "Passport",
    allowedDocument: 2,
  },
  {
    category: "Identity Documents",
    documentType: "Aadhar Card",
    allowedDocument: 2,
  },
  {
    category: "Identity Documents",
    documentType: "Pan Card",
    allowedDocument: 2,
  },
  {
    category: "Identity Documents",
    documentType: "Driving license",
    allowedDocument: 2,
  },
  {
    category: "Identity Documents",
    documentType: "Photograph",
    allowedDocument: 2,
  },
  {
    category: "Identity Documents",
    documentType: "Marriage/ Divorce certificate",
    allowedDocument: 2,
  },
  {
    category: "Identity Documents",
    documentType: "Work Permit (Overseas client)",
    allowedDocument: 2,
  },
  {
    category: "Identity Documents",
    documentType: "National Identity Document",
    allowedDocument: 2,
  },
  {
    category: "Identity Documents",
    documentType: "Name Change Affidavit",
    sampleDocument: "/sample_documents/Name_Change_Affidavit_sample.docx",
    allowedDocument: 2,
  },
];

export const EDUCATION_DOCUMENTS = [
  {
    category: "Education Documents",
    documentType: "10th",
    allowedDocument: 2,
  },
  {
    category: "Education Documents",
    documentType: "12th",
    allowedDocument: 2,
  },
  {
    category: "Education Documents",
    documentType: "Diploma Certificate",
    allowedDocument: 2,
  },
  {
    category: "Education Documents",
    documentType: "Diploma MarkSheet",
    allowedDocument: 2,
  },
  {
    category: "Education Documents",
    documentType: "Bachelors Degree Certificate",
    allowedDocument: 2,
  },
  {
    category: "Education Documents",
    documentType: "Bachelors Marksheet/ Transcripts",
    allowedDocument: 2,
    instruction:
      "combine all marksheets as one pdf and upload here make sure pdf size is below 5mb",
  },
  {
    category: "Education Documents",
    documentType: "Masters Degree Certificate",
    allowedDocument: 2,
  },
  {
    category: "Education Documents",
    documentType: "Masters Marksheet/ Transcripts",
    allowedDocument: 2,
    instruction:
      "combine all marksheets as one pdf and upload here make sure pdf size is below 5mb",
  },
  {
    category: "Education Documents",
    documentType: "PHD Degree Certificate",
    allowedDocument: 2,
  },
  {
    category: "Education Documents",
    documentType: "PHD (Grade Sheet)",
    allowedDocument: 2,
  },
  {
    category: "Education Documents",
    documentType: "Education sheet",
    allowedDocument: 2,
  },
  {
    category: "Education Documents",
    documentType: "Provisional Degree Certificate (Engineers Australia)",
    allowedDocument: 2,
  },
];

export const OTHER_DOCUMENTS = [
  {
    category: "Other Documents",
    documentType: "Updated Resume",
    allowedDocument: 2,
  },
  {
    category: "Other Documents",
    documentType: "RPL (Only for ACS)",
    allowedDocument: 1,
  },
  {
    category: "Other Documents",
    documentType: "CDR (Only for Engineers Australia)",
    allowedDocument: 6,
  },
  {
    category: "Other Documents",
    documentType: "Project list (only for Vetassess)",
    allowedDocument: 2,
  },
  {
    category: "Other Documents",
    documentType: "Portfolio (only for Vetassess)",
    sampleDocument: "/sample_documents/Portfolio_Vetassess_sample.docx",
    allowedDocument: 1,
  },
  {
    category: "Other Documents",
    documentType: "English langugae test",
    allowedDocument: 2,
  },
  {
    category: "Other Documents",
    documentType: "Syllabus for CPA",
    allowedDocument: 2,
  },
  {
    category: "Other Documents",
    documentType: "Registration/ License",
    allowedDocument: 2,
  },
  {
    category: "Other Documents",
    documentType: "Photographs and Video (Only for TRA/ VET)",
    allowedDocument: 2,
  },
  {
    category: "Other Documents",
    documentType: "Publications List (only for Vetassess)",
    allowedDocument: 1,
  },
  {
    category: "Other Documents",
    documentType: "Supervised Teaching Practice (AITSL)",
    allowedDocument: 1,
  },
  {
    category: "Other Documents",
    documentType: "Org chart (only for Vetassess)",
    allowedDocument: 1,
  },
  {
    category: "Other Documents",
    documentType: "ACS Skill Select Sheet (Only for ACS)",
    allowedDocument: 1,
  },
  {
    category: "Other Documents",
    documentType: "Other Certification",
    allowedDocument: 2,
  },
];

export const COMPANY_DOCUMENTS = [
  {
    category: "Company",
    documentType: "Offer Letter/ Appointment Letter",
    allowedDocument: 2,
  },
  {
    category: "Company",
    documentType: "Releaving Letter/ Experience/ Service certificate",
    allowedDocument: 2,
  },
  {
    category: "Company",
    documentType: "Promotion Letters",
    allowedDocument: 2,
  },
  {
    category: "Company",
    documentType: "Reference Letter",
    sampleDocument: "/sample_documents/Reference letter format.docx",
    allowedDocument: 1,
    importantNote: `*DO NOT GET IT ON COMPANY LETTERHEAD UNLESS IT IS VERIFIED AND APPROVED BY THE CASE OFFICER.*
      The mandatory details that must be checked include: Issue date, Employee ID, employment period (start date to end date), working hours, employment type (full-time/part-time), salary and complete signatory information (Name, Designation, Mobile number, Email ID).`,
  },
  {
    category: "Company",
    documentType: "Statutory Decleration",
    sampleDocument: "/sample_documents/Stat Dec sample.docx",
    allowedDocument: 1,
    importantNote: `*DO NOT GET IT ON THE STAMP PAPER UNTIL IT IS VERIFIED AND APPROVED BY THE CASE OFFICER.*
      Issue date of stamp paper and the notarisation should have same date.`,
  },
  { category: "Company", documentType: "Payslips", allowedDocument: 2 },
  { category: "Company", documentType: "Bank Statement", allowedDocument: 2 },
  {
    category: "Company",
    documentType: "Taxation (Form 16/26 AS)",
    allowedDocument: 2,
  },
  { category: "Company", documentType: "Superannuation (EPFO Statement)", allowedDocument: 2 },
  {
    category: "Company",
    documentType: "Salary Certifcate (only VET/ TRA/EA)",
    allowedDocument: 1,
  },
  {
    category: "Company",
    documentType: "Employer Linked Insurance",
    allowedDocument: 2,
  },
];

export const SELF_EMPLOYMENT_DOCUMENTS = [
  {
    category: "Self Employment/Freelance",
    documentType: "Company registration",
  },
  {
    category: "Self Employment/Freelance",
    documentType: "Reference Letter/ Statutory Declaration",
  },
  { category: "Self Employment/Freelance", documentType: "Client Invoices" },
  {
    category: "Self Employment/Freelance",
    documentType: "Company Bank Statement",
  },
  {
    category: "Self Employment/Freelance",
    documentType: "Taxation Records (showing clients name)",
  },
  {
    category: "Self Employment/Freelance",
    documentType: "Contracts with clients",
  },
  {
    category: "Self Employment/Freelance",
    documentType: "Reference letters from Clients (Endorsement letter)",
  },
  {
    category: "Self Employment/Freelance",
    documentType: "Letter from Accountant (CA)",
    allowedDocument: 1,
    sampleDocument: "/sample_documents/Letter_from_Accountant_CA_sample.docx",
  },
  {
    category: "Self Employment/Freelance",
    documentType: "Organisational Chart",
    allowedDocument: 1,
    sampleDocument: "/sample_documents/Organisational_Chart_sample.docx",
    importantNote: `DO NOT GET IT ON A LETTERHEAD UNTIL IT IS VERIFIED AND APPROVED BY THE CASE OFFICER.`,
  },
];

/** Document types that show the "View sample" option in Upload and Reupload modals. */
export const DOCUMENT_TYPES_WITH_SAMPLE_IN_MODALS: Array<{
  documentType: string;
  category: string;
}> = [
  { documentType: "Reference Letter", category: "Company" },
  { documentType: "Statutory Decleration", category: "Company" },
  {
    documentType: "Organisational Chart",
    category: "Self Employment/Freelance",
  },
  { documentType: "Name Change Affidavit", category: "Identity Documents" },
  {
    documentType: "Letter from Accountant (CA)",
    category: "Self Employment/Freelance",
  },
  {
    documentType: "Portfolio (only for Vetassess)",
    category: "Other Documents",
  },
];

export interface ChecklistDocumentConfig {
  category: string;
  documentType: string;
  allowedDocument?: number;
  instruction?: string;
  sampleDocument?: string;
  importantNote?: string;
}

const ALL_CHECKLIST_DOCUMENTS: ChecklistDocumentConfig[] = [
  ...IDENTITY_DOCUMENTS,
  ...EDUCATION_DOCUMENTS,
  ...OTHER_DOCUMENTS,
  ...COMPANY_DOCUMENTS,
  ...SELF_EMPLOYMENT_DOCUMENTS,
];

const normalizeText = (value: string): string =>
  value.toLowerCase().replace(/[^a-z0-9]/g, "");

const normalizeChecklistCategory = (category: string): string => {
  const trimmed = category?.trim() ?? "";
  const lowered = trimmed.toLowerCase();

  if (!trimmed) return "";
  if (lowered === "identity" || lowered === "identity documents") {
    return "Identity Documents";
  }
  if (lowered === "education" || lowered === "education documents") {
    return "Education Documents";
  }
  if (lowered === "other" || lowered === "other documents") {
    return "Other Documents";
  }
  if (
    lowered === "self employment" ||
    lowered === "self employment/freelance"
  ) {
    return "Self Employment/Freelance";
  }
  if (
    lowered === "company" ||
    lowered === "company documents" ||
    lowered.includes("company documents")
  ) {
    return "Company";
  }

  return trimmed;
};

const buildDocumentKey = (category: string, documentType: string): string =>
  `${normalizeText(normalizeChecklistCategory(category))}:${normalizeText(documentType)}`;

const CHECKLIST_DOCUMENT_LOOKUP = new Map<string, ChecklistDocumentConfig>();

for (const doc of ALL_CHECKLIST_DOCUMENTS) {
  CHECKLIST_DOCUMENT_LOOKUP.set(
    buildDocumentKey(doc.category, doc.documentType),
    doc,
  );
}

export function getChecklistDocumentConfig(
  category: string,
  documentType: string,
): ChecklistDocumentConfig | undefined {
  if (!documentType?.trim()) return undefined;

  const byCategory = CHECKLIST_DOCUMENT_LOOKUP.get(
    buildDocumentKey(category, documentType),
  );
  if (byCategory) return byCategory;

  const normalizedType = normalizeText(documentType);
  return ALL_CHECKLIST_DOCUMENTS.find(
    (doc) => normalizeText(doc.documentType) === normalizedType,
  );
}

export function getAllowedDocumentLimit(
  category: string,
  documentType: string,
): number | undefined {
  return getChecklistDocumentConfig(category, documentType)?.allowedDocument;
}

export function getAllowedDocumentLimitMessage(
  documentType: string,
  allowedDocument: number,
): string {
  return `Maximum ${allowedDocument} file${allowedDocument === 1 ? "" : "s"} allowed for "${documentType}".`;
}

export function isNewUploadBlockedByAllowedDocumentLimit(
  category: string,
  documentType: string,
  currentDocumentCount: number,
): {
  blocked: boolean;
  allowedDocument?: number;
} {
  const allowedDocument = getAllowedDocumentLimit(category, documentType);
  if (allowedDocument === undefined) {
    return { blocked: false };
  }

  return {
    blocked: currentDocumentCount >= allowedDocument,
    allowedDocument,
  };
}
