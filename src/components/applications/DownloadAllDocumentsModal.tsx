"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Download,
  Loader2,
  FileArchive,
  CheckCircle,
  AlertCircle,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  createZipExportJob,
  getZipExportJobStatus,
  cancelZipExportJob,
} from "@/lib/api/zipExportJob";

type ExportStatus =
  | "idle"
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "expired";

const POLL_INTERVAL_MS = 1500;

interface DownloadAllDocumentsModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  leadId: string;
}

function formatExpiryCountdown(expiresAt: string | null): string {
  if (!expiresAt) return "";
  try {
    const exp = new Date(expiresAt);
    const now = new Date();
    if (exp.getTime() <= now.getTime()) return "Expired";
    const ms = exp.getTime() - now.getTime();
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) return `Expires in ${hours}h ${minutes}m`;
    return `Expires in ${minutes}m`;
  } catch {
    return "";
  }
}

function CircularProgress({
  current,
  total,
  className = "",
}: {
  current: number;
  total: number;
  className?: string;
}) {
  const value = total > 0 ? Math.min(current / total, 1) : 0;
  const size = 120;
  const stroke = 8;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - value);
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={className}
      role="progressbar"
      aria-valuenow={total > 0 ? current : 0}
      aria-valuemax={total || 100}
      aria-valuemin={0}
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="currentColor"
        strokeWidth={stroke}
        className="text-muted/30"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="currentColor"
        strokeWidth={stroke}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="text-teal-600 dark:text-teal-400 transition-[stroke-dashoffset] duration-300"
        style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%" }}
      />
    </svg>
  );
}

export function DownloadAllDocumentsModal({
  isOpen,
  onOpenChange,
  leadId,
}: DownloadAllDocumentsModalProps) {
  const [jobId, setJobId] = useState<string | null>(null);
  const [status, setStatus] = useState<ExportStatus>("idle");
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [countdownTick, setCountdownTick] = useState(0);
  const isPollingRef = useRef(false);

  // Update countdown every minute when completed and expiresAt is set
  useEffect(() => {
    if (status !== "completed" || !expiresAt) return;
    const interval = setInterval(() => {
      setCountdownTick((t) => t + 1);
    }, 60_000);
    return () => clearInterval(interval);
  }, [status, expiresAt]);

  const reset = useCallback(() => {
    setJobId(null);
    setStatus("idle");
    setProgress({ current: 0, total: 0 });
    setDownloadUrl(null);
    setErrorMessage(null);
    setExpiresAt(null);
    isPollingRef.current = false;
  }, []);

  const startExport = useCallback(async () => {
    if (!leadId) return;
    setErrorMessage(null);
    try {
      const { job_id } = await createZipExportJob(leadId);
      setJobId(job_id);
      setStatus("pending");
      setProgress({ current: 0, total: 0 });
      isPollingRef.current = true;
    } catch (err) {
      console.error("Create ZIP export job failed:", err);
      const msg =
        err instanceof Error ? err.message : "Failed to create export.";
      setErrorMessage(msg);
      toast.error(msg);
    }
  }, [leadId]);

  const pollStatus = useCallback(async () => {
    if (!leadId || !jobId || !isPollingRef.current) return;
    try {
      const data = await getZipExportJobStatus(leadId, jobId);
      if (data.progress) {
        setProgress({
          current: data.progress.current,
          total: data.progress.total,
        });
      }
      if (data.status === "pending" || data.status === "processing") {
        setStatus(data.status);
        return;
      }
      isPollingRef.current = false;
      if (data.status === "completed") {
        setStatus("completed");
        setDownloadUrl(data.download_url ?? null);
        setExpiresAt(data.expires_at ?? null);
        toast.success("Export completed. You can download your ZIP file.");
        return;
      }
      if (data.status === "failed") {
        setStatus("failed");
        setErrorMessage(data.error_message ?? "Export failed.");
        toast.error(data.error_message ?? "Export failed.");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg === "expired") {
        isPollingRef.current = false;
        setStatus("expired");
        setErrorMessage("Download link has expired (24 hour limit).");
        toast.error("Download link has expired.");
      } else {
        isPollingRef.current = false;
        setStatus("failed");
        const fallback = "Failed to fetch export status.";
        setErrorMessage(msg || fallback);
        toast.error(msg || fallback);
      }
    }
  }, [leadId, jobId]);

  useEffect(() => {
    if (!jobId || (status !== "pending" && status !== "processing")) return;
    const interval = setInterval(pollStatus, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [jobId, status, pollStatus]);

  const cancelExport = useCallback(async () => {
    if (!leadId || !jobId || (status !== "pending" && status !== "processing"))
      return;
    try {
      await cancelZipExportJob(leadId, jobId);
      toast.success("Export cancelled.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to cancel.");
    } finally {
      isPollingRef.current = false;
      reset();
      onOpenChange(false);
    }
  }, [leadId, jobId, status, reset, onOpenChange]);

  const downloadFile = useCallback(() => {
    if (downloadUrl) window.open(downloadUrl, "_blank");
  }, [downloadUrl]);

  const handleClose = useCallback(() => {
    if (status === "pending" || status === "processing") {
      cancelExport();
      return;
    }
    reset();
    onOpenChange(false);
  }, [status, reset, onOpenChange, cancelExport]);

  const isBusy = status === "pending" || status === "processing";
  const canClose = !isBusy;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent
        className="sm:max-w-md"
        showCloseButton={canClose}
        onPointerDownOutside={(e) => canClose && handleClose()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileArchive className="h-5 w-5 text-teal-600 dark:text-teal-400" />
            Export All Documents
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4" role="status" aria-live="polite">
          {/* Idle */}
          {status === "idle" && (
            <div className="text-center py-6">
              <div className="flex flex-col items-center gap-4">
                <FileArchive className="h-12 w-12 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Export all approved documents as a ZIP file. The export runs
                    in the background; you can track progress here.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Pending */}
          {status === "pending" && (
            <div className="text-center py-6">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-teal-600 dark:text-teal-400" />
                <p className="text-sm font-medium text-foreground">
                  Preparing export...
                </p>
                <p className="text-xs text-muted-foreground">
                  Your job is in the queue.
                </p>
              </div>
            </div>
          )}

          {/* Processing */}
          {status === "processing" && (
            <div className="text-center py-6">
              <div className="flex flex-col items-center gap-4">
                <CircularProgress
                  current={progress.current}
                  total={progress.total || 1}
                  className="mx-auto text-teal-600 dark:text-teal-400"
                />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Collecting files
                  </p>
                  <p className="text-lg font-semibold text-teal-600 dark:text-teal-400 tabular-nums">
                    {progress.current} of {progress.total} files
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Completed */}
          {status === "completed" && (
            <div className="text-center py-4">
              <div className="flex flex-col items-center gap-4">
                <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-3">
                  <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Export ready
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatExpiryCountdown(expiresAt) ||
                      "Download link available."}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Failed */}
          {status === "failed" && (
            <div className="text-center py-4">
              <div className="flex flex-col items-center gap-4">
                <div className="rounded-full bg-destructive/10 p-3">
                  <AlertCircle className="h-10 w-10 text-destructive" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Export failed
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {errorMessage}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Expired */}
          {status === "expired" && (
            <div className="text-center py-4">
              <div className="flex flex-col items-center gap-4">
                <div className="rounded-full bg-amber-100 dark:bg-amber-900/30 p-3">
                  <XCircle className="h-10 w-10 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Link expired
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Download link has expired (24 hour limit). Start a new
                    export.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-wrap gap-2">
          {status === "idle" && (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={startExport} className="gap-2">
                <Download className="h-4 w-4" />
                Start export
              </Button>
            </>
          )}
          {(status === "pending" || status === "processing") && (
            <Button variant="outline" onClick={cancelExport} disabled={!jobId}>
              Cancel export
            </Button>
          )}
          {status === "completed" && (
            <>
              <Button variant="outline" onClick={handleClose}>
                Close
              </Button>
              <Button onClick={downloadFile} className="gap-2">
                <Download className="h-4 w-4" />
                Download ZIP
              </Button>
            </>
          )}
          {(status === "failed" || status === "expired") && (
            <>
              <Button variant="outline" onClick={handleClose}>
                Close
              </Button>
              <Button
                onClick={() => {
                  reset();
                  startExport();
                }}
                className="gap-2"
              >
                {status === "failed" ? "Try again" : "Start new export"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
