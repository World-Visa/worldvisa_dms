export type ChecklistDocumentTemplate = {
  _id: string;
  category: string;
  documentType: string;
  allowedDocument: number;
  format: string[];
  sampleDocumentUrl?: string | null;
  importantNote?: string | null;
  visaServiceType: string;
  state: 'active' | 'inactive';
  addedBy?: string | null;
  updatedBy?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ChecklistDocumentGroup = {
  category: string;
  documents: ChecklistDocumentTemplate[];
};

export type CreateChecklistDocumentTemplateBody = {
  category: string;
  documentType: string;
  allowedDocument: number;
  format?: string[];
  sampleDocumentUrl?: string | null;
  importantNote?: string | null;
  visaServiceType: string;
  state?: 'active' | 'inactive';
};

export type UpdateChecklistDocumentTemplateBody = Partial<
  Omit<CreateChecklistDocumentTemplateBody, 'visaServiceType' | 'category'>
>;

export type VisaServiceTypesResponse = {
  status: string;
  data: {
    visaServiceTypes: string[];
  };
};

export type SummaryItem = {
  visaServiceType: string;
  documentCount: number;
  categoryCount: number;
};

export type SummaryResponse = {
  status: string;
  data: {
    summary: SummaryItem[];
  };
};

export type GroupedResponse = {
  status: string;
  data: {
    groups: ChecklistDocumentGroup[];
  };
};

export type CategoriesResponse = {
  status: string;
  data: {
    categories: string[];
  };
};

export type SingleDocumentResponse = {
  status: string;
  data: {
    item: ChecklistDocumentTemplate;
  };
};

export type BulkOperationResult = {
  status: string;
  data: {
    created?: number;
    updated?: number;
    skipped?: number;
  };
};
