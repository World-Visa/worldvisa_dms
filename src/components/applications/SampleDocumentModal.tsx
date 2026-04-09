"use client";

import { useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import type { SampleDocumentModalProps } from "@/types/samples";

function getFileExtension(url: string): string {
  try {
    const pathname = new URL(url).pathname;
    return pathname.split(".").pop()?.toLowerCase() ?? "";
  } catch {
    return url.split(".").pop()?.toLowerCase() ?? "";
  }
}

export function SampleDocumentModal({
  isOpen,
  onClose,
  documentType,
  sampleDocumentUrl,
}: SampleDocumentModalProps) {
  const ext = sampleDocumentUrl ? getFileExtension(sampleDocumentUrl) : "";
  const isPdf = ext === "pdf";

  // Non-PDF files: open in new tab immediately and close the modal
  useEffect(() => {
    if (isOpen && sampleDocumentUrl && !isPdf) {
      window.open(sampleDocumentUrl, "_blank", "noopener,noreferrer");
      onClose();
    }
  }, [isOpen, sampleDocumentUrl, isPdf, onClose]);

  // Only render the modal for PDFs
  if (!isPdf) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="flex h-auto max-h-[90vh] w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-4xl rounded-2xl">
        <DialogHeader className="shrink-0 border-b border-border/80 bg-muted/30 px-6 pr-12 py-4">
          <DialogTitle className="flex items-center gap-2.5 font-medium tracking-tight text-foreground">
            Sample — {documentType}
          </DialogTitle>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-5">
          <iframe
            src={sampleDocumentUrl}
            title={`${documentType} sample document`}
            className="w-full rounded-lg border border-border/60"
            style={{ height: "60vh" }}
          />
        </div>

        <DialogFooter className="shrink-0 flex-row items-center gap-2 border-t border-border/80 bg-muted/20 px-6 py-4">
          <Button variant="outline" onClick={onClose} className="min-w-20">
            Close
          </Button>
          <Button
            onClick={() => window.open(sampleDocumentUrl, "_blank", "noopener,noreferrer")}
            className="min-w-40 gap-2"
          >
            <ExternalLink className="h-4 w-4" />
            Open in new tab
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
