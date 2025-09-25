'use client';

import React, { useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  FileText, 
  Download, 
  AlertCircle, 
  Loader2,
  Eye,
  File
} from 'lucide-react';
import { toast } from 'sonner';
import type { SampleDocumentModalProps } from '@/types/samples';
import { useSampleDocument, useDownloadSampleDocument } from '@/hooks/useSampleDocuments';

export function SampleDocumentModal({
  isOpen,
  onClose,
  documentType,
  category,
  samplePath: propSamplePath,
  companyName
}: SampleDocumentModalProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get sample document data
  const { data: sampleDocument, isLoading: isLoadingSample } = useSampleDocument({
    documentType,
    category,
    enabled: isOpen
  });

  const { downloadSample } = useDownloadSampleDocument();

  // Use the sample path from the hook if not provided as prop
  const samplePath = propSamplePath || sampleDocument?.path || '';

  const handleDownload = useCallback(async () => {
    if (!samplePath) {
      setError('Sample document not available');
      return;
    }

    setIsDownloading(true);
    setError(null);

    try {
      const result = await downloadSample(samplePath, `${documentType} Sample.docx`);
      
      if (result.success) {
        toast.success('Sample document download started');
      } else {
        setError(result.error || 'Failed to download sample document');
        toast.error('Download failed');
      }
    } catch (err) {
      console.error('Download failed:', err);
      setError('Failed to download sample document. Please try again.');
      toast.error('Download failed');
    } finally {
      setIsDownloading(false);
    }
  }, [samplePath, documentType, downloadSample]);

  const handleViewInNewTab = useCallback(() => {
    if (!samplePath) {
      setError('Sample document not available');
      return;
    }

    try {
      window.open(samplePath, '_blank', 'noopener,noreferrer');
    } catch (err) {
      console.error('Failed to open document:', err);
      setError('Failed to open sample document');
      toast.error('Failed to open document');
    }
  }, [samplePath]);

  const getFileIcon = () => {
    if (samplePath?.toLowerCase().includes('.docx')) {
      return <FileText className="h-8 w-8 text-blue-600" />;
    }
    return <File className="h-8 w-8 text-gray-600" />;
  };

  const getCategoryBadgeVariant = () => {
    if (category.includes('Company')) return 'default';
    return 'secondary';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Sample Document
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Document Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <h3 className="text-lg font-semibold">{documentType}</h3>
              </div>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Sample Document Preview Area */}
          <div className="border rounded-lg p-6 text-center bg-muted/30">
            {isLoadingSample ? (
              <div className="space-y-3">
                <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                <div>
                  <p className="font-medium">Loading Sample Document...</p>
                  <p className="text-sm text-muted-foreground">
                    Please wait while we fetch the sample
                  </p>
                </div>
              </div>
            ) : samplePath ? (
              <div className="space-y-3">
                <div>
                  <p className="font-medium">Sample Document Available</p>
                  <p className="text-sm text-muted-foreground">
                    {documentType} Sample Template
                  </p>
                </div>
                <div className="flex justify-center gap-2">
                  {/* <Button
                    variant="outline"
                    size="sm"
                    onClick={handleViewInNewTab}
                    disabled={isDownloading}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View in New Tab
                  </Button> */}
                  <Button
                    size="sm"
                    onClick={handleDownload}
                    disabled={isDownloading}
                    className='cursor-pointer'
                  >
                    {isDownloading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4 mr-2" />
                    )}
                    Download Sample
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto" />
                <div>
                  <p className="font-medium text-muted-foreground">Sample Not Available</p>
                  <p className="text-sm text-muted-foreground">
                    No sample document found for this document type
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Additional Information */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Important Notes:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• This is a sample template for reference only</li>
              <li>• Please customize the content according to your specific situation</li>
              <li>• Ensure all information is accurate and up-to-date</li>
              <li>• Contact your case manager if you need assistance</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
