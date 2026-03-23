"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Search, XIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { getDefaultAvatarSrc } from "@/lib/chatAvatars";
import { GroupAvatar } from "@/components/chat/GroupAvatar";
import { useAuth } from "@/hooks/useAuth";
import {
  useConversations,
  useStaffUsers,
  useChatClients,
  useCreateConversation,
} from "@/hooks/useChat";
import type { ChatMessage, Conversation, ParticipantType } from "@/types/chat";

// ── Types ──────────────────────────────────────────────────────────────────

interface ContactOption {
  id: string;
  type: ParticipantType;
  displayName: string;
  role?: string;
  profile_image_url?: string;
}

// ── ForwardMessageOverlay ──────────────────────────────────────────────────

interface ForwardMessageOverlayProps {
  message: ChatMessage;
  currentConversationId: string;
  currentUserId: string;
  currentUserType: "staff" | "client";
  onForward: (conversationId: string) => void;
  onClose: () => void;
}

export function ForwardMessageOverlay({
  message,
  currentConversationId,
  currentUserId,
  currentUserType,
  onForward,
  onClose,
}: ForwardMessageOverlayProps) {
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

// ── ForwardPicker ──────────────────────────────────────────────────────────

interface ForwardPickerProps {
  forwardedFromMessageId: string;
  currentConversationId: string;
  currentUserId: string;
  currentUserType: "staff" | "client";
  onForward: (conversationId: string) => void;
  onClose: () => void;
}

function ForwardPicker({
  currentConversationId,
  currentUserId,
  currentUserType,
  onForward,
  onClose,
}: ForwardPickerProps) {
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
  } = useChatClients({ permissionMode, currentUsername });

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

  const staffOptions: ContactOption[] = (staffData?.data ?? [])
    .map((u) => ({
      id: u._id,
      type: "staff" as const,
      displayName: u.username,
      role: u.role,
      profile_image_url: u.profile_image_url,
    }))
    .filter((u) => currentUserType !== "staff" || u.id !== currentUserId);

  const clientOptions: ContactOption[] =
    currentUserType === "staff"
      ? (clientData?.data ?? []).map((c) => ({
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
    ? staffOptions.filter((u) => u.displayName.toLowerCase().includes(searchLower))
    : staffOptions;
  const filteredClientOptions = searchLower
    ? clientOptions.filter((c) => c.displayName.toLowerCase().includes(searchLower))
    : clientOptions;

  const isLoadingContacts =
    currentUserType === "staff" ? staffLoading || clientLoading : staffLoading;
  const hasContacts = staffOptions.length > 0 || clientOptions.length > 0;
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
      // toast handled inside useCreateConversation
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
          <p className="text-sm text-muted-foreground text-center py-6">No contacts</p>
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
          <div className="flex flex-col flex-1 min-h-0 mt-0">{recentList}</div>
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

// ── Sub-components ─────────────────────────────────────────────────────────

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
    ? (otherParticipant?.profile_image_url ??
      getDefaultAvatarSrc(otherParticipant?.id ?? conversation._id))
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
        <div key={i} className="flex items-center gap-3 px-3 py-2.5 animate-pulse">
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
