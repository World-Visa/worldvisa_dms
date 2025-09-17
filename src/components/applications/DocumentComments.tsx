import React from 'react'
import { Card } from '../ui/card'
import { ScrollArea } from '../ui/scroll-area'
import { 
    MessageCircle,
    Wifi,
    WifiOff,
    AlertCircle
} from 'lucide-react'
import { useDocumentComments, useRealtimeConnection } from '@/hooks/useDocumentComments'
import { useDeleteComment } from '@/hooks/useCommentMutations'
import CommentForm from './CommentForm'
import CommentItem from './CommentItem'

interface DocumentCommentsProps {
    documentId: string;
    className?: string;
    isClientView?: boolean;
}

const DocumentComments: React.FC<DocumentCommentsProps> = ({
    documentId,
    className = '',
    isClientView = false
}) => {
    const { comments, isLoading, error, refetch } = useDocumentComments(documentId);
    const connectionState = useRealtimeConnection();
    const deleteCommentMutation = useDeleteComment(documentId);

    // Filter comments for client view - hide "kavitha mam" comments
    const filteredComments = isClientView 
        ? comments.filter(comment => 
            !comment.added_by.toLowerCase().includes('kavitha')
          )
        : comments;

    const handleCommentAdded = () => {
        // Comment added successfully
    };

    const handleDeleteComment = async (commentId: string) => {
        try {
            await deleteCommentMutation.mutateAsync({ commentId });
        } catch (error) {
            console.error('Failed to delete comment:', error);
        }
    };

    return (
        <div className={`w-96 border-l bg-gradient-to-b from-gray-50 to-white flex flex-col h-full ${className}`}>
            {/* Header */}
            <div className="px-2 py-1 bg-white border-b">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                        <MessageCircle className="h-5 w-5 text-blue-600" />
                        <h3 className="text-lg font-semibold text-gray-900">Comments</h3>
                    </div>

                    {/* Connection Status */}
                    <div className="flex items-center space-x-1">
                        {connectionState.isConnected ? (
                            <div className="flex items-center space-x-1 text-green-600">
                                <Wifi className="h-3 w-3" />
                                <span className="text-xs">Live</span>
                            </div>
                        ) : connectionState.isConnecting ? (
                            <div className="flex items-center space-x-1 text-yellow-600">
                                <WifiOff className="h-3 w-3 animate-pulse" />
                                <span className="text-xs">Connecting...</span>
                            </div>
                        ) : (
                            <div className="flex items-center space-x-1 text-red-600">
                                <WifiOff className="h-3 w-3" />
                                <span className="text-xs">Offline</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Error Display */}
                {error && (
                    <div className="flex items-center space-x-2 text-red-600 text-sm bg-red-50 p-2 rounded">
                        <AlertCircle className="h-4 w-4" />
                        <span>Failed to load comments</span>
                        <button
                            onClick={() => refetch()}
                            className="text-blue-600 hover:underline"
                        >
                            Retry
                        </button>
                    </div>
                )}
            </div>

            {/* Comment Input */}
            <div className="p-4 border-b bg-white">
                <CommentForm
                    documentId={documentId}
                    onCommentAdded={handleCommentAdded}
                />
            </div>

            {/* Comments List */}
            <div className="flex-1 overflow-hidden">
                <ScrollArea className="h-full">
                    <div className="p-4 space-y-4">
                        {isLoading ? (
                            <div className="space-y-4">
                                {[1, 2, 3].map((i) => (
                                    <Card key={i} className="p-4 animate-pulse">
                                        <div className="flex items-start space-x-3">
                                            <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                                            <div className="flex-1 space-y-2">
                                                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                                                <div className="h-3 bg-gray-200 rounded w-1/6"></div>
                                                <div className="h-4 bg-gray-200 rounded w-full"></div>
                                                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        ) : filteredComments.length === 0 ? (
                            <div className="text-center py-8">
                                <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                                <p className="text-gray-500 text-sm">
                                    {isClientView && comments.length > 0 
                                        ? "No visible comments" 
                                        : "No comments yet"
                                    }
                                </p>
                                <p className="text-gray-400 text-xs">
                                    {isClientView && comments.length > 0
                                        ? "Comments from admin are not visible to clients"
                                        : "Be the first to add a comment"
                                    }
                                </p>
                            </div>
                        ) : (
                            filteredComments.map((comment) => (
                                <CommentItem
                                    key={comment._id}
                                    comment={comment}
                                    onDelete={handleDeleteComment}
                                    isDeleting={deleteCommentMutation.isPending}
                                />
                            ))
                        )}
                    </div>
                </ScrollArea>
            </div>
        </div>
    )
}

export default DocumentComments
