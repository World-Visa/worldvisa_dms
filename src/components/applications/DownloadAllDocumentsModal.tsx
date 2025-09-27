"use client";

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Download, 
  Loader2,
  AlertCircle,
  FileArchive
} from 'lucide-react';
import { toast } from 'sonner';
import { downloadAllDocuments } from '@/lib/api/downloadAllDocuments';

interface DownloadAllDocumentsModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  leadId: string;
}


export function DownloadAllDocumentsModal({
  isOpen,
  onOpenChange,
  leadId
}: DownloadAllDocumentsModalProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async () => {
    setIsDownloading(true);
    setError(null);

    try {
      await downloadAllDocuments(leadId);
      toast.success('Download started successfully!');
      onOpenChange(false); // Close modal after successful download
    } catch (err) {
      console.error('Download failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to download documents';
      setError(errorMessage);
      toast.error('Failed to download documents');
    } finally {
      setIsDownloading(false);
    }
  };


  const handleClose = () => {
    if (!isDownloading) {
      setError(null);
      onOpenChange(false);
    }
  };


  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md" showCloseButton={!isDownloading}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileArchive className="h-5 w-5 text-blue-600" />
            Download All Documents
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!isDownloading && !error && (
            <div className="text-center py-6">
              <div className="flex flex-col items-center gap-4">
                <FileArchive className="h-12 w-12 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600 mb-2">
                    This will download all approved documents as a ZIP file.
                  </p>
                  <p className="text-xs text-gray-500">
                    The download will start immediately when you click the button.
                  </p>
                </div>
              </div>
            </div>
          )}

          {isDownloading && (
            <div className="text-center py-6">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Downloading documents...
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Please wait while we prepare your ZIP file.
                  </p>
                </div>
              </div>
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {error}
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isDownloading}
          >
            Cancel
          </Button>
          
          <Button
            onClick={handleDownload}
            disabled={isDownloading}
            className="flex items-center gap-2"
          >
            {isDownloading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Downloading...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Download ZIP
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
