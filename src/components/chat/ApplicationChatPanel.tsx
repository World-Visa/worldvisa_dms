"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { AlertCircle, Loader2, RefreshCw, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { RiMessage3Fill } from "react-icons/ri";
import { Button } from "@/components/ui/button";
import { ConfirmationModal } from "@/components/ui/confirmation-modal";
import { Skeleton } from "@/components/ui/skeleton";
import { InlineToast } from "@/components/ui/primitives/inline-toast";
import { getDefaultAvatarSrc } from "@/lib/chatAvatars";
import { useAuth } from "@/hooks/useAuth";
import {
  useChatClients,
  useChatSocket,
  useConversations,
  useCreateConversation,
  useLeaveConversation,
} from "@/hooks/useChat";
import { ChatThread } from "@/components/chat/ChatThread";
import type { ChatPanelData } from "@/store/layoutStore";

interface ApplicationChatPanelProps {
  data: ChatPanelData;
  onClose: () => void;
}

export function ApplicationChatPanel({ data, onClose }: ApplicationChatPanelProps) {
  const { user } = useAuth();
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [leaveGroupConvId, setLeaveGroupConvId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const [autoOpenDone, setAutoOpenDone] = useState(false);


  const { data: clientsData, isLoading: clientsLoading } = useChatClients({
    permissionMode: user?.role === "admin" ? "restricted" : "unrestricted",
    currentUsername: user?.username ?? "",
    search: data.clientName ?? undefined,
  });
  const { data: conversationsData, isLoading: conversationsLoading } = useConversations({
    limit: 50,
  });

  const createConversation = useCreateConversation();
  const leaveConversationMutation = useLeaveConversation();

  const conversations = conversationsData?.data ?? [];

  useChatSocket(selectedConversationId);

  // Reset on application change
  useEffect(() => {
    setError(null);
    setSelectedConversationId(null);
    setAutoOpenDone(false);
  }, [data.applicationId, retryKey]);

  // Find client by lead_id, with name fallback for cases where lead_id isn't set
  const targetClient = useMemo(() => {
    const allClients = clientsData?.data ?? [];
    const byLeadId = allClients.find((c) => c.lead_id === data.leadId);
    if (byLeadId) return byLeadId;
    if (data.clientName) {
      const normalized = data.clientName.trim().toLowerCase();
      return allClients.find((c) => c.name.trim().toLowerCase() === normalized) ?? null;
    }
    return null;
  }, [clientsData, data.leadId, data.clientName]);

  // Find existing DM with this client
  const existingDm = useMemo(() => {
    if (!targetClient || !conversations.length) return null;
    return (
      conversations.find(
        (conv) =>
          conv.type === "dm" &&
          conv.participants?.some((p) => p.type === "client" && p.id === targetClient._id),
      ) ?? null
    );
  }, [conversations, targetClient]);

  // Auto-open existing DM once data loads (runs once)
  useEffect(() => {
    if (autoOpenDone || conversationsLoading || clientsLoading) return;
    if (existingDm) {
      setSelectedConversationId(existingDm._id);
    }
    setAutoOpenDone(true);
  }, [autoOpenDone, conversationsLoading, clientsLoading, existingDm]);

  const handleInitiateChat = useCallback(() => {
    if (!targetClient) return;
    setError(null);
    createConversation.mutate(
      { type: "dm", participant: { type: "client", id: targetClient._id } },
      {
        onSuccess: (res) => setSelectedConversationId(res.data._id),
        onError: (err) => setError(err.message || "Could not start conversation"),
      },
    );
  }, [targetClient, createConversation]);

  const clientProfileImage = targetClient?.profile_image_url?.trim() || null;

  const isLoading = (conversationsLoading || clientsLoading) && !autoOpenDone;
  const showThread = selectedConversationId !== null;

  return (
    <div className="flex h-[calc(100%-20px)] w-[400px] shrink-0 flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-[0px_18px_88px_-4px_rgba(24,39,75,0.14)] m-[10px]">
      {/* Minimal top bar — only visible when no thread is open (loading / error / initiate) */}
      {!showThread && (
        <div className="flex h-10 shrink-0 items-center justify-end border-b border-neutral-100 px-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0 text-neutral-400 hover:text-neutral-700"
            onClick={onClose}
            aria-label="Close chat panel"
          >
            <X className="size-4" />
          </Button>
        </div>
      )}

      {/* ── Panel body ── */}
      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
        <AnimatePresence mode="wait">
          {/* Loading */}
          {isLoading && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="absolute inset-0"
            >
              <PanelLoadingState />
            </motion.div>
          )}

          {/* Error */}
          {!isLoading && error && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0"
            >
              <PanelErrorState
                error={error}
                onRetry={() => {
                  setError(null);
                  setRetryKey((k) => k + 1);
                }}
              />
            </motion.div>
          )}

          {/* Initiate / empty state */}
          {!isLoading && !error && !showThread && (
            <motion.div
              key="initiate"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
              className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 text-center"
            >
              {/* Large client avatar */}
              <div className="relative h-16 w-16 overflow-hidden rounded-full bg-neutral-100 shadow-sm ring-2 ring-neutral-100">
                <Image
                  src={
                    clientProfileImage ??
                    getDefaultAvatarSrc(targetClient?._id ?? data.clientName ?? "")
                  }
                  alt={data.clientName ?? "Client"}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>

              <div className="space-y-1">
                <p className="text-base font-semibold text-neutral-900">
                  {data.clientName ?? "Client"}
                </p>
                <p className="text-sm text-neutral-400">
                  No conversation yet
                </p>
                <p className="text-xs text-neutral-300">
                  Start chatting to connect with this client
                </p>
              </div>

              {targetClient ? (
                <Button
                  onClick={handleInitiateChat}
                  disabled={createConversation.isPending}
                  className="bg-neutral-900 text-white hover:bg-neutral-800 gap-1.5"
                >
                  {createConversation.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <RiMessage3Fill className="h-3.5 w-3.5" />
                  )}
                  Start Conversation
                </Button>
              ) : (
                <InlineToast
                  variant="info"
                  title="Note"
                  description="Invite and onboard the client to enable chat."
                  className="border-neutral-200 border max-w-[320px] text-left"
                />
              )}
            </motion.div>
          )}

          {/* Thread */}
          {!isLoading && !error && showThread && user && (
            <motion.div
              key={`thread-${selectedConversationId}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
              className="absolute inset-0 flex flex-col"
            >
              <ChatThread
                key={selectedConversationId}
                conversationId={selectedConversationId!}
                currentUserId={user._id}
                currentUserType="staff"
                onBack={() => setSelectedConversationId(null)}
                alwaysShowBack={true}
                onLeaveGroup={() => setLeaveGroupConvId(selectedConversationId)}
                onClose={onClose}
              />
              <PanelLeaveGroupDialog
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
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function PanelLeaveGroupDialog({
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
    <ConfirmationModal
      open={!!conversationId}
      onOpenChange={(open) => !open && onCancel()}
      onConfirm={onConfirm}
      title="Leave group?"
      description="You will no longer receive messages in this group. You can be added again by a team member."
      confirmText="Leave group"
      isLoading={isLeaving}
      variant="destructive"
    />
  );
}

function PanelLoadingState() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4">
      <Skeleton className="h-16 w-16 rounded-full" />
      <div className="space-y-2 text-center">
        <Skeleton className="mx-auto h-4 w-32 rounded" />
        <Skeleton className="mx-auto h-3 w-24 rounded" />
      </div>
      <Skeleton className="h-9 w-40 rounded-lg" />
    </div>
  );
}

function PanelErrorState({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
        <AlertCircle className="h-6 w-6 text-destructive" />
      </div>
      <div>
        <p className="text-sm font-medium text-foreground">Could not start chat</p>
        <p className="mt-1 text-xs text-muted-foreground">{error}</p>
      </div>
      <Button size="sm" variant="outline" onClick={onRetry}>
        <RefreshCw className="mr-2 h-3.5 w-3.5" />
        Try Again
      </Button>
    </div>
  );
}
