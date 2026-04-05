'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { RiFolderAddLine, RiFolderLine } from 'react-icons/ri';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetMain,
  SheetTitle,
} from '@/components/ui/primitives/sheet';
import {
  useBulkCreate,
  useBulkUpdate,
  useCreateDocument,
  useUpdateDocument,
} from '@/hooks/useChecklistDocumentTemplates';
import type { ChecklistDocumentTemplate } from '@/types/checklistDocumentTemplates';
import { normalizeChecklistRouteParam } from '@/lib/constants/checklistRouteParams';
import { ChecklistDocumentForm } from './ChecklistDocumentForm';

export const checklistDocumentFormSchema = z.object({
  category: z.string().optional(),
  documentType: z.string().min(1, 'Document type is required'),
  allowedDocument: z.number().min(1, 'At least 1 allowed'),
  format: z.array(z.string()).min(1, 'At least one format is required'),
  state: z.enum(['active', 'inactive']),
  importantNote: z.string().optional(),
  applyToAll: z.boolean(),
});

export type ChecklistDocumentFormValues = z.infer<
  typeof checklistDocumentFormSchema
>;

interface ChecklistDocumentSheetProps {
  mode: 'create' | 'edit';
  document?: ChecklistDocumentTemplate;
  visaType: string;
  category: string;
  editableCategory?: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  visaTypeCount: number;
}

export function ChecklistDocumentSheet({
  mode,
  document,
  visaType,
  category,
  editableCategory = false,
  open,
  onOpenChange,
  visaTypeCount,
}: ChecklistDocumentSheetProps) {
  const createDocument = useCreateDocument();
  const updateDocument = useUpdateDocument();
  const bulkCreate = useBulkCreate();
  const bulkUpdate = useBulkUpdate();

  const resolvedVisaType = normalizeChecklistRouteParam(visaType);

  const [sampleFile, setSampleFile] = useState<File | null>(null);

  const isPending =
    createDocument.isPending ||
    updateDocument.isPending ||
    bulkCreate.isPending ||
    bulkUpdate.isPending;

  const form = useForm<ChecklistDocumentFormValues>({
    resolver: zodResolver(checklistDocumentFormSchema),
    defaultValues: {
      category: '',
      documentType: '',
      allowedDocument: 1,
      format: [],
      state: 'active',
      importantNote: '',
      applyToAll: false,
    },
  });

  useEffect(() => {
    if (!open) return;
    setSampleFile(null);
    if (mode === 'edit' && document) {
      form.reset({
        category: '',
        documentType: document.documentType,
        allowedDocument: document.allowedDocument,
        format: document.format,
        state: document.state,
        importantNote: document.importantNote ?? '',
        applyToAll: false,
      });
    } else {
      form.reset({
        category: '',
        documentType: '',
        allowedDocument: 1,
        format: [],
        state: 'active',
        importantNote: '',
        applyToAll: false,
      });
    }
  }, [open, mode, document, form]);

  async function onSubmit(values: ChecklistDocumentFormValues) {
    const effectiveCategory = editableCategory
      ? (values.category ?? '').trim()
      : category;

    if (editableCategory && !effectiveCategory) {
      form.setError('category', { message: 'Category name is required' });
      return;
    }

    if (mode === 'create') {
      if (values.applyToAll) {
        await bulkCreate.mutateAsync({
          category: effectiveCategory,
          documentType: values.documentType,
          allowedDocument: values.allowedDocument,
          format: values.format,
          state: values.state,
          importantNote: values.importantNote || null,
        });
      } else {
        const fd = new FormData();
        fd.append('category', effectiveCategory);
        fd.append('documentType', values.documentType);
        fd.append('allowedDocument', String(values.allowedDocument));
        for (const f of values.format) fd.append('format', f);
        fd.append('state', values.state);
        fd.append('visaServiceType', resolvedVisaType);
        if (values.importantNote) fd.append('importantNote', values.importantNote);
        if (sampleFile) fd.append('sampleDocument', sampleFile);
        await createDocument.mutateAsync({
          formData: fd,
          visaServiceType: resolvedVisaType,
        });
      }
    } else if (document) {
      if (values.applyToAll) {
        await bulkUpdate.mutateAsync({
          category: effectiveCategory,
          documentType: values.documentType,
          updates: {
            documentType: values.documentType,
            allowedDocument: values.allowedDocument,
            format: values.format,
            state: values.state,
            importantNote: values.importantNote || null,
          },
        });
      } else {
        const fd = new FormData();
        fd.append('documentType', values.documentType);
        fd.append('allowedDocument', String(values.allowedDocument));
        for (const f of values.format) fd.append('format', f);
        fd.append('state', values.state);
        if (values.importantNote) fd.append('importantNote', values.importantNote);
        if (sampleFile) fd.append('sampleDocument', sampleFile);
        await updateDocument.mutateAsync({
          id: document._id,
          formData: fd,
          visaType: resolvedVisaType,
        });
      }
    }

    onOpenChange(false);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col gap-0 p-0 sm:max-w-[480px]">
        <SheetHeader className="p-0">
          <SheetTitle className="sr-only">
            {editableCategory ? 'Add Category' : mode === 'create' ? 'Add Document' : 'Edit Document'}
          </SheetTitle>
          <header className="flex h-12 items-center gap-3 border-b px-3.5">
            {mode === 'create' ? (
              <RiFolderAddLine className="size-5 shrink-0 text-neutral-500" />
            ) : (
              <RiFolderLine className="size-5 shrink-0 text-neutral-500" />
            )}
            <span className="flex-1 truncate text-sm font-medium text-neutral-900">
              {editableCategory ? 'Add Category' : mode === 'create' ? 'Add Document' : 'Edit Document'}
            </span>
          </header>
        </SheetHeader>

        <Form {...form}>
          <form
            id="checklist-doc-form"
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex min-h-0 flex-1 flex-col"
          >
            <SheetMain className="p-0">
              <ChecklistDocumentForm
                mode={mode}
                visaTypeCount={visaTypeCount}
                editableCategory={editableCategory}
                existingSampleUrl={document?.sampleDocumentUrl ?? null}
                sampleFile={sampleFile}
                onSampleFileChange={setSampleFile}
              />
            </SheetMain>
          </form>
        </Form>

        <Separator />

        <SheetFooter className="p-0">
          <div className="flex w-full items-center justify-between gap-3 p-3">
            <p className="truncate text-xs text-neutral-400">
              {mode === 'create'
                ? `Under ${resolvedVisaType}`
                : 'Only changed fields will be updated'}
            </p>
            <Button
              type="submit"
              form="checklist-doc-form"
              disabled={isPending}
              size="sm"
            >
              {isPending
                ? 'Saving…'
                : editableCategory
                  ? 'Create Category'
                  : mode === 'create'
                    ? 'Add Document'
                    : 'Save Changes'}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
