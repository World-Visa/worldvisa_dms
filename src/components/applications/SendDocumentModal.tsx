'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Loader2, FileText } from 'lucide-react';
import { Document } from '@/types/applications';

interface SendDocumentModalProps {
  documents: Document[];
  selectedDocument: Document;
  onSend?: (documentIds: string[], notes: string) => void;
}

export function SendDocumentModal({
  documents,
  selectedDocument,
  onSend
}: SendDocumentModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([selectedDocument._id]);

  const handleDocumentToggle = (documentId: string) => {
    setSelectedDocuments(prev => 
      prev.includes(documentId)
        ? prev.filter(id => id !== documentId)
        : [...prev, documentId]
    );
  };

  const handleSend = async () => {
    if (selectedDocuments.length === 0) return;
    
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      onSend?.(selectedDocuments, notes);
      setIsOpen(false);
      setNotes('');
      setSelectedDocuments([selectedDocument._id]);
    } catch (error) {
      console.error('Failed to send documents:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedCount = selectedDocuments.length;
  const canSend = selectedCount > 0 && !isLoading;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 cursor-pointer hover:bg-blue-700 w-full sm:w-auto">
          <Send className="h-4 w-4 mr-2" />
          Send to Kavitha Mam
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] mx-4">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-lg font-semibold">Send Documents to Kavitha Mam</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 max-h-[calc(90vh-120px)] overflow-y-auto pr-2">
          {/* Document Selection */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-900">
              Select Documents ({selectedCount} selected)
            </h3>
            <div className="space-y-2 max-h-48 overflow-y-auto border rounded-lg p-2 sm:p-3">
              {documents.map((document) => (
                <div
                  key={document._id}
                  className={`flex items-center space-x-2 sm:space-x-3 p-2 sm:p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedDocuments.includes(document._id)
                      ? 'bg-blue-50 border-blue-200'
                      : 'bg-white border-gray-200 hover:bg-gray-50'
                  }`}
                  onClick={() => handleDocumentToggle(document._id)}
                >
                  <input
                    type="checkbox"
                    checked={selectedDocuments.includes(document._id)}
                    onChange={() => handleDocumentToggle(document._id)}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 flex-shrink-0"
                  />
                  <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                      {document.file_name}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      Uploaded by {document.uploaded_by} • {new Date(document.uploaded_at).toLocaleDateString()}
                    </p>
                  </div>
                  {document._id === selectedDocument._id && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full flex-shrink-0">
                      Current
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Notes Section */}
          <div className="space-y-4">
            <label htmlFor="notes" className="text-sm font-medium text-gray-900">
              Notes (Optional)
            </label>
            <Textarea
              id="notes"
              placeholder="Add any notes or instructions for Kavitha Mam..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-1 min-h-[80px] sm:min-h-[100px] border border-gray-300 resize-none text-sm"
              maxLength={500}
            />
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <span className="text-xs text-gray-500">
                {notes.length}/500 characters
              </span>
              <span className="text-xs text-gray-500">
                {selectedCount} document{selectedCount !== 1 ? 's' : ''} selected
              </span>
            </div>
          </div>

        </div>

        {/* Action Buttons - Fixed at bottom */}
        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t bg-white">
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSend}
            disabled={!canSend}
            className="cursor-pointer bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send {selectedCount} Document{selectedCount !== 1 ? 's' : ''}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
