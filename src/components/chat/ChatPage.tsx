"use client";

import { useState } from "react";
import { MessageSquare, PenSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useChatSocket } from "@/hooks/useChat";
import { ConversationList } from "@/components/chat/ConversationList";
import { ChatThread } from "@/components/chat/ChatThread";
import { NewChatDialog } from "@/components/chat/NewChatDialog";
import { GroupSettingsSheet } from "@/components/chat/GroupSettingsSheet";
export default function ChatPage() {
  const { user } = useAuth();
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | null
  >(null);
  const [showNewChat, setShowNewChat] = useState(false);
  const [showGroupSettings, setShowGroupSettings] = useState(false);
  // Mobile: which panel to show
  const [mobileView, setMobileView] = useState<"list" | "thread">("list");

  // Connect socket at page level
  useChatSocket(selectedConversationId);

  const currentUserId = user?._id ?? "";

  const handleSelectConversation = (id: string | null) => {
    setSelectedConversationId(id);
    setMobileView(id ? "thread" : "list");
  };

  const handleBackToList = () => {
    setMobileView("list");
  };

  const handleConversationCreated = (id: string) => {
    setSelectedConversationId(id);
    setShowNewChat(false);
    setMobileView("thread");
  };

  if (!user) return null;

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-background overflow-hidden">
      {/* Left panel — conversation list */}
      <div
        className={cn(
          "flex flex-col border-r border-border/40 bg-background",
          "w-full md:w-80 lg:w-96 shrink-0",
          // Mobile: hide list when thread is shown
          mobileView === "thread" ? "hidden md:flex" : "flex",
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-border/40 shrink-0">
          <h1 className="text-xl font-medium text-foreground">Messages</h1>
          <Button
            size="icon-sm"
            variant="secondary"
            onClick={() => setShowNewChat(true)}
            className="h-8 w-8 rounded-xl"
          >
            <PenSquare className="h-4 w-4" />
          </Button>
        </div>

        <ConversationList
          selectedId={selectedConversationId}
          onSelect={handleSelectConversation}
          currentUserId={currentUserId}
          showArchiveAndDelete
        />
      </div>

      {/* Right panel — chat thread or empty state */}
      <div
        className={cn(
          "flex-1 flex flex-col min-w-0 bg-background relative",
          // Mobile: hide thread when list is shown
          mobileView === "list" ? "hidden md:flex" : "flex",
        )}
      >
        {selectedConversationId ? (
          <ChatThread
            key={selectedConversationId}
            conversationId={selectedConversationId}
            currentUserId={currentUserId}
            currentUserType="staff"
            onBack={handleBackToList}
            onOpenGroupSettings={() => setShowGroupSettings(true)}
          />
        ) : (
          <EmptyThreadState />
        )}
      </div>

      {/* New Chat Dialog */}
      <NewChatDialog
        open={showNewChat}
        onOpenChange={setShowNewChat}
        currentUserId={currentUserId}
        onCreated={handleConversationCreated}
      />

      {/* Group Settings Sheet */}
      {selectedConversationId && (
        <GroupSettingsSheet
          open={showGroupSettings}
          onOpenChange={setShowGroupSettings}
          conversationId={selectedConversationId}
          currentUserId={currentUserId}
          onLeft={() => {
            setSelectedConversationId(null);
            setMobileView("list");
          }}
        />
      )}
    </div>
  );
}

function EmptyThreadState() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center space-y-3">
        <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mx-auto">
          <MessageSquare className="h-8 w-8 text-muted-foreground/40" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">
            Select a conversation
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Choose from your existing messages or start a new one
          </p>
        </div>
      </div>
    </div>
  );
}
