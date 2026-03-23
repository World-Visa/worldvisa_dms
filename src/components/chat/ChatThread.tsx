"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import Image from "next/image";
import { Settings, Users, ArrowLeft, MessageSquare, LogOut } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getDefaultAvatarSrc } from "@/lib/chatAvatars";
import { GroupAvatar } from "@/components/chat/GroupAvatar";
import { useAuth } from "@/hooks/useAuth";
import {
  useMessages,
  useConversation,
  useSendMessage,
  useDeleteMessage,
  useForwardMessage,
  useMarkRead,
  useStaffUsers,
  useChatClients,
} from "@/hooks/useChat";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { ChatInput } from "@/components/chat/ChatInput";
import { DateSeparator, getDateLabel } from "@/components/chat/DateSeparator";
import { ForwardMessageOverlay } from "@/components/chat/ForwardPicker";
import type { ChatMessage, ParticipantType } from "@/types/chat";

// ── Types ──────────────────────────────────────────────────────────────────

interface ChatThreadProps {
  conversationId: string;
  currentUserId: string;
  currentUserType: "staff" | "client";
  alternativeUserId?: string;
  onBack?: () => void;
  /** When true, back button is visible on all screen sizes. Default: only on mobile. */
  alwaysShowBack?: boolean;
  /** Opens full group settings (e.g. for staff). */
  onOpenGroupSettings?: () => void;
  /** When set, shows only a "Leave group" header action (e.g. for client). */
  onLeaveGroup?: () => void;
  onForwardMessage?: (message: ChatMessage, targetId: string) => void;
  /** When set (e.g. inside a sheet), emoji picker portals here so scroll works. */
  emojiPopoverContainerRef?: React.RefObject<HTMLElement | null>;
}

interface ForwardDialogState {
  open: boolean;
  message: ChatMessage | null;
}

// ── ChatThread ─────────────────────────────────────────────────────────────

export function ChatThread({
  conversationId,
  currentUserId,
  currentUserType,
  alternativeUserId,
  onBack,
  alwaysShowBack,
  onOpenGroupSettings,
  onLeaveGroup,
  emojiPopoverContainerRef,
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

  const { user } = useAuth();
  const { data: staffData } = useStaffUsers();
  const { data: clientData } = useChatClients({
    permissionMode: user?.role === "admin" ? "restricted" : "unrestricted",
    currentUsername: user?.username ?? "",
  });

  const getProfileImageUrl = useCallback(
    (type: ParticipantType, id: string): string | undefined => {
      if (type === "staff") {
        return staffData?.data?.find((u) => u._id === id)?.profile_image_url;
      }
      if (type === "client") {
        return clientData?.data?.find((c) => c._id === id)?.profile_image_url;
      }
      return undefined;
    },
    [staffData?.data, clientData?.data],
  );

  const [forwardState, setForwardState] = useState<ForwardDialogState>({
    open: false,
    message: null,
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const topSentinelRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const isInitialLoad = useRef(true);

  const conversation = conversationData?.data;

  // Mark conversation as read on open
  useEffect(() => {
    markRead.mutate({ conversationId });
  }, [conversationId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Pages are loaded newest-first (before cursor), so reverse the pages order
  const orderedMessages = useMemo(
    () =>
      messagesData
        ? [...messagesData.pages].reverse().flatMap((page) => [...page.data])
        : [],
    [messagesData],
  );

  // Scroll to bottom on initial load and new messages
  useEffect(() => {
    if (isInitialLoad.current && orderedMessages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "instant" });
      isInitialLoad.current = false;
    } else if (!isInitialLoad.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [orderedMessages.length]);

  // Reset scroll state on conversation change
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

  // ── Derived conversation state ───────────────────────────────────────────

  const memberCount = conversation?.members?.length ?? 0;

  // DM fallback: single participant of currentUserType = "me"
  const sameTypeParticipants =
    conversation?.type === "dm" && conversation.participants
      ? conversation.participants.filter((p) => p.type === currentUserType)
      : [];
  const dmOwnId =
    sameTypeParticipants.length === 1 ? sameTypeParticipants[0].id : null;

  const otherParticipant =
    conversation?.type === "dm" && conversation.participants
      ? conversation.participants.find(
          (p) => p.id !== (dmOwnId ?? currentUserId),
        )
      : null;

  const headerAvatarSrc =
    conversation?.type === "dm"
      ? otherParticipant
        ? (getProfileImageUrl(otherParticipant.type, otherParticipant.id) ??
          otherParticipant.profile_image_url ??
          getDefaultAvatarSrc(otherParticipant.id ?? conversation?._id ?? ""))
        : getDefaultAvatarSrc(conversation?._id ?? conversationId)
      : conversation?.imageUrl;

  const groupMemberIds =
    conversation?.type === "group"
      ? (conversation.members?.map((m) => m.id) ??
        conversation.participants?.map((p) => p.id) ??
        [])
      : [];

  const otherMember =
    conversation?.type === "dm" && conversation.members && otherParticipant
      ? conversation.members.find(
          (m) =>
            m.type === otherParticipant.type && m.id === otherParticipant.id,
        )
      : null;

  const conversationName =
    conversation?.type === "dm"
      ? (conversation.otherDisplayName ?? otherMember?.displayName ?? "Chat")
      : (conversation?.name ?? "Group Chat");

  // Read receipt: other participant's lastReadAt (DM only)
  const otherLastReadAt = useMemo(() => {
    if (conversation?.type !== "dm" || !conversation.members) return null;
    const other = conversation.members.find(
      (m) =>
        !(
          m.type === currentUserType &&
          (m.id === currentUserId ||
            (alternativeUserId != null && m.id === alternativeUserId))
        ),
    );
    return other?.lastReadAt ?? null;
  }, [conversation, currentUserType, currentUserId, alternativeUserId]);

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
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

        {conversation?.type === "group" && !headerAvatarSrc ? (
          <GroupAvatar
            memberIds={groupMemberIds}
            fallbackId={conversation?._id}
            className="h-9 w-9"
            alt={conversationName}
            memberProfiles={Object.fromEntries(
              (conversation.members ?? [])
                .map((m) => {
                  const url =
                    getProfileImageUrl(m.type, m.id) ?? m.profile_image_url;
                  return url ? ([m.id, url] as const) : null;
                })
                .filter((x): x is [string, string] => x != null),
            )}
          />
        ) : (
          <div className="relative h-9 w-9 rounded-full overflow-hidden shrink-0 bg-muted">
            <Image
              src={
                headerAvatarSrc ??
                getDefaultAvatarSrc(conversation?._id ?? conversationId)
              }
              alt={conversationName}
              fill
              className="object-cover"
              unoptimized
            />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-semibold capitalize text-foreground truncate">
            {conversationName}
          </h2>
          {conversation?.type === "group" && memberCount > 0 ? (
            <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
              <Users className="h-3 w-3 shrink-0" />
              {memberCount} members
            </p>
          ) : conversation?.type === "dm" ? (
            (() => {
              const dmOther = conversation.members?.find(
                (m) =>
                  m.id !== currentUserId && m.id !== alternativeUserId,
              );
              const isOnline = dmOther?.online_status ?? false;
              return (
                <p className="text-xs text-muted-foreground flex items-center gap-1.5 truncate">
                  <span
                    className={cn(
                      "h-1.5 w-1.5 rounded-full shrink-0",
                      isOnline ? "bg-green-500" : "bg-muted-foreground/40",
                    )}
                  />
                  <span>{isOnline ? "Online" : "Offline"}</span>
                </p>
              );
            })()
          ) : null}
        </div>

        {conversation?.type === "group" && onLeaveGroup && (
          <Button
            variant="ghost"
            size="sm"
            title="Leave group"
            onClick={onLeaveGroup}
            className="shrink-0 gap-1.5 text-muted-foreground hover:text-destructive"
          >
            <LogOut className="h-3.5 w-3.5" />
          </Button>
        )}
        {conversation?.type === "group" && !onLeaveGroup && onOpenGroupSettings && (
          <Button
            variant="ghost"
            size="icon-sm"
            title="Group settings"
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
              // Resolve currentMemberId for isOwn detection
              const currentUserMember = conversation?.members?.find(
                (m) =>
                  m.type === currentUserType &&
                  (m.id === currentUserId ||
                    (alternativeUserId != null && m.id === alternativeUserId)),
              );
              let currentMemberId = currentUserMember?.id ?? null;
              if (
                currentMemberId == null &&
                conversation?.type === "group" &&
                conversation.members
              ) {
                const sameType = conversation.members.filter(
                  (m) => m.type === currentUserType,
                );
                if (sameType.length === 1) currentMemberId = sameType[0].id;
              }

              const isOwn =
                message.sender.type === currentUserType &&
                (message.sender.id === currentUserId ||
                  message.sender.id === alternativeUserId ||
                  (!!currentMemberId &&
                    message.sender.id === currentMemberId) ||
                  (!!dmOwnId && message.sender.id === dmOwnId));

              const member = conversation?.members?.find(
                (m) =>
                  m.type === message.sender.type &&
                  m.id === message.sender.id,
              );
              const senderName = member?.displayName ?? "Unknown";

              const prevMessage = index > 0 ? orderedMessages[index - 1] : null;
              const senderChanged =
                !prevMessage ||
                prevMessage.sender.id !== message.sender.id ||
                prevMessage.sender.type !== message.sender.type;

              // Date separator
              const messageDate = new Date(message.createdAt);
              const prevMessageDate = prevMessage
                ? new Date(prevMessage.createdAt)
                : null;
              const isNewDay =
                !prevMessageDate ||
                messageDate.getFullYear() !== prevMessageDate.getFullYear() ||
                messageDate.getMonth() !== prevMessageDate.getMonth() ||
                messageDate.getDate() !== prevMessageDate.getDate();

              return (
                <div key={message._id}>
                  {isNewDay && (
                    <DateSeparator label={getDateLabel(messageDate)} />
                  )}
                  <div className="py-0.5">
                    <MessageBubble
                      message={message}
                      isOwn={isOwn}
                      senderName={senderName}
                      senderId={message.sender.id}
                      senderProfileImage={member?.profile_image_url}
                      showAvatar={senderChanged && !isOwn}
                      showSenderName={
                        senderChanged &&
                        !isOwn &&
                        conversation?.type === "group"
                      }
                      otherLastReadAt={otherLastReadAt}
                      onDelete={isOwn ? handleDelete : undefined}
                      onForward={handleForward}
                    />
                  </div>
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
        emojiPopoverContainerRef={emojiPopoverContainerRef}
      />

      {/* Forward dialog */}
      {forwardState.open && forwardState.message && (
        <ForwardMessageOverlay
          message={forwardState.message}
          currentConversationId={conversationId}
          currentUserId={currentUserId}
          currentUserType={currentUserType}
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

// ── Local helpers ──────────────────────────────────────────────────────────

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
            i % 2 === 0
              ? "ml-auto flex-row-reverse max-w-[75%]"
              : "mr-auto max-w-[75%]",
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
