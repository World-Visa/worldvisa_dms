"use client";

import { useState } from "react";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { Search, MessageSquare, MoreVertical, Archive, Inbox, Trash2 } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmationModal } from "@/components/ui/confirmation-modal";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { getDefaultAvatarSrc } from "@/lib/chatAvatars";
import { GroupAvatar } from "@/components/chat/GroupAvatar";
import { useAuth } from "@/hooks/useAuth";
import {
  useConversations,
  useArchiveConversation,
  useDeleteConversation,
  useStaffUsers,
  useChatClients,
} from "@/hooks/useChat";
import type { Conversation, ConversationType, ParticipantType } from "@/types/chat";

type TabType = "all" | "dm" | "group";

interface ConversationListProps {
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  currentUserId: string;
  showArchiveAndDelete?: boolean;
}

export function ConversationRow({
  conversation,
  isSelected,
  currentUserId,
  onSelect,
  getProfileImageUrl,
}: {
  conversation: Conversation;
  isSelected: boolean;
  currentUserId: string;
  onSelect: (id: string) => void;
  getProfileImageUrl?: (type: ParticipantType, id: string) => string | undefined;
}) {
  const isDm = conversation.type === "dm";
  const displayName = isDm
    ? (conversation.otherDisplayName ?? "Chat")
    : (conversation.name ?? "Group Chat");

  // For avatar: DM = other participant; group = imageUrl or combined member avatars
  const otherParticipant = isDm
    ? conversation.participants?.find((p) => p.id !== currentUserId)
    : null;
  const avatarSrc = isDm
    ? (otherParticipant
        ? (getProfileImageUrl?.(otherParticipant.type, otherParticipant.id) ??
           otherParticipant.profile_image_url ??
           getDefaultAvatarSrc(otherParticipant.id ?? conversation._id))
        : getDefaultAvatarSrc(conversation._id))
    : conversation.imageUrl;
  const safeAvatarSrc = avatarSrc?.trim() ? avatarSrc : undefined;

  // Enrich group member profiles from lookup when available
  const memberProfiles =
    !isDm && conversation.participants?.length && getProfileImageUrl
      ? Object.fromEntries(
          (conversation.participants ?? [])
            .map((p) => {
              const url = getProfileImageUrl(p.type, p.id) ?? p.profile_image_url;
              return url ? ([p.id, url] as const) : null;
            })
            .filter((x): x is [string, string] => x != null),
        )
      : Object.fromEntries(
          (conversation.participants ?? [])
            .filter((p) => p.profile_image_url)
            .map((p) => [p.id, p.profile_image_url as string]),
        );

  const lastMsg = conversation.lastMessage;
  const lastText = lastMsg?.content
    ? lastMsg.content.slice(0, 60) + (lastMsg.content.length > 60 ? "…" : "")
    : lastMsg
      ? "Attachment"
      : "No messages yet";

  const timeLabel = conversation.lastMessageAt
    ? (() => {
        try {
          return formatDistanceToNow(new Date(conversation.lastMessageAt), {
            addSuffix: false,
          });
        } catch {
          return "";
        }
      })()
    : "";

  return (
    <button
      type="button"
      onClick={() => onSelect(conversation._id)}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-colors text-left",
        isSelected
          ? "bg-primary/10 text-primary"
          : "hover:bg-muted/60 text-foreground",
      )}
    >
      {/* Avatar */}
      {isDm || safeAvatarSrc ? (
        <div className="relative h-10 w-10 rounded-full overflow-hidden shrink-0">
          {safeAvatarSrc ? (
            <Image
              src={safeAvatarSrc}
              alt={displayName}
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="h-full w-full bg-muted" aria-hidden="true" />
          )}
        </div>
      ) : (
        <GroupAvatar
          memberIds={conversation.participants?.map((p) => p.id) ?? []}
          fallbackId={conversation._id}
          className="h-10 w-10"
          alt={displayName}
          memberProfiles={memberProfiles}
        />
      )}

      {/* Text content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium truncate">{displayName}</span>
          <span className="text-[11px] text-muted-foreground shrink-0">
            {timeLabel}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2 mt-0.5">
          <p className="text-xs text-muted-foreground truncate">{lastText}</p>
          {conversation.unreadCount > 0 && (
            <Badge
              variant="default"
              className="h-4 min-w-4 px-1 text-[10px] rounded-full shrink-0 bg-foreground text-background"
            >
              {conversation.unreadCount > 99 ? "99+" : conversation.unreadCount}
            </Badge>
          )}
        </div>
      </div>
    </button>
  );
}

export function ConversationList({
  selectedId,
  onSelect,
  currentUserId,
  showArchiveAndDelete = false,
}: ConversationListProps) {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [showArchived, setShowArchived] = useState(false);
  const [deleteConfirmConvId, setDeleteConfirmConvId] = useState<string | null>(
    null,
  );

  const { user } = useAuth();
  const { data: staffData } = useStaffUsers();
  const { data: clientData } = useChatClients({
    permissionMode: user?.role === "admin" ? "restricted" : "unrestricted",
    currentUsername: user?.username ?? "",
  });

  const getProfileImageUrl = (type: ParticipantType, id: string): string | undefined => {
    if (type === "staff") {
      return staffData?.data?.find((u) => u._id === id)?.profile_image_url;
    }
    if (type === "client") {
      return clientData?.data?.find((c) => c._id === id)?.profile_image_url;
    }
    return undefined;
  };

  const typeFilter: ConversationType | undefined =
    activeTab === "dm" ? "dm" : activeTab === "group" ? "group" : undefined;

  const { data, isLoading } = useConversations({
    search: search || undefined,
    type: typeFilter,
    limit: 50,
    archived: showArchiveAndDelete && showArchived ? true : undefined,
  });

  const archiveMutation = useArchiveConversation();
  const deleteMutation = useDeleteConversation();

  const conversations = data?.data ?? [];

  const handleDeleteConfirm = () => {
    if (!deleteConfirmConvId) return;
    deleteMutation.mutate(deleteConfirmConvId, {
      onSettled: () => {
        setDeleteConfirmConvId(null);
        if (selectedId === deleteConfirmConvId) {
          onSelect(null);
        }
      },
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="px-3 pt-3 pb-2 space-y-2 shrink-0">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search conversations…"
              className="pl-8 h-8 text-sm bg-muted/50 border-border/60 rounded-xl"
            />
          </div>
          {showArchiveAndDelete && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5 text-muted-foreground shrink-0"
              onClick={() => setShowArchived((a) => !a)}
            >
              {showArchived ? (
                <>
                  <Inbox className="h-3.5 w-3.5" />
                  <span className="text-xs hidden sm:inline">Active</span>
                </>
              ) : (
                <>
                  <Archive className="h-3.5 w-3.5" />
                  <span className="text-xs hidden sm:inline">Archived</span>
                </>
              )}
            </Button>
          )}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabType)}>
          <TabsList className="w-full h-8 bg-muted/50 rounded-xl p-0.5">
            <TabsTrigger value="all" className="flex-1 text-xs rounded-lg h-7">
              All
            </TabsTrigger>
            <TabsTrigger value="dm" className="flex-1 text-xs rounded-lg h-7">
              DMs
            </TabsTrigger>
            <TabsTrigger value="group" className="flex-1 text-xs rounded-lg h-7">
              Groups
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* List */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="px-2 pb-3 space-y-0.5">
          {isLoading ? (
            <ConversationSkeleton />
          ) : conversations.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                {search
                  ? "No results found"
                  : showArchived
                    ? "No archived conversations"
                    : "No conversations yet"}
              </p>
            </div>
          ) : showArchiveAndDelete ? (
            conversations.map((conv) => (
              <AdminConversationRow
                key={conv._id}
                conversation={conv}
                isSelected={selectedId === conv._id}
                currentUserId={currentUserId}
                isArchivedView={showArchived}
                onSelect={onSelect}
                onArchive={() =>
                  archiveMutation.mutate({
                    conversationId: conv._id,
                    archived: !showArchived,
                  })
                }
                onDeleteRequest={() => setDeleteConfirmConvId(conv._id)}
                isArchiving={
                  archiveMutation.isPending &&
                  archiveMutation.variables?.conversationId === conv._id
                }
                isDeleting={
                  deleteMutation.isPending &&
                  deleteMutation.variables === conv._id
                }
                getProfileImageUrl={getProfileImageUrl}
              />
            ))
          ) : (
            conversations.map((conv) => (
              <ConversationRow
                key={conv._id}
                conversation={conv}
                isSelected={selectedId === conv._id}
                currentUserId={currentUserId}
                onSelect={onSelect}
                getProfileImageUrl={getProfileImageUrl}
              />
            ))
          )}
        </div>
      </ScrollArea>

      {showArchiveAndDelete && (
        <ConfirmationModal
          open={!!deleteConfirmConvId}
          onOpenChange={(open) => !open && setDeleteConfirmConvId(null)}
          onConfirm={handleDeleteConfirm}
          title="Delete conversation?"
          description={
            <>
              This will permanently delete the conversation and all messages for
              everyone. This action cannot be undone.
            </>
          }
          confirmText="Delete"
          variant="destructive"
          isLoading={deleteMutation.isPending}
        />
      )}
    </div>
  );
}

function AdminConversationRow({
  conversation,
  isSelected,
  currentUserId,
  isArchivedView,
  onSelect,
  onArchive,
  onDeleteRequest,
  isArchiving,
  isDeleting,
  getProfileImageUrl,
}: {
  conversation: Conversation;
  isSelected: boolean;
  currentUserId: string;
  isArchivedView: boolean;
  onSelect: (id: string | null) => void;
  onArchive: () => void;
  onDeleteRequest: () => void;
  isArchiving: boolean;
  isDeleting: boolean;
  getProfileImageUrl?: (type: ParticipantType, id: string) => string | undefined;
}) {
  return (
    <div className="flex items-center gap-1 py-0.5 group">
      <div className="flex-1 min-w-0">
        <ConversationRow
          conversation={conversation}
          isSelected={isSelected}
          currentUserId={currentUserId}
          onSelect={(id) => onSelect(id)}
          getProfileImageUrl={getProfileImageUrl}
        />
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 opacity-70 hover:opacity-100"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
          <DropdownMenuItem
            onClick={onArchive}
            disabled={isArchiving || isDeleting}
          >
            <Archive className="h-3.5 w-3.5 mr-2" />
            {isArchivedView ? "Unarchive" : "Archive"}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={onDeleteRequest}
            disabled={isArchiving || isDeleting}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function ConversationSkeleton() {
  return (
    <div className="space-y-1 px-1 pt-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center gap-3 px-3 py-3 animate-pulse">
          <Skeleton className="h-10 w-10 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="flex justify-between">
              <Skeleton className="h-3 w-28 rounded" />
              <Skeleton className="h-3 w-10 rounded" />
            </div>
            <Skeleton className="h-3 w-40 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
