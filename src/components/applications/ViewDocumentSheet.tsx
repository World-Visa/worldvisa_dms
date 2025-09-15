import React, { useState, useEffect } from 'react'
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"
import { Button } from '../ui/button'
import DocumentComments from './DocumentComments'
import CommentErrorBoundary from './CommentErrorBoundary'
import DocumentPreview from './DocumentPreview'
import DocumentStatusButtons from './DocumentStatusButtons'
import DocumentStatusDisplay from './DocumentStatusDisplay'
import { SendDocumentModal } from './SendDocumentModal'
import { 
    User, 
    Clock, 
    FileText,
    Upload,
    AlertCircle
} from 'lucide-react'
import { Document } from '@/types/applications'

interface ViewDocumentSheetProps {
    document: Document;
    documents: Document[];
    applicationId: string;
    isOpen?: boolean;
    onClose?: () => void;
    isClientView?: boolean; // New prop to hide admin-specific features
    onReuploadDocument?: (documentId: string, documentType: string, category: string) => void;
    documentType?: string;
    category?: string;
}


const ViewDocumentSheet: React.FC<ViewDocumentSheetProps> = ({
    document,
    documents,
    applicationId,
    isOpen,
    onClose,
    isClientView = false,
    onReuploadDocument,
    documentType,
    category
}) => {
    const currentDocumentIndex = documents.findIndex(doc => doc._id === document._id);
    const [selectedIndex, setSelectedIndex] = useState(currentDocumentIndex >= 0 ? currentDocumentIndex : 0);

    const currentDoc = documents[selectedIndex] || documents[0];
    
    // Update selectedIndex when documents array changes (e.g., when a document is deleted)
    useEffect(() => {
        const newIndex = documents.findIndex(doc => doc._id === document._id);
        if (newIndex >= 0) {
            setSelectedIndex(newIndex);
        } else if (documents.length > 0) {
            setSelectedIndex(0);
        } else {
            // If no documents left and this document was deleted, close the sheet
            if (onClose) {
                onClose();
            }
        }
    }, [documents, document._id, onClose]);
    
    if (!currentDoc || documents.length === 0) {
        return (
            <Button
                variant="link"
                size="sm"
                className='cursor-pointer'
                disabled
            >
                view
            </Button>
        );
    }
    
    return (
        <div className='w-full '>
            <Sheet open={isOpen} onOpenChange={onClose}>
                <SheetTrigger asChild>
                    <Button
                        variant="link"
                        size="sm"
                        className='cursor-pointer'
                    >
                        view
                    </Button>
                </SheetTrigger>
                <SheetContent className='w-[95vw] sm:w-[80vw] md:w-[70vw] lg:w-[60vw] xl:w-[1140px] !max-w-[1140px] p-0 rounded-l-3xl'>
                    <div className="flex flex-col h-full">
                        {/* Header Bar */}
                        <SheetHeader className="p-4 border-b">
                            <SheetTitle className="sr-only">Document Review</SheetTitle>
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mx-2 sm:mx-6">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                                    <div className="flex items-center space-x-2">
                                        <User className="h-4 w-4 text-gray-500" />
                                        <span className="text-sm text-gray-600">
                                            Uploaded by {currentDoc.uploaded_by}
                                        </span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Clock className="h-4 w-4 text-gray-500" />
                                        <span className="sr-only">Uploaded at</span>
                                        <span className="text-sm text-gray-600">
                                            {new Date(currentDoc.uploaded_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                                {!isClientView && (
                                    <SendDocumentModal
                                        documents={documents}
                                        selectedDocument={currentDoc}
                                        onSend={(documentIds, notes) => {
                                            console.log('Sending documents:', documentIds, 'with notes:', notes);
                                        }}
                                    />
                                )}
                            </div>
                        </SheetHeader>

                        {/* Document Selector Chips */}
                        <div className="p-2 sm:p-4 border-b bg-white">
                            <div className="flex gap-1 sm:gap-2 overflow-x-auto scrollbar-hide pb-2">
                                {documents.map((doc, index) => (
                                    <button
                                        key={doc._id}
                                        onClick={() => setSelectedIndex(index)}
                                        className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded-full text-xs font-medium transition-colors whitespace-nowrap flex-shrink-0 cursor-pointer ${selectedIndex === index
                                                ? 'bg-[#222222] text-white'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                    >
                                        <div className="flex items-center space-x-1 sm:space-x-2">
                                            <FileText className="h-3 w-3 sm:h-4 sm:w-4" />
                                            <span className="max-w-[120px] sm:max-w-none truncate">{doc.file_name}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Main Content */}
                        <div className="flex-1 flex flex-col lg:flex-row lg:overflow-hidden overflow-y-auto">
                            {/* Document Section - Top on mobile, Left on desktop */}
                            <div className="flex-1 p-2 sm:p-4 relative order-1 lg:order-1">
                                <DocumentPreview document={currentDoc} />

                                {/* Status Display */}
                                <DocumentStatusDisplay document={currentDoc} />

                                {/* Reupload Button for Rejected Documents */}
                                {currentDoc.status === 'rejected' && onReuploadDocument && documentType && category && (
                                    <div className="mt-4">
                                        <Button
                                            onClick={() => onReuploadDocument(currentDoc._id, documentType, category)}
                                            className="bg-orange-600 hover:bg-orange-700 text-white"
                                            size="sm"
                                        >
                                            <Upload className="h-4 w-4 mr-2" />
                                            Reupload Document
                                        </Button>
                                    </div>
                                )}

                                {/* Status Buttons - Bottom Right (Admin only) */}
                                {!isClientView && (
                                    <DocumentStatusButtons
                                        document={currentDoc}
                                        applicationId={applicationId}
                                        onStatusChange={(documentId, newStatus) => {
                                            console.log(`Document ${documentId} status changed to: ${newStatus}`);
                                        }}
                                    />
                                )}
                            </div>

                            {/* Comments Section - Bottom on mobile, Right on desktop */}
                            <div className="w-full lg:flex-shrink-0 lg:w-80 xl:w-96 order-2 lg:order-2 border-t lg:border-t-0 lg:border-l">
                                <CommentErrorBoundary>
                                    <DocumentComments
                                        documentId={currentDoc._id}
                                        isClientView={isClientView}
                                    />
                                </CommentErrorBoundary>
                            </div>
                        </div>
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    )
}

export default ViewDocumentSheet