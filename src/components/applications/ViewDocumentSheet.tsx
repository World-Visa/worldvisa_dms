import React, { useState } from 'react'
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
import { 
    Send, 
    User, 
    Clock, 
    FileText
} from 'lucide-react'
import { Document } from '@/types/applications'

interface ViewDocumentSheetProps {
    document: Document;
    documents: Document[];
    applicationId: string;
}


const ViewDocumentSheet: React.FC<ViewDocumentSheetProps> = ({
    document,
    documents,
    applicationId
}) => {
    const currentDocumentIndex = documents.findIndex(doc => doc._id === document._id);
    const [selectedIndex, setSelectedIndex] = useState(currentDocumentIndex >= 0 ? currentDocumentIndex : 0);

    const currentDoc = documents[selectedIndex];
    
    return (
        <div className='w-full '>
            <Sheet>
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
                        <SheetHeader className="p-4 border-b ">
                            <SheetTitle className="sr-only">Document Review</SheetTitle>
                            <div className="flex items-center justify-between mx-6">
                                <div className="flex items-center space-x-4">
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
                                <Button className="bg-blue-600 cursor-pointer hover:bg-blue-700">
                                    <Send className="h-4 w-4 mr-2" />
                                    Send to Kavitha Mam
                                </Button>
                            </div>
                        </SheetHeader>

                        {/* Document Selector Chips */}
                        <div className="p-4 border-b bg-white">
                            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
                                {documents.map((doc, index) => (
                                    <button
                                        key={doc._id}
                                        onClick={() => setSelectedIndex(index)}
                                        className={`px-3 py-2 rounded-full text-xs font-medium transition-colors whitespace-nowrap flex-shrink-0 cursor-pointer ${selectedIndex === index
                                                ? 'bg-[#222222] text-white'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                    >
                                        <div className="flex items-center space-x-2">
                                            <FileText className="h-4 w-4" />
                                            <span>{doc.file_name}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Main Content */}
                        <div className="flex-1 flex overflow-hidden">
                            {/* Left Section - Document Preview */}
                            <div className="flex-1 p-4 relative">
                                <DocumentPreview document={currentDoc} />

                                {/* Status Display */}
                                <DocumentStatusDisplay document={currentDoc} />

                                {/* Status Buttons - Bottom Right */}
                                <DocumentStatusButtons
                                    document={currentDoc}
                                    applicationId={applicationId}
                                    onStatusChange={(documentId, newStatus) => {
                                        console.log(`Document ${documentId} status changed to: ${newStatus}`);
                                    }}
                                />
                            </div>

                            {/* Right Section - Comments */}
                            <CommentErrorBoundary>
                                <DocumentComments
                                    documentId={currentDoc._id}
                                />
                            </CommentErrorBoundary>
                        </div>
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    )
}

export default ViewDocumentSheet