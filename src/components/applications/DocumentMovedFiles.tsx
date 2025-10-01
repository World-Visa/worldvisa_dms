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

type Props = {
  documentId: string;
};

const DocumentMovedFiles: React.FC<Props> = ({ documentId }) => {
  const { movedDocs, isLoading, error, getDocumentLink } =
    useDocumentMovedDocs(documentId);

  // Open the document in a new tab (or window) with 800x800 size
  const handleOpenDocument = async (fileId: string) => {
    const link = await getDocumentLink(fileId);
    if (link && link.link) {
      window.open(link.link, "_blank", "width=800,height=800");
    }
  };

  return (
    <div>
      <Sheet>
        <SheetTrigger>
          <p className="text-blue-500 border-b border-b-blue-500 cursor-pointer font-semibold select-none">
            Deleted Files
          </p>
        </SheetTrigger>
        <SheetContent className="min-w-auto">
          <SheetHeader>
            <SheetTitle>Moved Files</SheetTitle>
          </SheetHeader>
          <div className="px-4 overflow-auto mb-[10px]">
            {isLoading ? (
              <div className="flex flex-col gap-4 p-4">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <div className="flex flex-col gap-3 mt-4">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
            ) : error ? (
              <div>
                <p>Error Occurred Loading moved files</p>
              </div>
            ) : (
              <div className="overflow-auto">
                {movedDocs && movedDocs.length > 0 ? (
                  movedDocs.map((file, idx) => (
                    <div
                      key={file._id || idx}
                      className="relative pl-8 pb-8 last:pb-0 group"
                    >
                      {/* Vertical line */}
                      <div className="absolute left-2 top-[10px] h-full w-0.5 bg-gray-200 group-last:hidden"></div>
                      {/* Timeline dot */}
                      <div className="absolute left-0 top-[10px] w-4 h-4 rounded-full bg-green-500 border-2 border-white shadow"></div>
                      <div className="ml-2">
                        <div className="flex gap-[16px] items-start justify-between">
                          <div className="flex flex-col">
                            <p
                              onClick={() => handleOpenDocument(file.file_id)}
                              className="font-semibold text-blue-700 border-b border-b-blue-700 cursor-pointer hover:text-blue-900 hover:border-b-blue-900"
                            >
                              {file.file_name || "Unnamed File"}
                            </p>
                          </div>
                          <div className="flex flex-col items-end">
                            <p className="text-[13px] text-gray-600">
                              {file.moved_by || "Unknown"}
                            </p>
                            <p className="text-xs text-gray-400">
                              {file.moved_at
                                ? new Date(file.moved_at).toLocaleString()
                                : ""}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div>
                    <p>No moved files found</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default DocumentMovedFiles;
