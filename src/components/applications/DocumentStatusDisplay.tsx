import React from 'react'
import { Document } from '@/types/applications'
import { Badge } from '../ui/badge'
import { CheckCircle, XCircle, Eye, Clock, AlertCircle } from 'lucide-react'

interface DocumentStatusDisplayProps {
    document: Document;
}

const DocumentStatusDisplay: React.FC<DocumentStatusDisplayProps> = ({ document }) => {
    const getStatusConfig = (status: Document['status']) => {
        switch (status) {
            case 'approved':
                return {
                    icon: <CheckCircle className="h-4 w-4" />,
                    label: 'Approved',
                    variant: 'default' as const,
                    className: 'bg-green-100 text-green-800 border-green-200'
                };
            case 'rejected':
                return {
                    icon: <XCircle className="h-4 w-4" />,
                    label: 'Rejected',
                    variant: 'destructive' as const,
                    className: 'bg-red-100 text-red-800 border-red-200'
                };
            case 'reviewed':
                return {
                    icon: <Eye className="h-4 w-4" />,
                    label: 'Reviewed',
                    variant: 'secondary' as const,
                    className: 'bg-blue-100 text-blue-800 border-blue-200'
                };
            case 'request_review':
                return {
                    icon: <AlertCircle className="h-4 w-4" />,
                    label: 'Review Requested',
                    variant: 'outline' as const,
                    className: 'bg-yellow-100 text-yellow-800 border-yellow-200'
                };
            case 'pending':
            default:
                return {
                    icon: <Clock className="h-4 w-4" />,
                    label: 'Pending',
                    variant: 'secondary' as const,
                    className: 'bg-gray-100 text-gray-800 border-gray-200'
                };
        }
    };

    const statusConfig = getStatusConfig(document.status);
    const lastStatusChange = document.history[document.history.length - 1];

    return (
        <div className="bg-white rounded-lg border p-4 mt-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <span className="text-sm font-medium text-gray-700">Status:</span>
                    <Badge 
                        variant={statusConfig.variant}
                        className={`flex items-center space-x-1 ${statusConfig.className}`}
                    >
                        {statusConfig.icon}
                        <span>{statusConfig.label}</span>
                    </Badge>
                </div>
                
                {lastStatusChange && (
                    <div className="text-right">
                        <div className="text-xs text-gray-500">
                            Last updated by <span className="font-medium">{lastStatusChange.changed_by}</span>
                        </div>
                        <div className="text-xs text-gray-400">
                            {new Date(lastStatusChange.changed_at).toLocaleDateString()} at{' '}
                            {new Date(lastStatusChange.changed_at).toLocaleTimeString()}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DocumentStatusDisplay;
