import React from "react";
import { Document } from "@/types/applications";

interface DocumentStatusDisplayProps {
  document: Document;
  isClientView: boolean;
}

const DocumentStatusDisplay: React.FC<DocumentStatusDisplayProps> = ({
  document,
  isClientView,
}) => {
  const lastStatusChange = document.history[document.history.length - 1];

  return (
    <div className="">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between ">
        {lastStatusChange && (() => {
          const d = lastStatusChange.changed_at ? new Date(lastStatusChange.changed_at) : null;
          const isValid = d && !isNaN(d.getTime());
          return (
            <div className="text-left flex gap-1 sm:text-right">
              <div className="text-[12px] text-muted-foreground">
                Last updated by :{" "}
                <span className="font-medium">{lastStatusChange.changed_by}</span>
              </div>
              {isValid && (
                <div className="text-[12px] text-muted-foreground/70">
                  {d.toLocaleDateString()} at{" "}
                  {d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true })}
                </div>
              )}
            </div>
          );
        })()}
      </div>
    </div>
  );
};

export default DocumentStatusDisplay;
