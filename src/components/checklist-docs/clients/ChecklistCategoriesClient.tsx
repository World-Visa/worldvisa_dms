'use client';

import { memo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ViewTransition } from 'react';
import { RiFolderAddLine } from 'react-icons/ri';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/primitives/button';
import { FolderCategoryCard } from '@/components/applications/filter/FolderCategoryCard';
import { ListNoResults } from '@/components/applications/list-no-results';
import { useGroupedDocuments, useVisaServiceTypes } from '@/hooks/useChecklistDocumentTemplates';
import { ROUTES } from '@/utils/routes';
import { ChecklistDocsBreadcrumb } from '../breadcrumb/ChecklistDocsBreadcrumb';
import { ChecklistDocumentSheet } from '../sheet/ChecklistDocumentSheet';

interface ChecklistCategoriesClientProps {
  visaType: string;
}

export const ChecklistCategoriesClient = memo(function ChecklistCategoriesClient({
  visaType,
}: ChecklistCategoriesClientProps) {
  const router = useRouter();
  const [categorySheetOpen, setCategorySheetOpen] = useState(false);

  const { data: groupedData, isLoading } = useGroupedDocuments(visaType);
  const { data: visaTypesData } = useVisaServiceTypes();

  const visaTypeCount =
    (visaTypesData?.data?.visaServiceTypes ?? []).filter((v) => v !== 'All').length;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-5 w-48" />
        <div className="flex flex-wrap gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[208px] w-[190px] rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  const groups = groupedData?.data?.groups ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <ViewTransition name={`visa-folder-header-${visaType.replace(/\s+/g, '-').toLowerCase()}`}>
          <ChecklistDocsBreadcrumb visaType={visaType} />
        </ViewTransition>
        <Button
          size="xs"
          variant="primary"
          mode="gradient"
          className='text-sm'
          onClick={() => setCategorySheetOpen(true)}
        >
          <RiFolderAddLine className="mr-1.5 size-4" />
          Add Category
        </Button>
      </div>

      {groups.length === 0 ? (
        <ListNoResults
          title="No categories yet"
          description={`No document categories found for ${decodeURIComponent(visaType)}. Create the first category by adding a document.`}
          action={
            <Button 
              size="sm"
              variant="primary"
              mode="gradient"
              className='text-sm'
              onClick={() => setCategorySheetOpen(true)}
            >
              <RiFolderAddLine className="mr-1.5 size-4" />
              Add Category
            </Button>
          }
        />
      ) : (
        <div className="flex flex-wrap gap-4 ">
          {groups.map((group) => (
            <FolderCategoryCard
              key={group.category}
              category={{
                id: group.category,
                label: group.category,
                count: group.documents.length,
              }}
              count={group.documents.length}
              isActive={false}
              onClick={() =>
                router.push(
                  ROUTES.CHECKLIST_DOCS_CATEGORY(visaType, group.category),
                )
              }
            />
          ))}
        </div>
      )}


      {/* Add new category (editable category name) */}
      <ChecklistDocumentSheet
        mode="create"
        visaType={visaType}
        category=""
        editableCategory
        open={categorySheetOpen}
        onOpenChange={setCategorySheetOpen}
        visaTypeCount={visaTypeCount}
      />
    </div>
  );
});
