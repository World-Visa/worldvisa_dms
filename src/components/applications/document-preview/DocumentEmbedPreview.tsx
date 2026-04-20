"use client";

import Image from "next/image";
import { Download, Eye } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { RiBookOpenLine, RiDownloadLine } from "react-icons/ri";
import { Button } from "@/components/ui/primitives/button";
import { getDocumentFilesPreviewBaseUrl } from "@/lib/config/documentFilesPreview";
import {
  isZohoHostedDocumentUrl,
  openDocumentInSizedWindow,
} from "@/lib/documents/openDocumentViewer";
import { getFileIcon } from "@/lib/utils/fileIcon";
import { cn } from "@/lib/utils";

const IMAGE_EXT = new Set(["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "heic"]);
const VIDEO_EXT = new Set(["mp4", "webm"]);
const OFFICE_EXT = new Set(["doc", "docx", "xls", "xlsx", "ppt", "pptx"]);

function extensionOf(fileName: string): string {
  return fileName.split(".").pop()?.toLowerCase() ?? "";
}

function buildWorkersPreviewUrl(
  leadId: string,
  fileName: string,
  baseUrl?: string,
): string {
  const base = (baseUrl ?? getDocumentFilesPreviewBaseUrl()).replace(/\/$/, "");
  return `${base}/${leadId.trim()}/${encodeURIComponent(fileName.trim())}`;
}

function ExtensionEmbed({ src, fileName }: { src: string; fileName: string }) {
  const ext = extensionOf(fileName);

  if (IMAGE_EXT.has(ext)) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- remote workers host; avoid next/image domain config
      <Image fill src={src} alt="" className="max-h-full max-w-full rounded-lg border border-border/50 object-contain" />
    );
  }

  if (ext === "pdf") {
    return (
      <iframe
        title="PDF preview"
        src={src}
        className="h-full min-h-[280px] w-full rounded-lg border border-border/50 bg-background"
      />
    );
  }

  if (VIDEO_EXT.has(ext)) {
    return (
      <video controls className="w-full max-h-full rounded-lg border border-border/50 bg-black">
        <source src={src} />
      </video>
    );
  }

  if (OFFICE_EXT.has(ext)) {
    const gview = `https://docs.google.com/gview?url=${encodeURIComponent(src)}&embedded=true`;
    return (
      <iframe
        title="Document preview"
        src={gview}
        className="h-full min-h-[400px] w-full rounded-lg border border-border/50 bg-background"
      />
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border/60 bg-background/50 p-6 text-center">
      <p className="text-sm text-muted-foreground">Preview is not available for this file type.</p>
      <Button variant="primary" mode="gradient" className="text-sm" size="xs" leadingIcon={RiDownloadLine} asChild>
        <a href={src} target="_blank" rel="noopener noreferrer" download>
          Download file
        </a>
      </Button>
    </div>
  );
}

export type DocumentEmbedPreviewProps = {
  fileName: string;
  viewUrl: string;
  downloadUrl?: string;
  leadId?: string | null;
  workersBaseUrl?: string;
  className?: string;
  zohoGradientViewButton?: boolean;
  showFooter?: boolean;
  suppressEntranceMotion?: boolean;
};

export function DocumentEmbedPreview({
  fileName,
  viewUrl,
  downloadUrl,
  leadId,
  workersBaseUrl,
  className,
  zohoGradientViewButton = false,
  showFooter = true,
  suppressEntranceMotion = false,
}: DocumentEmbedPreviewProps) {
  const reduceMotion = useReducedMotion();
  const view = viewUrl.trim();
  const isZoho = Boolean(view && isZohoHostedDocumentUrl(view));
  const base = workersBaseUrl ?? getDocumentFilesPreviewBaseUrl();
  const canTryWorkers =
    !isZoho &&
    Boolean(leadId?.trim()) &&
    Boolean(fileName?.trim()) &&
    Boolean(base);
  const workersSrc = canTryWorkers
    ? buildWorkersPreviewUrl(leadId!.trim(), fileName.trim(), base)
    : null;

  const hasDirectUrl = Boolean(view);
  const hasWorkersPreview = Boolean(workersSrc);
  const hasAnyPreview = hasDirectUrl || hasWorkersPreview;
  const primaryOpenUrl = view || workersSrc || "";
  const downloadHref = (downloadUrl || view || workersSrc || "").trim();

  const displayName =
    fileName.length > 36 ? `${fileName.slice(0, 36)}…` : fileName || "Document";
  const fileIconSrc = getFileIcon(fileName || "document");

  const motionInner = {
    initial: reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    transition: reduceMotion
      ? { duration: 0.12 }
      : { type: "spring" as const, stiffness: 420, damping: 36 },
  };

  const previewShellClass = cn("relative min-h-0 flex-1 py-0 px-2");

  const renderBody = () => {
    if (!hasAnyPreview) {
      return (
        <div className="flex h-full min-h-[160px] items-center justify-center rounded-lg border border-dashed border-border/60 bg-background/50">
          <p className="px-4 text-center text-sm text-muted-foreground">No document URL available.</p>
        </div>
      );
    }

    if (isZoho && view) {
      return (
        <div className="flex h-full min-h-[160px] items-center justify-center">
          <div className="w-full max-w-xl rounded-xl border border-border/40 bg-background shadow-sm">
            <div className="flex items-center justify-between gap-3 px-5 py-4">
              <div className="flex min-w-0 items-center gap-3">
                <Image src={fileIconSrc} width={50} height={50} alt="" className="shrink-0 object-contain" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{displayName}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Preview opens in a popup (Zoho WorkDrive)
                  </p>
                </div>
              </div>
              {zohoGradientViewButton ? (
                <Button
                  variant="primary"
                  mode="gradient"
                  size="xs"
                  leadingIcon={RiBookOpenLine}
                  className="shrink-0 text-sm"
                  onClick={() => openDocumentInSizedWindow(view)}
                >
                  View document
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  mode="filled"
                  size="xs"
                  className="shrink-0 text-sm"
                  leadingIcon={RiBookOpenLine}
                  onClick={() => openDocumentInSizedWindow(view)}
                >
                  View document
                </Button>
              )}
            </div>
          </div>
        </div>
      );
    }

    if (workersSrc) {
      return (
        <div className="flex h-full min-h-[200px] w-full items-center justify-center overflow-auto">
          <div className="h-full w-full max-h-[min(70vh,720px)] min-h-[200px]">
            <ExtensionEmbed src={workersSrc} fileName={fileName} />
          </div>
        </div>
      );
    }

    if (view) {
      return (
        <div className="flex h-full min-h-[200px] w-full items-center justify-center overflow-auto">
          <div className="h-full w-full max-h-[min(70vh,720px)] min-h-[200px]">
            <ExtensionEmbed src={view} fileName={fileName} />
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col overflow-hidden bg-muted/15", className)}>
      {suppressEntranceMotion ? (
        <div className={previewShellClass}>{renderBody()}</div>
      ) : (
        <motion.div className={previewShellClass} {...motionInner}>
          {renderBody()}
        </motion.div>
      )}

      {showFooter ? (
        <div className="flex shrink-0 flex-col items-stretch gap-2 border-t border-border/40 bg-muted/15 px-4 py-3">
          {hasAnyPreview && primaryOpenUrl ? (
            <>
              {!isZoho ? (
                <div className="flex justify-center">
                  <Button
                    variant="secondary"
                    mode="lighter"
                    size="2xs"
                    className="cursor-pointer shrink-0 text-xs"
                    onClick={() => openDocumentInSizedWindow(primaryOpenUrl)}
                    leadingIcon={RiBookOpenLine}
                  >
                    View full screen
                  </Button>
                </div>
              ) : null}
              {downloadHref ? (
                <Button variant="primary" mode="filled" size="sm" className="w-full cursor-pointer gap-2" asChild>
                  <a href={downloadHref} target="_blank" rel="noopener noreferrer" download>
                    <Download className="size-4 shrink-0" />
                    Download
                  </a>
                </Button>
              ) : (
                <Button variant="primary" size="sm" className="w-full cursor-not-allowed gap-2" disabled>
                  <Download className="size-4 shrink-0" />
                  Download
                </Button>
              )}
            </>
          ) : (
            <>
              <div className="flex justify-center">
                <Button variant="secondary" size="sm" className="cursor-not-allowed gap-2" disabled>
                  <Eye className="size-4 shrink-0" />
                  View document
                </Button>
              </div>
              <Button variant="primary" size="sm" className="w-full cursor-not-allowed gap-2" disabled>
                <Download className="size-4 shrink-0" />
                Download
              </Button>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
