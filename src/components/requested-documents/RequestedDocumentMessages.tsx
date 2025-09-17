'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Send, 
  Trash2, 
  User, 
  Clock,
  MessageSquare
} from 'lucide-react';
import { 
  useRequestedDocumentMessages, 
  useSendRequestedDocumentMessage, 
  useDeleteRequestedDocumentMessage 
} from '@/hooks/useRequestedDocumentMessages';
import { useAuth } from '@/hooks/useAuth';
import { RequestedDocumentMessage } from '@/lib/api/requestedDocumentMessages';
import { cn } from '@/lib/utils';

interface RequestedDocumentMessagesProps {
  documentId: string;
  reviewId: string;
  type: 'requested-to-me' | 'my-requests';
}

export function RequestedDocumentMessages({
  documentId,
  reviewId,
  type
}: RequestedDocumentMessagesProps) {
  const { user } = useAuth();
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const {
    data: messagesData,
    isLoading: isLoadingMessages,
    error: messagesError
  } = useRequestedDocumentMessages(documentId, reviewId);

  const sendMessageMutation = useSendRequestedDocumentMessage();
  const deleteMessageMutation = useDeleteRequestedDocumentMessage();

  const messages = messagesData?.data || [];

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user?.username) {
      return;
    }

    try {
      await sendMessageMutation.mutateAsync({
        documentId,
        reviewId,
        data: { message: newMessage.trim() }
      });
      setNewMessage('');
    } catch {
      // Error is handled by the mutation
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      await deleteMessageMutation.mutateAsync({
        documentId,
        reviewId,
        data: { messageId }
      });
    } catch {
      // Error is handled by the mutation
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (isLoadingMessages) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 p-4">
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="flex space-x-3">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (messagesError) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 p-4 flex items-center justify-center">
          <div className="text-center">
            <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Failed to load messages</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages Header */}
      <div className="p-4 border-b bg-gray-50">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-gray-600" />
          <h3 className="font-medium text-gray-900">Messages</h3>
          {messages.length > 0 && (
            <span className="text-sm text-gray-500">({messages.length})</span>
          )}
        </div>
      </div>

      {/* Messages List */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No messages yet</p>
              <p className="text-sm text-gray-400 mt-1">
                Start a conversation about this document
              </p>
            </div>
          ) : (
            messages.map((message) => {
              const isCurrentUser = message.sent_by === user?.username;
              const canDelete = isCurrentUser; // Only allow deleting own messages
              
              return (
                <div
                  key={message._id}
                  className={cn(
                    'flex space-x-3',
                    isCurrentUser ? 'justify-end' : 'justify-start'
                  )}
                >
                  <div className={cn(
                    'flex space-x-3 max-w-[80%]',
                    isCurrentUser && 'flex-row-reverse space-x-reverse'
                  )}>
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      <div className={cn(
                        'h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium',
                        isCurrentUser 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-200 text-gray-700'
                      )}>
                        <User className="h-4 w-4" />
                      </div>
                    </div>

                    {/* Message Content */}
                    <div className={cn(
                      'flex flex-col space-y-1',
                      isCurrentUser ? 'items-end' : 'items-start'
                    )}>
                      {/* Message Bubble */}
                      <div className={cn(
                        'rounded-lg px-3 py-2 max-w-full',
                        isCurrentUser 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-100 text-gray-900'
                      )}>
                        <p className="text-sm whitespace-pre-wrap break-words">
                          {message.message}
                        </p>
                      </div>

                      {/* Message Meta */}
                      <div className={cn(
                        'flex items-center space-x-2 text-xs text-gray-500',
                        isCurrentUser ? 'flex-row-reverse space-x-reverse' : ''
                      )}>
                        <span className="font-medium">{message.sent_by}</span>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>
                            {new Date(message.sent_at).toLocaleDateString()} at{' '}
                            {new Date(message.sent_at).toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </span>
                        </div>
                        {canDelete && (
                          <button
                            onClick={() => handleDeleteMessage(message._id)}
                            disabled={deleteMessageMutation.isPending}
                            className="text-red-500 hover:text-red-700 disabled:opacity-50"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Message Input */}
      <div className="p-4 border-t bg-white">
        <div className="flex space-x-2">
          <Textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className="min-h-[60px] max-h-[120px] resize-none"
            disabled={sendMessageMutation.isPending}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || sendMessageMutation.isPending}
            size="sm"
            className="self-end"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
