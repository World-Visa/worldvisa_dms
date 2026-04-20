"use client";

import React from "react";
import { useDocumentMovedDocs } from "@/hooks/useDocumentMovedDocs";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../ui/sheet";
import { Skeleton } from "../ui/skeleton";
import { cn } from "@/lib/utils";

type Props = {
  documentId: string;
  /** When set, clicking "Deleted Files" calls this instead of opening a sheet (e.g. inline panel in document modal). */
  onOpenInPanel?: () => void;
};

export function DocumentMovedFilesPanel({
  documentId,
  className,
}: {
  documentId: string;
  className?: string;
}) {
  const { movedDocs, isLoading, error, getDocumentLink } =
    useDocumentMovedDocs(documentId);

  const handleOpenDocument = async (fileId: string) => {
    const link = await getDocumentLink(fileId);
    if (link && link.link) {
      window.open(link.link, "_blank", "width=800,height=800");
    }
  };

  const formattedDate = (moved_at: string) => {
    const date = new Date(moved_at);
    const options: Intl.DateTimeFormatOptions = {
      day: "2-digit",
      month: "short",
      year: "numeric",
    };
    const datePart = date.toLocaleDateString(undefined, options);
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? "pm" : "am";
    hours = hours % 12;
    hours = hours ? hours : 12;
    const minutesStr = minutes < 10 ? "0" + minutes : minutes;
    const timePart = `${hours}:${minutesStr} ${ampm}`;
    return `${datePart}, ${timePart}`;
  };

  return (
    <div
      className={cn(
        "min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5",
        className,
      )}
    >
      {isLoading ? (
        <div className="flex flex-col gap-4 p-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="mt-4 flex flex-col gap-3">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      ) : error ? (
        <p className="text-sm text-muted-foreground">
          Could not load deleted files.
        </p>
      ) : !movedDocs || movedDocs.length === 0 ? (
        <p className="text-sm text-muted-foreground">No deleted files found.</p>
      ) : (
        <div className="overflow-auto">
          {movedDocs.map((file, idx) => (
            <div
              key={file._id || idx}
              className="group relative pb-8 pl-8 last:pb-0"
            >
              <div className="absolute left-2 top-[10px] h-full w-0.5 bg-border group-last:hidden" />
              <div className="absolute left-0 top-[10px] h-4 w-4 rounded-full border-2 border-background bg-emerald-500 shadow-sm ring-1 ring-border/40" />
              <div className="ml-2">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 flex-col">
                    <button
                      type="button"
                      onClick={() => handleOpenDocument(file.file_id)}
                      className="max-w-[220px] truncate border-b border-primary text-left text-sm font-semibold text-primary hover:text-primary/90"
 title={file.file_name || "Unnamed File"}
                    >
                      {file.file_name || "Unnamed File"}
                    </button>
                  </div>
                  <div className="flex shrink-0 flex-col items-end">
                    <p className="text-[13px] text-muted-foreground">
                      {file.moved_by || "Unknown"}
                    </p>
                    <p className="text-xs text-muted-foreground/80 tabular-nums">
                      {file.moved_at ? formattedDate(file.moved_at) : ""}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const DocumentMovedFiles: React.FC<Props> = ({
  documentId,
  onOpenInPanel,
}) => {
  const { movedDocs } = useDocumentMovedDocs(documentId);

  if (!movedDocs || movedDocs.length === 0) {
    return null;
  }

  if (onOpenInPanel) {
    return (
      <button
        type="button"
        onClick={onOpenInPanel}
        className="cursor-pointer border-b border-primary text-left text-sm font-semibold text-primary hover:text-primary/90"
      >
        Deleted Files
      </button>
    );
  }

  return (
    <div>
      <Sheet>
        <SheetTrigger asChild>
          <button
            type="button"
            className="cursor-pointer border-b border-primary text-left text-sm font-semibold text-primary hover:text-primary/90"
          >
            Deleted Files
          </button>
        </SheetTrigger>
        <SheetContent className="min-w-auto flex flex-col gap-0 p-0">
          <SheetHeader className="border-b border-border/60 px-6 pb-4 pt-6">
            <SheetTitle>Deleted Files</SheetTitle>
          </SheetHeader>
          <DocumentMovedFilesPanel documentId={documentId} className="px-6 py-5" />
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default DocumentMovedFiles;
