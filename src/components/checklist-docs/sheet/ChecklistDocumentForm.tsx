'use client';

import { useRef } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { RiDeleteBinLine, RiExternalLinkLine, RiInformationLine, RiUpload2Line } from 'react-icons/ri';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { MultiSelect } from '@/components/ui/multi-select';
import { FORMAT_OPTIONS, STATE_OPTIONS } from '@/lib/constants/checklistDocTemplatesTable';
import { cn } from '@/lib/utils';
import type { ChecklistDocumentFormValues } from './ChecklistDocumentSheet';

type FormValues = ChecklistDocumentFormValues;

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ACCEPTED_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
const ACCEPTED_EXT = '.pdf,.jpg,.jpeg,.png';

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

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;
    if (!ACCEPTED_TYPES.includes(file.type)) {
      onSampleFileChange(null);
      return;
    }
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
                  Allowed <span className="text-destructive">*</span>
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
            render={({ field }) => (
              <FormItem>
                <FormLabel>State</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {STATE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
              <FormLabel>
                Format <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <MultiSelect
                  options={FORMAT_OPTIONS.map((o) => ({
                    value: o.value,
                    label: o.label,
                    icon: o.icon,
                  }))}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Select formats"
                  error={fieldState.error?.message}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Separator />

        {/* Sample Document upload — hidden when applyToAll */}
        {!applyToAll && (
          <div className="flex flex-col gap-1.5">
            <Label>Sample Document</Label>

            {/* Existing file in edit mode */}
            {mode === 'edit' && existingSampleUrl && !sampleFile && (
              <div className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2">
                <RiExternalLinkLine className="size-4 shrink-0 text-neutral-400" />
                <a
                  href={existingSampleUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 truncate text-xs text-blue-600 underline-offset-2 hover:underline"
                >
                  {existingSampleUrl.split('/').pop()}
                </a>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => fileInputRef.current?.click()}
                  className="h-6 shrink-0 px-2 text-xs text-neutral-500"
                >
                  Replace
                </Button>
              </div>
            )}

            {/* Selected new file */}
            {sampleFile && (
              <div className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2">
                <RiUpload2Line className="size-4 shrink-0 text-neutral-400" />
                <span className="flex-1 truncate text-xs text-neutral-700">
                  {sampleFile.name}
                </span>
                <span className="shrink-0 text-xs text-neutral-400">
                  {formatBytes(sampleFile.size)}
                </span>
                <button
                  type="button"
                  onClick={() => onSampleFileChange(null)}
                  className="shrink-0 rounded p-0.5 text-neutral-400 hover:text-red-500"
                >
                  <RiDeleteBinLine className="size-3.5" />
                </button>
              </div>
            )}

            {/* Drop zone — shown when no file selected (or always in create mode) */}
            {!sampleFile && !(mode === 'edit' && existingSampleUrl) && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  'flex flex-col items-center gap-2 rounded-lg border-2 border-dashed border-neutral-200 px-4 py-6',
                  'text-neutral-400 transition-colors hover:border-neutral-300 hover:bg-neutral-50',
                )}
              >
                <RiUpload2Line className="size-6" />
                <span className="text-xs">
                  Click to upload PDF, JPG or PNG
                </span>
                <span className="text-xs text-neutral-300">Max 5 MB</span>
              </button>
            )}

            {/* Upload another button when edit has existing URL */}
            {mode === 'edit' && existingSampleUrl && !sampleFile && (
              <p className="text-xs text-neutral-400">
                Click <strong>Replace</strong> to upload a new file.
              </p>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_EXT}
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>
        )}

        {applyToAll && (
          <div className="flex items-start gap-2 rounded-lg border border-amber-100 bg-amber-50 p-3">
            <RiInformationLine className="mt-0.5 size-4 shrink-0 text-amber-500" />
            <p className="text-xs leading-relaxed text-amber-700">
              Sample document upload is not available for bulk operations.
            </p>
          </div>
        )}

        {/* Important Note */}
        <FormField
          control={form.control}
          name="importantNote"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Important Note</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  value={field.value ?? ''}
                  placeholder="Any important instructions for the applicant…"
                  className="resize-none"
                  rows={3}
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
