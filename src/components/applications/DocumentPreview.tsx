import React from 'react'
import { Button } from '../ui/button'
import { Eye, FileText } from 'lucide-react'
import { Document } from '@/types/applications'

interface DocumentPreviewProps {
    document: Document;
}

const DocumentPreview: React.FC<DocumentPreviewProps> = ({ document }) => {
    const handleViewDocument = () => {
        const url = document.document_link || document.download_url;
        if (!url) return;
        
        const width = 800;
        const height = 600;
        const top = (window.screen.height - height) / 2;
        const left = (window.screen.width - width) / 2;

        window.open(
            url,
            '_blank',
            `width=${width},height=${height},top=${top},left=${left},resizable=yes,scrollbars=yes`
        );
    };

    return (
        <div className="bg-white rounded-lg shadow-sm border h-[50%] lg:h-[60%] overflow-hidden relative">
            {document.document_link || document.download_url ? (
                <div className="w-full h-full flex items-center lg:py-0 py-4 justify-center">
                    <div className="text-center">
                        <FileText className="h-16 w-16 lg:block hidden mx-auto mb-4 text-gray-400" />
                        <h3 className="text-sm lg:text-lg font-medium text-gray-900 mb-2">
                            {document.file_name}
                        </h3>
                        <p className="text-xs lg:text-sm text-gray-600 mb-4">
                            Click the button below to view the document
                        </p>
                        <Button
                            onClick={handleViewDocument}
                            className="bg-[#222222] hover:bg-[#222222]/80 text-white cursor-pointer"
                            size="sm"
                        >
                            <Eye className="h-4 w-4 mr-2" />
                            View Document
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                    <div className="text-center">
                        <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                        <p>No document URL available</p>
                        <p className="text-sm">Document: {document.file_name}</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DocumentPreview;
