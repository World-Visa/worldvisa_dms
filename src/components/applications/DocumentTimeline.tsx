"use client";

import { useDocumentTimeline } from "@/hooks/useDocumentTimeline";
import { Info, MousePointerClick } from "lucide-react";
import React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../ui/sheet";
import { Skeleton } from "../ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

type Props = {
  documentId: string;
};

const DocumentTimeline: React.FC<Props> = ({ documentId }) => {
  const { timeline, isLoading, error } = useDocumentTimeline(documentId);

  // Function to format a timestamp into "DD/MM/YYYY  hh:mm am/pm"
  function formatTimelineTimestamp(timestamp: string): string {
    const d = new Date(timestamp);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, "0");
    // You may also want to use seconds if needed
    // const seconds = String(d.getSeconds()).padStart(2, "0");
    const ampm = hours >= 12 ? "pm" : "am";
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    const hourStr = String(hours).padStart(2, "0");
    return `${day}/${month}/${year}  ${hourStr}:${minutes} ${ampm}`;
  }

  return (
    <div>
      <Sheet>
        <SheetTrigger>
          <p className="text-blue-500 border-b border-b-blue-500 cursor-pointer font-semibold select-none">
            Timeline
          </p>
        </SheetTrigger>
        <SheetContent className="min-w-auto">
          <SheetHeader>
            <SheetTitle>Document Timeline</SheetTitle>
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
                <p>Error Occured Loading timeline</p>
              </div>
            ) : (
              <div className="overflow-auto">
                {timeline && timeline.length > 0 ? (
                  timeline.map((data) => (
                    <div className="relative pl-8 pb-8 last:pb-0 group">
                      {/* Vertical line */}
                      <div className="absolute left-2 top-[10px] h-full w-0.5 bg-gray-200 group-last:hidden"></div>
                      {/* Timeline dot */}
                      <div className="absolute left-0 top-[10px] w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow"></div>
                      <div className="ml-2">
                        <div className="flex gap-[16px] items-start justify-between">
                          <div className="flex gap-[4px]">
                            <p className="font-semibold text-gray-900">
                              {data.event}
                            </p>
                          </div>
                          <div className="flex items-start gap-[4px] font-semibold text-gray-600 capitalize truncate">
                            <MousePointerClick className="w-[15px] h-[15px]" />
                            <p className="text-[14px]">{data.triggered_by}</p>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500">
                          {data?.timestamp
                            ? formatTimelineTimestamp(data.timestamp)
                            : "N/A"}
                        </p>
                        {data.details && (
                          <Tooltip>
                            <TooltipTrigger asChild className="w-fit">
                              <div className="flex items-center gap-[4px] cursor-pointer mt-[4px] text-blue-700">
                                <Info className="w-[15px] h-[15px]" />
                                <p>Details</p>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent className="bg-black text-white max-w-[200px]">
                              <span className="whitespace-pre-line">
                                {data.details}
                              </span>
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div>
                    <p>Timeline is empty</p>
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

export default DocumentTimeline;
