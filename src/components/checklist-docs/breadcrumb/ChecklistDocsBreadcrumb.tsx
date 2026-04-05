import { RiFolder2Line, RiFolder3Line, RiFolderOpenLine } from 'react-icons/ri';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/primitives/breadcrumb';
import { ROUTES } from '@/utils/routes';

interface ChecklistDocsBreadcrumbProps {
  visaType?: string;
  category?: string;
}

export function ChecklistDocsBreadcrumb({
  visaType,
  category,
}: ChecklistDocsBreadcrumbProps) {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          {visaType ? (
            <BreadcrumbLink href={ROUTES.CHECKLIST_DOCS} className="flex items-center gap-1.5">
              <RiFolder2Line className="size-3.5 shrink-0" />
              Library
            </BreadcrumbLink>
          ) : (
            <BreadcrumbPage className="flex items-center gap-1.5">
              <RiFolder2Line className="size-3.5 shrink-0" />
              Library
            </BreadcrumbPage>
          )}
        </BreadcrumbItem>

        {visaType && (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              {category ? (
                <BreadcrumbLink
                  href={ROUTES.CHECKLIST_DOCS_VISA(visaType)}
                  className="flex items-center gap-1.5"
                >
                  <RiFolder3Line className="size-3.5 shrink-0" />
                  {decodeURIComponent(visaType)}
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage className="flex items-center gap-1.5">
                  <RiFolder3Line className="size-3.5 shrink-0" />
                  {decodeURIComponent(visaType)}
                </BreadcrumbPage>
              )}
            </BreadcrumbItem>
          </>
        )}

        {category && (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="flex items-center gap-1.5">
                <RiFolderOpenLine className="size-3.5 shrink-0" />
                {decodeURIComponent(category)}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
