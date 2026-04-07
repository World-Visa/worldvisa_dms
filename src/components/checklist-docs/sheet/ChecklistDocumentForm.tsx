'use client';

import { useId, useRef } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { RiDeleteBinLine, RiExternalLinkLine, RiFileLine, RiInformationLine, RiUpload2Line } from 'react-icons/ri';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { PortableTextEditor } from '@/components/ui/PortableTextEditor';
import { Label } from '@/components/ui/label';
import * as CompactButton from '@/components/ui/primitives/button-compact';
import { Switch } from '@/components/ui/switch';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  RadioGroup,
  RadioGroupItem,
} from '@/components/ui/primitives/radio-group';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { FormatBadgeToggle } from '@/components/checklist-docs/sheet/FormatBadgeToggle';
import { STATE_OPTIONS } from '@/lib/constants/checklistDocTemplatesTable';
import { cn } from '@/lib/utils';
import type { ChecklistDocumentFormValues } from './ChecklistDocumentSheet';
import { Button } from '@/components/ui/primitives/button';

type FormValues = ChecklistDocumentFormValues;

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

interface ChecklistDocumentFormProps {
  mode: 'create' | 'edit';
  visaTypeCount: number;
  editableCategory?: boolean;
  existingSampleUrl?: string | null;
  sampleFile: File | null;
  onSampleFileChange: (file: File | null) => void;
}

export function ChecklistDocumentForm({
  mode,
  visaTypeCount,
  editableCategory = false,
  existingSampleUrl,
  sampleFile,
  onSampleFileChange,
}: ChecklistDocumentFormProps) {
  const form = useFormContext<FormValues>();
  const applyToAll = form.watch('applyToAll');
  const documentType = form.watch('documentType');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formatFieldLabelId = useId();
  const stateFieldLabelId = useId();

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      onSampleFileChange(null);
      return;
    }
    onSampleFileChange(file);
    // reset input so selecting same file again triggers onChange
    e.target.value = '';
  }

  function formatBytes(bytes: number) {
    return bytes < 1024 * 1024
      ? `${(bytes / 1024).toFixed(1)} KB`
      : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <div className="flex flex-col gap-5 p-5">
        {/* Category Name — only shown when creating a new category */}
        {editableCategory && (
          <FormField
            control={form.control}
            name="category"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel>
                  Category Name <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value ?? ''}
                    placeholder="e.g. Identity Documents"
                    aria-invalid={!!fieldState.error}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Document Type */}
        <FormField
          control={form.control}
          name="documentType"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel>
                Document Type <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="e.g. Passport"
                  aria-invalid={!!fieldState.error}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Allowed + State row */}
        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="allowedDocument"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel>
                 Number of Files Allowed <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    min={1}
                    placeholder="1"
                    aria-invalid={!!fieldState.error}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="state"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel id={stateFieldLabelId}>State</FormLabel>
                <FormControl>
                  <RadioGroup
                    value={field.value}
                    onValueChange={field.onChange}
                    aria-labelledby={stateFieldLabelId}
                    className={cn(
                      'flex flex-wrap gap-2',
                    )}
                  >
                    {STATE_OPTIONS.map((opt) => {
                      const selected = field.value === opt.value;
                      return (
                        <label
                          key={opt.value}
                          className={cn(
                            'inline-flex cursor-pointer items-center gap-2 rounded-full border px-2 py-1 text-xs font-medium',
                            selected
                              ? 'border-foreground/35 bg-foreground/8 text-foreground shadow-sm ring-1 ring-foreground/15'
                              : 'border-border bg-muted/35 text-muted-foreground hover:border-border hover:bg-muted/55 hover:text-foreground',
                          )}
                        >
                          <RadioGroupItem
                            value={opt.value}
                            className={cn(
                              'shrink-0 border-border',
                              'data-[state=checked]:border-foreground data-[state=checked]:text-foreground',
                            )}
                          />
                          <span>{opt.label}</span>
                        </label>
                      );
                    })}
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Format multi-select */}
        <FormField
          control={form.control}
          name="format"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel id={formatFieldLabelId}>
                Format <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <FormatBadgeToggle
                  labelId={formatFieldLabelId}
                  value={field.value}
                  onChange={field.onChange}
                  error={!!fieldState.error}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Separator />

        {/* Sample Document upload */}
        <div className="flex flex-col gap-1.5">
          <Label>Sample Document</Label>

          <div className="flex h-9 items-center gap-2 rounded-md border border-input bg-background px-3">
            {sampleFile ? (
              <>
                <RiFileLine className="size-3.5 shrink-0 text-muted-foreground" />
                <span className="flex-1 truncate text-sm">{sampleFile.name}</span>
                <span className="shrink-0 text-xs text-muted-foreground">{formatBytes(sampleFile.size)}</span>
                <CompactButton.Root
                  variant="ghost"
                  type="button"
                  onClick={() => onSampleFileChange(null)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <CompactButton.Icon as={RiDeleteBinLine} />
                </CompactButton.Root>
              </>
            ) : mode === 'edit' && existingSampleUrl ? (
              <>
                <RiFileLine className="size-3.5 shrink-0 text-muted-foreground" />
                <a
                  href={existingSampleUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 truncate text-sm text-blue-600 underline-offset-2 hover:underline"
                >
                  {existingSampleUrl.split('/').pop()}
                </a>
                <CompactButton.Root variant="ghost" type="button" asChild>
                  <a href={existingSampleUrl} target="_blank" rel="noopener noreferrer">
                    <CompactButton.Icon as={RiExternalLinkLine} />
                  </a>
                </CompactButton.Root>
                <CompactButton.Root
                  variant="ghost"
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <CompactButton.Icon as={RiUpload2Line} />
                </CompactButton.Root>
              </>
            ) : (
              <>
                <span className="flex-1 text-sm text-muted-foreground">No file attached</span>
                <Button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  size="2xs"
                  variant="primary"
                  mode="lighter"
                  leadingIcon={RiUpload2Line}
                  className="text-xs"
                >
                  Upload
                </Button>
              </>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="*"
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>

        {/* Important Note */}
        <FormField
          control={form.control}
          name="importantNote"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Important Note</FormLabel>
              <FormControl>
                <PortableTextEditor
                  value={field.value ?? null}
                  onChange={field.onChange}
                  placeholder="Any important instructions for the applicant…"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Separator />

        {/* Apply to All */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-4">
            <Label htmlFor="apply-to-all" className="flex cursor-pointer flex-col gap-0.5">
              <span className="text-sm font-medium text-neutral-900">
                Apply to all visa types
              </span>
              <span className="text-xs text-neutral-400">
                {mode === 'create'
                  ? `Creates for all ${visaTypeCount} visa types`
                  : `Updates across all ${visaTypeCount} visa types`}
              </span>
            </Label>
            <Controller
              control={form.control}
              name="applyToAll"
              render={({ field }) => (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Switch
                      id="apply-to-all"
                      checked={Boolean(field.value)}
                      onCheckedChange={field.onChange}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      {field.value
                        ? 'Toggle off to apply only to this visa type'
                        : 'Toggle on to apply to all visa types'}
                    </p>
                  </TooltipContent>
                </Tooltip>
              )}
            />
          </div>

          {applyToAll && documentType && (
            <div className="flex items-start gap-2 rounded-lg border border-blue-100 bg-blue-50 p-3">
              <RiInformationLine className="mt-0.5 size-4 shrink-0 text-blue-500" />
              <p className="text-xs leading-relaxed text-blue-700">
                {mode === 'create' ? (
                  <>
                    <strong>{documentType}</strong> will be created under this
                    category for all <strong>{visaTypeCount}</strong> visa types.
                    Duplicates will be skipped automatically.
                  </>
                ) : (
                  <>
                    Changes will be applied to all visa types that have{' '}
                    <strong>{documentType}</strong> under this category. Visa
                    types that don&apos;t have it yet will get it created.
                  </>
                )}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
