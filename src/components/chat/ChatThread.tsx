"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import { Settings, Users, ArrowLeft, MessageSquare } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { getDefaultAvatarSrc } from "@/lib/chatAvatars";
import {
  useMessages,
  useConversation,
  useSendMessage,
  useDeleteMessage,
  useForwardMessage,
  useMarkRead,
  useChatConnectionState,
} from "@/hooks/useChat";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { ChatInput } from "@/components/chat/ChatInput";
import type { ChatMessage } from "@/types/chat";

interface ChatThreadProps {
  conversationId: string;
  currentUserId: string;
  currentUserType: "staff" | "client";
  alternativeUserId?: string;
  onBack?: () => void;
  /** When true, back button is visible on all screen sizes (e.g. in a sheet with a list behind). Default: only on mobile. */
  alwaysShowBack?: boolean;
  onOpenGroupSettings?: () => void;
  onForwardMessage?: (message: ChatMessage, targetId: string) => void;
}

interface ForwardDialogState {
  open: boolean;
  message: ChatMessage | null;
}

export function ChatThread({
  conversationId,
  currentUserId,
  currentUserType,
  alternativeUserId,
  onBack,
  alwaysShowBack,
  onOpenGroupSettings,
}: ChatThreadProps) {
  const { data: conversationData } = useConversation(conversationId);
  const {
    data: messagesData,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useMessages(conversationId);
  const sendMessage = useSendMessage(conversationId, currentUserType, currentUserId);
  const deleteMessage = useDeleteMessage(conversationId);
  const forwardMessage = useForwardMessage();
  const markRead = useMarkRead();
  const connectionState = useChatConnectionState();

  const [forwardState, setForwardState] = useState<ForwardDialogState>({
    open: false,
    message: null,
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const topSentinelRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const isInitialLoad = useRef(true);

  const conversation = conversationData?.data;

  // Mark as read when conversation opens
  useEffect(() => {
    markRead.mutate({ conversationId });
  }, [conversationId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Flatten all pages into a single array (oldest first)
  const allMessages =
    messagesData?.pages.flatMap((page) => page.data).reverse() ?? [];
  // Pages are loaded newest-first (before cursor), so reverse the pages order
  const orderedMessages = messagesData
    ? [...messagesData.pages].reverse().flatMap((page) => [...page.data])
    : [];

  // Scroll to bottom on initial load and new messages
  useEffect(() => {
    if (isInitialLoad.current && orderedMessages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "instant" });
      isInitialLoad.current = false;
    } else if (!isInitialLoad.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [orderedMessages.length]);

  // Reset on conversation change
  useEffect(() => {
    isInitialLoad.current = true;
  }, [conversationId]);

  // IntersectionObserver for load-more on scroll up
  useEffect(() => {
    const sentinel = topSentinelRef.current;
    if (!sentinel || !hasNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleSend = useCallback(
    async (content: string, files: File[]) => {
      await sendMessage.mutateAsync({ data: { content }, files });
    },
    [sendMessage],
  );

  const handleDelete = useCallback(
    (messageId: string) => {
      deleteMessage.mutate(messageId);
    },
    [deleteMessage],
  );

  const handleForward = useCallback((message: ChatMessage) => {
    setForwardState({ open: true, message });
  }, []);

  const memberCount = conversation?.members?.length ?? 0;

  // DM fallback: in a DM, the single participant of currentUserType is "me" (backend returns participants; use for attribution).
  const sameTypeParticipants =
    conversation?.type === "dm" && conversation.participants
      ? conversation.participants.filter((p) => p.type === currentUserType)
      : [];
  const dmOwnId =
    sameTypeParticipants.length === 1 ? sameTypeParticipants[0].id : null;

  // Avatar for header (WhatsApp-style): DM = other participant; group = imageUrl or default
  const otherParticipant =
    conversation?.type === "dm" && conversation.participants
      ? conversation.participants.find(
          (p) => p.id !== (dmOwnId ?? currentUserId),
        )
      : null;
  const headerAvatarSrc =
    conversation?.type === "group"
      ? conversation.imageUrl ?? getDefaultAvatarSrc(conversation?._id ?? "")
      : getDefaultAvatarSrc(otherParticipant?.id ?? conversation?._id ?? "");

  // DM name: prefer otherDisplayName, then resolve from members by other participant's id/type
  const otherMember =
    conversation?.type === "dm" &&
    conversation.members &&
    otherParticipant
      ? conversation.members.find(
          (m) =>
            m.type === otherParticipant.type && m.id === otherParticipant.id,
        )
      : null;
  const conversationName =
    conversation?.type === "dm"
      ? conversation.otherDisplayName ??
        otherMember?.displayName ??
        "Chat"
      : conversation?.name ?? "Group Chat";

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex items-center gap-3 px-4 py-[14px] border-b border-border/40 shrink-0">
        {onBack && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onBack}
            className={cn("shrink-0", !alwaysShowBack && "md:hidden")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}

        <div className="relative h-9 w-9 rounded-full overflow-hidden shrink-0 bg-muted">
          <Image
            src={headerAvatarSrc}
            alt={conversationName}
            fill
            className="object-cover"
            unoptimized
          />
          {conversation?.type === "group" && (
            <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
              <Users className="h-4 w-4 text-primary" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-semibold capitalize text-foreground truncate">
            {conversationName}
          </h2>
          {conversation?.type === "group" && memberCount > 0 ? (
            <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
              <Users className="h-3 w-3 shrink-0" />
              {memberCount} members
            </p>
          ) : (
            <p className="text-xs text-muted-foreground flex items-center gap-1.5 truncate">
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full shrink-0",
                  connectionState.isConnected
                    ? "bg-green-500"
                    : connectionState.isConnecting
                      ? "bg-yellow-500 animate-pulse"
                      : "bg-red-500",
                )}
              />
              <span>
                {connectionState.isConnected
                  ? "Online"
                  : connectionState.isConnecting
                    ? "Connecting"
                    : "Offline"}
              </span>
            </p>
          )}
        </div>

        {/* Group settings button */}
        {conversation?.type === "group" && onOpenGroupSettings && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onOpenGroupSettings}
            className="shrink-0"
          >
            <Settings className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-4 space-y-1" ref={scrollAreaRef}>
          {/* Top sentinel for load-more */}
          <div ref={topSentinelRef} className="h-1" />

          {isFetchingNextPage && (
            <div className="flex justify-center py-2">
              <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            </div>
          )}

          {isLoading ? (
            <MessageSkeleton />
          ) : orderedMessages.length === 0 ? (
            <EmptyState />
          ) : (
            orderedMessages.map((message, index) => { 
              const currentUserMember = conversation?.members?.find(
                (m) =>
                  m.type === currentUserType &&
                  (m.id === currentUserId ||
                    (alternativeUserId != null && m.id === alternativeUserId)),
              );
              const currentMemberId = currentUserMember?.id ?? null;

              const isOwn =
                message.sender.type === currentUserType &&
                (message.sender.id === currentUserId ||
                  message.sender.id === alternativeUserId ||
                  (!!currentMemberId &&
                    message.sender.id === currentMemberId) ||
                  (!!dmOwnId && message.sender.id === dmOwnId));

              // Find sender display name
              const member = conversation?.members?.find(
                (m) =>
                  m.type === message.sender.type &&
                  m.id === message.sender.id,
              );
              const senderName = member?.displayName ?? "Unknown";

              // Show avatar/name for first message or when sender changes
              const prevMessage = index > 0 ? orderedMessages[index - 1] : null;
              const senderChanged =
                !prevMessage ||
                prevMessage.sender.id !== message.sender.id ||
                prevMessage.sender.type !== message.sender.type;

              return (
                <div key={message._id} className="py-0.5">
                  <MessageBubble
                    message={message}
                    isOwn={isOwn}
                    senderName={senderName}
                    senderId={message.sender.id}
                    showAvatar={senderChanged && !isOwn}
                    showSenderName={
                      senderChanged && !isOwn && conversation?.type === "group"
                    }
                    onDelete={isOwn ? handleDelete : undefined}
                    onForward={handleForward}
                  />
                </div>
              );
            })
          )}

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <ChatInput
        onSend={handleSend}
        isSending={sendMessage.isPending}
      />

      {/* Forward dialog — simple implementation */}
      {forwardState.open && forwardState.message && (
        <ForwardMessageOverlay
          message={forwardState.message}
          currentConversationId={conversationId}
          onForward={(targetId) => {
            forwardMessage.mutate({
              targetConversationId: targetId,
              forwardedFromMessageId: forwardState.message!._id,
            });
            setForwardState({ open: false, message: null });
          }}
          onClose={() => setForwardState({ open: false, message: null })}
        />
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-16">
      <MessageSquare className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
      <p className="text-sm text-muted-foreground">No messages yet</p>
      <p className="text-xs text-muted-foreground/60 mt-0.5">
        Start the conversation
      </p>
    </div>
  );
}

function MessageSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className={cn(
            "flex gap-2.5 animate-pulse",
            i % 2 === 0 ? "ml-auto flex-row-reverse max-w-[75%]" : "mr-auto max-w-[75%]",
          )}
        >
          {i % 2 !== 0 && (
            <div className="h-7 w-7 rounded-full bg-muted shrink-0 mt-5" />
          )}
          <div className="space-y-1.5 flex-1">
            {i % 2 !== 0 && <div className="h-3 bg-muted rounded w-20" />}
            <div
              className={cn(
                "rounded-2xl px-4 py-3",
                i % 2 === 0 ? "bg-muted/60" : "bg-muted",
              )}
            >
              <div className="h-3 bg-muted-foreground/10 rounded w-full mb-1.5" />
              <div className="h-3 bg-muted-foreground/10 rounded w-2/3" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Minimal forward overlay — shows a list of conversations to pick
function ForwardMessageOverlay({
  message,
  currentConversationId,
  onForward,
  onClose,
}: {
  message: ChatMessage;
  currentConversationId: string;
  onForward: (conversationId: string) => void;
  onClose: () => void;
}) {
  const { data } = useMessages(currentConversationId);
  void data; // unused here

  // Import conversations to pick from
  // We use a simple lazy import via dynamic to avoid circular
  return (
    <ForwardPicker
      message={message}
      currentConversationId={currentConversationId}
      onForward={onForward}
      onClose={onClose}
    />
  );
}

function ForwardPicker({
  currentConversationId,
  onForward,
  onClose,
}: {
  message: ChatMessage;
  currentConversationId: string;
  onForward: (id: string) => void;
  onClose: () => void;
}) {
  // Lazy import of hook to avoid circular dependency
  const { useConversations } = require("@/hooks/useChat");
  const { data } = useConversations();
  const conversations = (data?.data ?? []).filter(
    (c: { _id: string }) => c._id !== currentConversationId,
  );

  return (
    <div className="absolute inset-0 z-50 bg-background/90 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-background border border-border rounded-2xl shadow-xl w-full max-w-sm p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Forward to…</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            ✕
          </button>
        </div>
        <div className="space-y-1 max-h-64 overflow-y-auto">
          {conversations.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No other conversations
            </p>
          )}
          {conversations.map((c: { _id: string; otherDisplayName?: string; name?: string }) => (
            <button
              key={c._id}
              type="button"
              onClick={() => onForward(c._id)}
              className="w-full text-left px-3 py-2 rounded-lg hover:bg-muted text-sm transition-colors"
            >
              {c.otherDisplayName ?? c.name ?? "Chat"}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
