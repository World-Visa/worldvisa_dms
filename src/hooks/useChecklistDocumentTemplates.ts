'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  bulkCreateDocuments,
  bulkUpdateDocuments,
  createDocument,
  deleteDocument,
  getChecklistSummary,
  getGroupedDocuments,
  getVisaServiceTypes,
  updateDocument,
  updateDocumentState,
} from '@/lib/api/checklistDocumentTemplates';
import {
  invalidateChecklistGrouped,
  invalidateChecklistSummary,
} from '@/lib/actions/checklistDocumentTemplates';
import type {
  ChecklistDocumentTemplate,
} from '@/types/checklistDocumentTemplates';
import {
  CHECKLIST_GROUPED_QUERY_PREFIX,
  CHECKLIST_TEMPLATE_KEYS,
} from '@/lib/constants/checklistDocTemplatesKeys';

export { CHECKLIST_TEMPLATE_KEYS };

export function useVisaServiceTypes() {
  return useQuery({
    queryKey: CHECKLIST_TEMPLATE_KEYS.visaTypes,
    queryFn: getVisaServiceTypes,
    staleTime: 10 * 60 * 1000,
    retry: 2,
  });
}

export function useChecklistSummary() {
  return useQuery({
    queryKey: CHECKLIST_TEMPLATE_KEYS.summary,
    queryFn: getChecklistSummary,
    staleTime: 2 * 60 * 1000,
    retry: 2,
  });
}

export function useGroupedDocuments(
  visaType: string,
  state?: 'active' | 'inactive',
) {
  return useQuery({
    queryKey: CHECKLIST_TEMPLATE_KEYS.grouped(visaType),
    queryFn: () => getGroupedDocuments(visaType, state),
    enabled: !!visaType,
    staleTime: 2 * 60 * 1000,
    retry: 2,
  });
}

export function useCreateDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ formData }: { formData: FormData; visaServiceType: string }) =>
      createDocument(formData),
    onSuccess: async (_, { visaServiceType }) => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: CHECKLIST_TEMPLATE_KEYS.summary }),
        qc.invalidateQueries({
          queryKey: CHECKLIST_TEMPLATE_KEYS.grouped(visaServiceType),
        }),
        invalidateChecklistSummary(),
        invalidateChecklistGrouped(visaServiceType),
      ]);
    },
    onError: (error: Error) => {
      toast.error(error.message ?? 'Failed to create document');
    },
  });
}

export function useUpdateDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, formData }: { id: string; formData: FormData; visaType: string }) =>
      updateDocument(id, formData),
    onSuccess: async (_, { visaType }) => {
      await Promise.all([
        qc.invalidateQueries({
          queryKey: CHECKLIST_TEMPLATE_KEYS.grouped(visaType),
        }),
        invalidateChecklistGrouped(visaType),
      ]);
    },
    onError: (error: Error) => {
      toast.error(error.message ?? 'Failed to update document');
    },
  });
}

export function useUpdateDocumentState() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      state,
    }: {
      id: string;
      state: 'active' | 'inactive';
      visaType: string;
    }) => updateDocumentState(id, state),
    onMutate: async ({ id, state, visaType }) => {
      await qc.cancelQueries({
        queryKey: CHECKLIST_TEMPLATE_KEYS.grouped(visaType),
      });
      const prev = qc.getQueryData(CHECKLIST_TEMPLATE_KEYS.grouped(visaType));
      qc.setQueryData(CHECKLIST_TEMPLATE_KEYS.grouped(visaType), (old: unknown) => {
        if (!old || typeof old !== 'object') return old;
        const data = old as { data?: { groups?: { category: string; documents: ChecklistDocumentTemplate[] }[] } };
        if (!data.data?.groups) return old;
        return {
          ...data,
          data: {
            ...data.data,
            groups: data.data.groups.map((g) => ({
              ...g,
              documents: g.documents.map((d) =>
                d._id === id ? { ...d, state } : d,
              ),
            })),
          },
        };
      });
      return { prev };
    },
    onError: (_err, { visaType }, ctx) => {
      if (ctx?.prev) {
        qc.setQueryData(CHECKLIST_TEMPLATE_KEYS.grouped(visaType), ctx.prev);
      }
      toast.error('Failed to update state');
    },
    onSettled: async (_, __, { visaType }) => {
      await Promise.all([
        qc.invalidateQueries({
          queryKey: CHECKLIST_TEMPLATE_KEYS.grouped(visaType),
        }),
        invalidateChecklistGrouped(visaType),
      ]);
    },
  });
}

export function useDeleteDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string; visaType: string }) => deleteDocument(id),
    onSuccess: async (_, { visaType }) => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: CHECKLIST_TEMPLATE_KEYS.summary }),
        qc.invalidateQueries({
          queryKey: CHECKLIST_TEMPLATE_KEYS.grouped(visaType),
        }),
        invalidateChecklistSummary(),
        invalidateChecklistGrouped(visaType),
      ]);
    },
    onError: (error: Error) => {
      toast.error(error.message ?? 'Failed to delete document');
    },
  });
}

export function useBulkCreate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (formData: FormData) => bulkCreateDocuments(formData),
    onSuccess: async (data) => {
      const created = data?.data?.created ?? 0;
      const skipped = data?.data?.skipped ?? 0;
      toast.success(
        `Added to ${created} visa type${created !== 1 ? 's' : ''}${skipped > 0 ? ` (${skipped} already existed)` : ''}.`,
      );
      await Promise.all([
        qc.invalidateQueries({ queryKey: CHECKLIST_TEMPLATE_KEYS.summary }),
        qc.invalidateQueries({ queryKey: [...CHECKLIST_GROUPED_QUERY_PREFIX] }),
        invalidateChecklistSummary(),
        invalidateChecklistGrouped(),
      ]);
    },
    onError: (error: Error) => {
      toast.error(error.message ?? 'Bulk create failed');
    },
  });
}

export function useBulkUpdate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (formData: FormData) => bulkUpdateDocuments(formData),
    onSuccess: async (data) => {
      const updated = data?.data?.updated ?? 0;
      const created = data?.data?.created ?? 0;
      toast.success(
        `Updated ${updated} visa type${updated !== 1 ? 's' : ''}${created > 0 ? `, created for ${created} new` : ''}.`,
      );
      await Promise.all([
        qc.invalidateQueries({ queryKey: CHECKLIST_TEMPLATE_KEYS.summary }),
        qc.invalidateQueries({ queryKey: [...CHECKLIST_GROUPED_QUERY_PREFIX] }),
        invalidateChecklistSummary(),
        invalidateChecklistGrouped(),
      ]);
    },
    onError: (error: Error) => {
      toast.error(error.message ?? 'Bulk update failed');
    },
  });
}
