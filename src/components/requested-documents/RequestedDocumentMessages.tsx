"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Trash2, MessageSquare, Loader2 } from "lucide-react";
import {
  useRequestedDocumentMessages,
  useSendRequestedDocumentMessage,
  useDeleteRequestedDocumentMessage,
  useRequestedDocumentMessagesRealtime,
  useRealtimeConnection,
} from "@/hooks/useRequestedDocumentMessages";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface RequestedDocumentMessagesProps {
  documentId: string;
  reviewId: string;
}

export function RequestedDocumentMessages({
  documentId,
  reviewId,
}: RequestedDocumentMessagesProps) {
  const { user } = useAuth();
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const canAccessMessages =
    user?.role &&
    ["admin", "team_leader", "master_admin", "supervisor"].includes(user.role);

  const {
    data: messagesData,
    isLoading: isLoadingMessages,
    error: messagesError,
  } = useRequestedDocumentMessages(documentId, reviewId);

  const sendMessageMutation = useSendRequestedDocumentMessage();
  const deleteMessageMutation = useDeleteRequestedDocumentMessage();

  useRequestedDocumentMessagesRealtime(documentId, reviewId);
  const connectionState = useRealtimeConnection();

  const messages = useMemo(
    () => messagesData?.data || [],
    [messagesData?.data],
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!canAccessMessages) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <p className="text-sm text-muted-foreground">Unauthorized access</p>
      </div>
    );
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user?.username) return;

    try {
      await sendMessageMutation.mutateAsync({
        documentId,
        reviewId,
        data: { message: newMessage.trim() },
      });
      setNewMessage("");
    } catch {
      // Error is handled by the mutation
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      await deleteMessageMutation.mutateAsync({
        documentId,
        reviewId,
        data: { messageId },
      });
    } catch {
      // Error is handled by the mutation
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header - fixed */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/40 shrink-0">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-foreground">Messages</h3>
          {messages.length > 0 && (
            <span className="text-xs text-muted-foreground tabular-nums">
              ({messages.length})
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <div
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              connectionState.isConnected
                ? "bg-green-500"
                : connectionState.isConnecting
                  ? "bg-yellow-500 animate-pulse"
                  : "bg-red-500",
            )}
          />
          <span className="text-[11px] text-muted-foreground">
            {connectionState.isConnected
              ? "Live"
              : connectionState.isConnecting
                ? "Connecting"
                : "Offline"}
          </span>
        </div>
      </div>

      {/* Messages list - scrollable container only */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="p-4 space-y-3">
          {isLoadingMessages ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={cn(
                    "flex gap-2.5 animate-pulse",
                    i === 2
                      ? "ml-auto flex-row-reverse max-w-[75%]"
                      : "mr-auto max-w-[75%]",
                  )}
                >
                  {i !== 2 && (
                    <div className="h-7 w-7 rounded-full bg-muted shrink-0" />
                  )}
                  <div className="space-y-1.5 flex-1">
                    {i !== 2 && (
                      <div className="h-3 bg-muted rounded w-20" />
                    )}
                    <div
                      className={cn(
                        "rounded-2xl px-4 py-3",
                        i === 2
                          ? "bg-muted/60 rounded-br-sm"
                          : "bg-muted rounded-bl-sm",
                      )}
                    >
                      <div className="h-3 bg-muted-foreground/10 rounded w-full mb-1.5" />
                      <div className="h-3 bg-muted-foreground/10 rounded w-2/3" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : messagesError ? (
            <div className="text-center py-12">
              <MessageSquare className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                Failed to load messages
              </p>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No messages yet</p>
              <p className="text-xs text-muted-foreground/60 mt-0.5">
                Start the conversation
              </p>
            </div>
          ) : (
            messages.map((message) => {
              const isCurrentUser = message.username === user?.username;
              const canDelete = isCurrentUser;

              const timeAgo = (() => {
                try {
                  return formatDistanceToNow(new Date(message.added_at), {
                    addSuffix: true,
                  });
                } catch {
                  return "";
                }
              })();

              return (
                <div
                  key={message._id}
                  className={cn(
                    "group flex gap-2.5",
                    isCurrentUser
                      ? "ml-auto flex-row-reverse max-w-[85%]"
                      : "mr-auto max-w-[85%]",
                  )}
                >
                  {/* Avatar for others */}
                  {!isCurrentUser && (
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted mt-5">
                      <span className="text-[11px] font-medium uppercase text-muted-foreground">
                        {(message.username ?? "?").charAt(0)}
                      </span>
                    </div>
                  )}

                  <div className="space-y-1 min-w-0">
                    {/* Name + time above bubble (others only) */}
                    {!isCurrentUser && (
                      <div className="flex items-center gap-2 px-1">
                        <span className="text-xs font-medium text-foreground capitalize">
                          {message.username}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          {timeAgo}
                        </span>
                      </div>
                    )}

                    {/* Message bubble */}
                    <div className="relative flex items-start gap-1">
                      <div
                        className={cn(
                          "relative rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                          isCurrentUser
                            ? "bg-foreground text-background rounded-br-sm"
                            : "bg-muted text-foreground rounded-bl-sm",
                        )}
                      >
                        <p className="whitespace-pre-wrap wrap-break-word">
                          {message.message}
                        </p>

                        {isCurrentUser && (
                          <p className="text-[10px] mt-1.5 text-background/50">
                            {timeAgo}
                          </p>
                        )}
                      </div>

                      {/* Delete on hover */}
                      {canDelete && (
                        <div
                          className={cn(
                            "shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150",
                            isCurrentUser ? "order-first" : "",
                          )}
                        >
                          <button
                            type="button"
                            onClick={() => handleDeleteMessage(message._id)}
                            disabled={deleteMessageMutation.isPending}
                            className="h-6 w-6 flex items-center justify-center rounded hover:bg-muted text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Footer - fixed */}
      <div className="p-3 border-t border-border/40 bg-background shrink-0">
        <div className="flex items-end gap-2">
          <Textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Write a message..."
            className="min-h-[40px] max-h-[120px] resize-none rounded-xl border-border/60 bg-muted/50 text-sm placeholder:text-muted-foreground/60 focus-visible:ring-1 focus-visible:ring-ring/30"
            rows={1}
            disabled={sendMessageMutation.isPending}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || sendMessageMutation.isPending}
            size="icon"
            className="h-9 w-9 shrink-0 rounded-xl bg-foreground text-background hover:bg-foreground/90 cursor-pointer"
          >
            {sendMessageMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
