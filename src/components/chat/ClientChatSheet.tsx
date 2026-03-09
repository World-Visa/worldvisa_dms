"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  MessageSquare,
  RefreshCw,
  AlertCircle,
  MoreVertical,
  Archive,
  Inbox,
  Trash2,
  Loader2,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/hooks/useAuth";
import {
  useConversations,
  useCreateConversation,
  useChatSocket,
  useStaffUsers,
  useArchiveConversation,
  useDeleteConversation,
  useLeaveConversation,
} from "@/hooks/useChat";
import { ChatThread } from "@/components/chat/ChatThread";
import { ConversationRow } from "@/components/chat/ConversationList";
import type { Conversation, ParticipantType } from "@/types/chat";

interface ClientChatSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  applicationHandledBy: string;
  leadId: string;
}

export function ClientChatSheet({
  open,
  onOpenChange,
  applicationHandledBy,
  leadId,
}: ClientChatSheetProps) {
  const { user } = useAuth();
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | null
  >(null);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const [showArchived, setShowArchived] = useState(false);
  const [deleteConfirmConvId, setDeleteConfirmConvId] = useState<
    string | null
  >(null);
  const [leaveGroupConvId, setLeaveGroupConvId] = useState<string | null>(null);
  const { data: staffData, isLoading: staffLoading } = useStaffUsers();
  const { data: conversationsData, isLoading: conversationsLoading } =
    useConversations({
      limit: 50,
      archived: showArchived ? true : undefined,
    });
  const createConversation = useCreateConversation();
  const archiveConversationMutation = useArchiveConversation();
  const deleteConversationMutation = useDeleteConversation();
  const leaveConversationMutation = useLeaveConversation();

  const conversations = conversationsData?.data ?? [];

  const getProfileImageUrl = (type: ParticipantType, id: string): string | undefined => {
    if (type === "staff") {
      return staffData?.data?.find((u) => u._id === id)?.profile_image_url;
    }
    return undefined;
  };

  // Connect socket when a conversation is selected
  useChatSocket(selectedConversationId);

  // Resolve lead owner staff ID
  const staffId = useMemo(() => {
    if (!staffData?.data || !applicationHandledBy) return null;
    const match = staffData.data.find(
      (s) =>
        s.username.toLowerCase() === applicationHandledBy.toLowerCase(),
    );
    return match?._id ?? null;
  }, [staffData, applicationHandledBy]);

  // When client has 0 active conversations, create DM with current advisor
  useEffect(() => {
    if (
      !open ||
      !staffId ||
      showArchived ||
      conversationsLoading ||
      conversations.length > 0 ||
      createConversation.isPending ||
      selectedConversationId
    )
      return;

    setError(null);
    createConversation.mutate(
      {
        type: "dm",
        participant: { type: "staff", id: staffId },
      },
      {
        onSuccess: (res) => {
          setSelectedConversationId(res.data._id);
        },
        onError: (err) => {
          setError(err.message || "Could not connect to advisor");
        },
      },
    );
  }, [
    open,
    staffId,
    showArchived,
    conversationsLoading,
    conversations.length,
    retryKey,
  ]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset state when sheet closes
  useEffect(() => {
    if (!open) {
      setError(null);
      setSelectedConversationId(null);
    }
  }, [open]);

  const showList =
    selectedConversationId === null &&
    (conversations.length >= 1 || showArchived);
  const isResolving =
    conversationsLoading ||
    (conversations.length === 0 &&
      !!staffId &&
      !selectedConversationId &&
      !error &&
      createConversation.isPending);

  const advisorName = applicationHandledBy || "Your Advisor";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="sm:max-w-[480px] flex flex-col p-0"
      >
        <SheetHeader className="px-4 py-3 border-b border-border/40 shrink-0">
          <SheetTitle className="flex items-center gap-2 text-sm">
            {showList ? "Messages" : `Chat with ${advisorName}`}
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 min-h-0 relative overflow-hidden flex flex-col">
          {isResolving ? (
            <LoadingState />
          ) : error || (conversations.length === 0 && !staffId && !staffLoading) ? (
            <ErrorState
              error={
                error ??
                `Could not find advisor "${applicationHandledBy}". Please contact support.`
              }
              onRetry={() => {
                setError(null);
                setRetryKey((k) => k + 1);
              }}
            />
          ) : showList && user ? (
            <>
              <div className="px-4 py-2 border-b border-border/40 shrink-0 flex items-center justify-between gap-2">
                <p className="text-xs text-muted-foreground">
                  {showArchived
                    ? "Archived conversations"
                    : "Select a conversation"}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1.5 text-muted-foreground"
                  onClick={() => setShowArchived((a) => !a)}
                >
                  {showArchived ? (
                    <>
                      <Inbox className="h-3.5 w-3.5" />
                      <span className="text-xs">Active</span>
                    </>
                  ) : (
                    <>
                      <Archive className="h-3.5 w-3.5" />
                      <span className="text-xs">Archived</span>
                    </>
                  )}
                </Button>
              </div>
              <ScrollArea className="flex-1 min-h-0">
                <div className="p-2 space-y-0.5">
                  {conversations.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Archive className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">
                        {showArchived
                          ? "No archived conversations"
                          : "No conversations yet"}
                      </p>
                    </div>
                  ) : (
                    conversations.map((conv) => (
                      <ClientConversationRow
                        key={conv._id}
                        conversation={conv}
                        currentUserId={user._id}
                        isArchivedView={showArchived}
                        onSelect={setSelectedConversationId}
                        onArchive={() =>
                          archiveConversationMutation.mutate({
                            conversationId: conv._id,
                            archived: !showArchived,
                          })
                        }
                        onDeleteRequest={() => setDeleteConfirmConvId(conv._id)}
                        isArchiving={
                          archiveConversationMutation.isPending &&
                          archiveConversationMutation.variables?.conversationId ===
                          conv._id
                        }
                        isDeleting={
                          deleteConversationMutation.isPending &&
                          deleteConversationMutation.variables === conv._id
                        }
                        getProfileImageUrl={getProfileImageUrl}
                      />
                    ))
                  )}
                </div>
              </ScrollArea>
              <DeleteConversationDialog
                conversationId={deleteConfirmConvId}
                onConfirm={() => {
                  if (deleteConfirmConvId) {
                    deleteConversationMutation.mutate(deleteConfirmConvId, {
                      onSettled: () => {
                        setDeleteConfirmConvId(null);
                        if (selectedConversationId === deleteConfirmConvId) {
                          setSelectedConversationId(null);
                        }
                      },
                    });
                  }
                }}
                onCancel={() => setDeleteConfirmConvId(null)}
              />
            </>
          ) : selectedConversationId && user ? (
            <>
              <ChatThread
                key={selectedConversationId}
                conversationId={selectedConversationId}
                currentUserId={user._id}
                currentUserType="client"
                onBack={() => setSelectedConversationId(null)}
                alwaysShowBack
                onLeaveGroup={() => setLeaveGroupConvId(selectedConversationId)}
              />
              <LeaveGroupDialog
                conversationId={leaveGroupConvId}
                isLeaving={
                  leaveConversationMutation.isPending &&
                  leaveConversationMutation.variables === leaveGroupConvId
                }
                onConfirm={() => {
                  if (!leaveGroupConvId) return;
                  leaveConversationMutation.mutate(leaveGroupConvId, {
                    onSuccess: () => {
                      setSelectedConversationId(null);
                      setLeaveGroupConvId(null);
                    },
                    onSettled: () => setLeaveGroupConvId(null),
                  });
                }}
                onCancel={() => setLeaveGroupConvId(null)}
              />
            </>
          ) : (
            <LoadingState />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function ClientConversationRow({
  conversation,
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
  currentUserId: string;
  isArchivedView: boolean;
  onSelect: (id: string) => void;
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
          isSelected={false}
          currentUserId={currentUserId}
          onSelect={onSelect}
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

function LeaveGroupDialog({
  conversationId,
  isLeaving,
  onConfirm,
  onCancel,
}: {
  conversationId: string | null;
  isLeaving: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <AlertDialog open={!!conversationId} onOpenChange={(open) => !open && onCancel()}>
      <AlertDialogContent onClick={(e) => e.stopPropagation()}>
        <AlertDialogHeader>
          <AlertDialogTitle>Leave group?</AlertDialogTitle>
          <AlertDialogDescription>
            You will no longer receive messages in this group. You can be added
            again by a team member.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel} disabled={isLeaving}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isLeaving}
            className="inline-flex items-center bg-destructive text-white hover:bg-destructive/90"
          >
            {isLeaving && (
              <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />
            )}
            Leave group
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function DeleteConversationDialog({
  conversationId,
  onConfirm,
  onCancel,
}: {
  conversationId: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <AlertDialog open={!!conversationId} onOpenChange={(open) => !open && onCancel()}>
      <AlertDialogContent onClick={(e) => e.stopPropagation()}>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete conversation?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete the conversation and all messages for
            everyone. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function LoadingState() {
  return (
    <div className="p-4 space-y-4">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className={`flex gap-2.5 animate-pulse ${i % 2 === 0 ? "flex-row-reverse ml-auto max-w-[75%]" : "mr-auto max-w-[75%]"}`}
        >
          {i % 2 !== 0 && (
            <Skeleton className="h-7 w-7 rounded-full shrink-0 mt-5" />
          )}
          <div className="space-y-1.5 flex-1">
            {i % 2 !== 0 && <Skeleton className="h-3 w-20 rounded" />}
            <Skeleton
              className={`rounded-2xl px-4 py-3 h-10 ${i % 2 === 0 ? "bg-muted/60" : "bg-muted"}`}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function ErrorState({
  error,
  onRetry,
}: {
  error: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 px-6 text-center">
      <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
        <AlertCircle className="h-6 w-6 text-destructive" />
      </div>
      <div>
        <p className="text-sm font-medium text-foreground">
          Could not start chat
        </p>
        <p className="text-xs text-muted-foreground mt-1">{error}</p>
      </div>
      <Button size="sm" variant="outline" onClick={onRetry}>
        <RefreshCw className="h-3.5 w-3.5 mr-2" />
        Try Again
      </Button>
    </div>
  );
}
