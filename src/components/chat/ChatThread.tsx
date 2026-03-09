"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import { Settings, Users, ArrowLeft, MessageSquare, LogOut, Search, XIcon } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import type { ChatMessage, Conversation, ParticipantType } from "@/types/chat";

interface ChatThreadProps {
  conversationId: string;
  currentUserId: string;
  currentUserType: "staff" | "client";
  alternativeUserId?: string;
  onBack?: () => void;
  /** When true, back button is visible on all screen sizes (e.g. in a sheet with a list behind). Default: only on mobile. */
  alwaysShowBack?: boolean;
  /** Opens full group settings (e.g. for staff). */
  onOpenGroupSettings?: () => void;
  /** When set, shows only a "Leave group" header action instead of settings (e.g. for client). */
  onLeaveGroup?: () => void;
  onForwardMessage?: (message: ChatMessage, targetId: string) => void;
  /** When set (e.g. inside a sheet), emoji picker portals here so scroll works. */
  emojiPopoverContainerRef?: React.RefObject<HTMLElement | null>;
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

  // Avatar for header: DM = other participant; group = imageUrl or combined member avatars
  const otherParticipant =
    conversation?.type === "dm" && conversation.participants
      ? conversation.participants.find(
          (p) => p.id !== (dmOwnId ?? currentUserId),
        )
      : null;
  const headerAvatarSrc =
    conversation?.type === "dm"
      ? (otherParticipant
          ? (getProfileImageUrl(otherParticipant.type, otherParticipant.id) ??
             otherParticipant.profile_image_url ??
             getDefaultAvatarSrc(otherParticipant.id ?? conversation?._id ?? ""))
          : getDefaultAvatarSrc(conversation?._id ?? conversationId))
      : conversation?.imageUrl;
  const groupMemberIds =
    conversation?.type === "group"
      ? conversation.members?.map((m) => m.id) ??
        conversation.participants?.map((p) => p.id) ??
        []
      : [];

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

        {conversation?.type === "group" && !headerAvatarSrc ? (
          <GroupAvatar
            memberIds={groupMemberIds}
            fallbackId={conversation?._id}
            className="h-9 w-9"
            alt={conversationName}
            memberProfiles={Object.fromEntries(
              (conversation.members ?? [])
                .map((m) => {
                  const url = getProfileImageUrl(m.type, m.id) ?? m.profile_image_url;
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
          ) : conversation?.type === "dm" ? (() => {
            const otherMember = conversation.members?.find(
              (m) => m.id !== currentUserId && m.id !== alternativeUserId,
            );
            const isOnline = otherMember?.online_status ?? false;
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
          })() : null}
        </div>

        {/* Group: leave-only (e.g. client) or full settings (e.g. staff) */}
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
              let currentMemberId = currentUserMember?.id ?? null;
              // In groups, backend may store client with a different id (e.g. lead_id) than auth user._id.
              // If there's exactly one member of currentUserType, treat that member as "me" for isOwn.
              if (
                currentMemberId == null &&
                conversation?.type === "group" &&
                conversation.members
              ) {
                const sameType = conversation.members.filter(
                  (m) => m.type === currentUserType,
                );
                if (sameType.length === 1) {
                  currentMemberId = sameType[0].id;
                }
              }

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
                    senderProfileImage={member?.profile_image_url}
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
        emojiPopoverContainerRef={emojiPopoverContainerRef}
      />

      {/* Forward dialog — Recent + Contacts with avatars */}
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

// Forward overlay — Recent (chats with avatars) + Contacts (staff/clients, create DM if needed)
function ForwardMessageOverlay({
  message,
  currentConversationId,
  currentUserId,
  currentUserType,
  onForward,
  onClose,
}: {
  message: ChatMessage;
  currentConversationId: string;
  currentUserId: string;
  currentUserType: "staff" | "client";
  onForward: (conversationId: string) => void;
  onClose: () => void;
}) {
  return (
    <ForwardPicker
      forwardedFromMessageId={message._id}
      currentConversationId={currentConversationId}
      currentUserId={currentUserId}
      currentUserType={currentUserType}
      onForward={onForward}
      onClose={onClose}
    />
  );
}

interface ContactOption {
  id: string;
  type: ParticipantType;
  displayName: string;
  role?: string;
  profile_image_url?: string;
}

function ForwardPicker({
  forwardedFromMessageId,
  currentConversationId,
  currentUserId,
  currentUserType,
  onForward,
  onClose,
}: {
  forwardedFromMessageId: string;
  currentConversationId: string;
  currentUserId: string;
  currentUserType: "staff" | "client";
  onForward: (conversationId: string) => void;
  onClose: () => void;
}) {
  const { useConversations, useStaffUsers, useChatClients, useCreateConversation } =
    require("@/hooks/useChat") as typeof import("@/hooks/useChat");
  const { useAuth } = require("@/hooks/useAuth") as { useAuth: () => { user?: { role?: string; username?: string } } };

  const { user } = useAuth();
  const { data: conversationsData } = useConversations();
  const { data: staffData, isLoading: staffLoading } = useStaffUsers();
  const createConversation = useCreateConversation();

  const permissionMode =
    user?.role === "admin" ? ("restricted" as const) : ("unrestricted" as const);
  const currentUsername = user?.username ?? "";
  const {
    data: clientData,
    isLoading: clientLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useChatClients({
    permissionMode,
    currentUsername,
  });

  const conversations = (conversationsData?.data ?? []) as Conversation[];
  const recentConversations = conversations
    .filter((c) => c._id !== currentConversationId)
    .sort((a, b) => {
      const aAt = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
      const bAt = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
      return bAt - aAt;
    });

  // Map (type, id) -> conversationId for existing DMs
  const dmByParticipant = new Map<string, string>();
  for (const c of conversations) {
    if (c.type === "dm" && c.participants?.length) {
      const other = c.participants.find((p) => p.id !== currentUserId);
      if (other) dmByParticipant.set(`${other.type}:${other.id}`, c._id);
    }
  }

  const staffOptions: ContactOption[] = (staffData?.data ?? []).map(
    (u: { _id: string; username: string; role?: string; profile_image_url?: string }) => ({
      id: u._id,
      type: "staff" as const,
      displayName: u.username,
      role: u.role,
      profile_image_url: u.profile_image_url,
    }),
  ).filter((u) => currentUserType !== "staff" || u.id !== currentUserId);

  const clientOptions: ContactOption[] =
    currentUserType === "staff"
      ? (clientData?.data ?? []).map((c: { _id: string; name: string; profile_image_url?: string }) => ({
          id: c._id,
          type: "client" as const,
          displayName: c.name,
          profile_image_url: c.profile_image_url,
        }))
      : [];

  const [activeTab, setActiveTab] = useState<"recent" | "contacts">("recent");
  const [contactSearch, setContactSearch] = useState("");

  const searchLower = contactSearch.trim().toLowerCase();
  const filteredStaffOptions = searchLower
    ? staffOptions.filter((u) =>
        u.displayName.toLowerCase().includes(searchLower),
      )
    : staffOptions;
  const filteredClientOptions = searchLower
    ? clientOptions.filter((c) =>
        c.displayName.toLowerCase().includes(searchLower),
      )
    : clientOptions;

  const isLoadingContacts =
    currentUserType === "staff" ? staffLoading || clientLoading : staffLoading;
  const hasContacts =
    staffOptions.length > 0 || clientOptions.length > 0;
  const hasFilteredContacts =
    filteredStaffOptions.length > 0 || filteredClientOptions.length > 0;

  const handleContactSelect = async (contact: ContactOption) => {
    const key = `${contact.type}:${contact.id}`;
    const existingId = dmByParticipant.get(key);
    if (existingId) {
      onForward(existingId);
      return;
    }
    try {
      const res = await createConversation.mutateAsync({
        type: "dm",
        participant: { type: contact.type, id: contact.id },
      });
      if (res?.data?._id) onForward(res.data._id);
    } catch {
      // toast already in useCreateConversation
    }
  };

  const recentList = (
    <div className="overflow-y-auto flex-1 min-h-0 px-2 space-y-0.5">
      {recentConversations.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">
          No other conversations
        </p>
      ) : (
        recentConversations.map((c) => (
          <RecentConversationRow
            key={c._id}
            conversation={c}
            currentUserId={currentUserId}
            onSelect={() => onForward(c._id)}
          />
        ))
      )}
    </div>
  );

  const contactsList = (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="px-2 pb-2 shrink-0">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search contacts…"
            value={contactSearch}
            onChange={(e) => setContactSearch(e.target.value)}
            className="pl-8 h-9"
          />
        </div>
      </div>
      <div className="overflow-y-auto flex-1 min-h-0 px-2 space-y-1">
        {isLoadingContacts ? (
          <ForwardContactsSkeleton />
        ) : !hasContacts ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            No contacts
          </p>
        ) : !hasFilteredContacts ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            No matches for &quot;{contactSearch.trim()}&quot;
          </p>
        ) : (
          <>
            {filteredStaffOptions.length > 0 && (
              <>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 py-1">
                  Staff ({filteredStaffOptions.length})
                </p>
                {filteredStaffOptions.map((u) => (
                  <ContactRow
                    key={`staff-${u.id}`}
                    contact={u}
                    onSelect={() => handleContactSelect(u)}
                    disabled={createConversation.isPending}
                  />
                ))}
              </>
            )}
            {currentUserType === "staff" && filteredClientOptions.length > 0 && (
              <>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 py-1 mt-2">
                  Clients ({filteredClientOptions.length})
                </p>
                {filteredClientOptions.map((u) => (
                  <ContactRow
                    key={`client-${u.id}`}
                    contact={u}
                    onSelect={() => handleContactSelect(u)}
                    disabled={createConversation.isPending}
                  />
                ))}
                {hasNextPage && (
                  <ClientListSentinel
                    hasNextPage={hasNextPage}
                    isFetchingNextPage={isFetchingNextPage}
                    fetchNextPage={fetchNextPage}
                  />
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className="absolute inset-0 z-50 bg-background/90 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-background border border-border rounded-2xl shadow-xl w-full max-w-md flex flex-col max-h-[65vh] min-h-0">
        <div className="flex items-center justify-between p-4 shrink-0">
          <h3 className="text-sm font-semibold">Forward to…</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-muted"
            aria-label="Close"
          >
            <XIcon className="size-4" />
          </button>
        </div>
        {currentUserType === "client" ? (
          <div className="flex flex-col flex-1 min-h-0 mt-0">
            {recentList}
          </div>
        ) : (
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as "recent" | "contacts")}
            className="flex flex-col flex-1 min-h-0 max-w-[420px]"
          >
            <TabsList className="w-full grid grid-cols-2 mx-4 shrink-0">
              <TabsTrigger value="recent">Recent</TabsTrigger>
              <TabsTrigger value="contacts">Contacts</TabsTrigger>
            </TabsList>
            <div className="flex flex-col flex-1 min-h-0 mt-2">
              {activeTab === "recent" ? recentList : contactsList}
            </div>
          </Tabs>
        )}
      </div>
    </div>
  );
}

function RecentConversationRow({
  conversation,
  currentUserId,
  onSelect,
}: {
  conversation: Conversation;
  currentUserId: string;
  onSelect: () => void;
}) {
  const isDm = conversation.type === "dm";
  const displayName = isDm
    ? (conversation.otherDisplayName ?? "Chat")
    : (conversation.name ?? "Group Chat");
  const otherParticipant = isDm
    ? conversation.participants?.find((p) => p.id !== currentUserId)
    : null;
  const avatarSrc = isDm
    ? (otherParticipant?.profile_image_url ?? getDefaultAvatarSrc(otherParticipant?.id ?? conversation._id))
    : conversation.imageUrl;

  return (
    <button
      type="button"
      onClick={onSelect}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left hover:bg-muted/60 transition-colors"
    >
      {isDm || avatarSrc ? (
        <div className="relative h-9 w-9 rounded-full overflow-hidden shrink-0">
          <Image
            src={avatarSrc!}
            alt={displayName}
            fill
            className="object-cover"
            unoptimized
          />
        </div>
      ) : (
        <GroupAvatar
          memberIds={conversation.participants?.map((p) => p.id) ?? []}
          fallbackId={conversation._id}
          className="h-9 w-9"
          alt={displayName}
          memberProfiles={Object.fromEntries(
            (conversation.participants ?? [])
              .filter((p) => p.profile_image_url)
              .map((p) => [p.id, p.profile_image_url as string]),
          )}
        />
      )}
      <span className="text-sm font-medium truncate flex-1">{displayName}</span>
    </button>
  );
}

function ContactRow({
  contact,
  onSelect,
  disabled,
}: {
  contact: ContactOption;
  onSelect: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left hover:bg-muted/60 transition-colors disabled:opacity-50"
    >
      <div className="relative h-9 w-9 rounded-full overflow-hidden shrink-0">
        <Image
          src={contact.profile_image_url ?? getDefaultAvatarSrc(contact.id)}
          alt={contact.displayName}
          fill
          className="object-cover"
          unoptimized
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{contact.displayName}</p>
        {contact.role && (
          <p className="text-xs text-muted-foreground capitalize">
            {contact.role.replace("_", " ")}
          </p>
        )}
      </div>
    </button>
  );
}

function ClientListSentinel({
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
}: {
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
}) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasNextPage) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage)
          fetchNextPage();
      },
      { threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);
  return <div ref={sentinelRef} className="h-4" />;
}

function ForwardContactsSkeleton() {
  return (
    <div className="space-y-1 p-1">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="flex items-center gap-3 px-3 py-2.5 animate-pulse"
        >
          <Skeleton className="h-9 w-9 rounded-full shrink-0" />
          <div className="space-y-1.5 flex-1">
            <Skeleton className="h-3 w-24 rounded" />
            <Skeleton className="h-2.5 w-16 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
