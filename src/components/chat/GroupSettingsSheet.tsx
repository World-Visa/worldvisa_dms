"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { Search, X, Loader2, Trash2, LogOut } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { getDefaultAvatarSrc } from "@/lib/chatAvatars";
import {
  useConversation,
  useUpdateGroup,
  useUpdateParticipants,
  useLeaveConversation,
  useClearConversation,
  useStaffUsers,
} from "@/hooks/useChat";
import type { StaffUser } from "@/types/chat";

interface GroupSettingsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversationId: string;
  currentUserId: string;
  onLeft?: () => void;
}

export function GroupSettingsSheet({
  open,
  onOpenChange,
  conversationId,
  currentUserId,
  onLeft,
}: GroupSettingsSheetProps) {
  const { data: convData, isLoading } = useConversation(conversationId);
  const { data: staffData } = useStaffUsers();

  const updateGroup = useUpdateGroup(conversationId);
  const updateParticipants = useUpdateParticipants(conversationId);
  const leaveConversation = useLeaveConversation();
  const clearConversation = useClearConversation();

  const conversation = convData?.data;

  const [name, setName] = useState(conversation?.name ?? "");
  const [description, setDescription] = useState(
    conversation?.description ?? "",
  );
  const [addSearch, setAddSearch] = useState("");

  // Sync fields when conversation loads
  useMemo(() => {
    if (conversation) {
      setName(conversation.name ?? "");
      setDescription(conversation.description ?? "");
    }
  }, [conversation]);

  const memberIds = new Set(conversation?.members?.map((m) => m.id) ?? []);

  const availableToAdd = useMemo(() => {
    const staff = staffData?.data ?? [];
    return staff
      .filter((u: StaffUser) => !memberIds.has(u._id))
      .filter((u: StaffUser) =>
        addSearch
          ? u.username.toLowerCase().includes(addSearch.toLowerCase())
          : true,
      );
  }, [staffData, memberIds, addSearch]);

  const handleSaveInfo = async () => {
    await updateGroup.mutateAsync({ name: name.trim(), description: description.trim() || undefined });
  };

  const handleRemoveMember = (memberId: string, memberType: "staff" | "client") => {
    updateParticipants.mutate({
      remove: [{ type: memberType, id: memberId }],
    });
  };

  const handleAddMember = (staffUser: StaffUser) => {
    updateParticipants.mutate({
      add: [{ type: "staff", id: staffUser._id }],
    });
    setAddSearch("");
  };

  const handleLeave = async () => {
    await leaveConversation.mutateAsync(conversationId);
    onOpenChange(false);
    onLeft?.();
  };

  const handleClear = async () => {
    await clearConversation.mutateAsync(conversationId);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-sm overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Group Settings</SheetTitle>
        </SheetHeader>

        {isLoading ? (
          <GroupSettingsSkeleton />
        ) : (
          <div className="mt-4 space-y-6">
            {/* Group info */}
            <section className="space-y-3">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Group Info
              </h3>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Group name"
                className="bg-muted/50 border-border/60 rounded-xl"
              />
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description (optional)"
                className="bg-muted/50 border-border/60 rounded-xl"
              />
              <Button
                size="sm"
                className="w-full"
                onClick={handleSaveInfo}
                disabled={
                  !name.trim() ||
                  updateGroup.isPending ||
                  (name === conversation?.name &&
                    description === (conversation?.description ?? ""))
                }
              >
                {updateGroup.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />
                ) : null}
                Save Changes
              </Button>
            </section>

            <Separator />

            {/* Members */}
            <section className="space-y-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Members ({conversation?.members?.length ?? 0})
              </h3>
              <div className="space-y-1">
                {conversation?.members?.map((member) => {
                  const isCurrentUser = member.id === currentUserId;
                  return (
                    <div
                      key={`${member.type}-${member.id}`}
                      className="flex items-center gap-2.5 px-2 py-2 rounded-xl"
                    >
                      <div className="relative h-7 w-7 rounded-full overflow-hidden shrink-0">
                        <Image
                          src={getDefaultAvatarSrc(member.id)}
                          alt={member.displayName}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {member.displayName}
                          {isCurrentUser && (
                            <span className="text-xs text-muted-foreground ml-1">
                              (you)
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {member.type}
                        </p>
                      </div>
                      {!isCurrentUser && (
                        <button
                          type="button"
                          onClick={() =>
                            handleRemoveMember(member.id, member.type)
                          }
                          disabled={updateParticipants.isPending}
                          className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            <Separator />

            {/* Add members */}
            <section className="space-y-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Add Members
              </h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                <Input
                  value={addSearch}
                  onChange={(e) => setAddSearch(e.target.value)}
                  placeholder="Search people…"
                  className="pl-8 bg-muted/50 border-border/60 rounded-xl"
                />
              </div>
              {addSearch && (
                <div className="space-y-0.5 max-h-40 overflow-y-auto rounded-xl border border-border/40 p-1">
                  {availableToAdd.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-3">
                      No people found
                    </p>
                  ) : (
                    availableToAdd.slice(0, 10).map((u: StaffUser) => (
                      <button
                        key={u._id}
                        type="button"
                        onClick={() => handleAddMember(u)}
                        disabled={updateParticipants.isPending}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-muted/60 text-left transition-colors"
                      >
                        <div className="relative h-6 w-6 rounded-full overflow-hidden shrink-0">
                          <Image
                            src={getDefaultAvatarSrc(u._id)}
                            alt={u.username}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                        <p className="text-sm">{u.username}</p>
                      </button>
                    ))
                  )}
                </div>
              )}
            </section>

            <Separator />

            {/* Danger zone */}
            <section className="space-y-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Actions
              </h3>
              <Button
                variant="outline"
                size="sm"
                className="w-full text-muted-foreground"
                onClick={handleClear}
                disabled={clearConversation.isPending}
              >
                {clearConversation.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5 mr-2" />
                )}
                Clear Conversation
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full text-destructive border-destructive/40 hover:bg-destructive/10"
                onClick={handleLeave}
                disabled={leaveConversation.isPending}
              >
                {leaveConversation.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />
                ) : (
                  <LogOut className="h-3.5 w-3.5 mr-2" />
                )}
                Leave Group
              </Button>
            </section>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function GroupSettingsSkeleton() {
  return (
    <div className="mt-4 space-y-4 animate-pulse">
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-10 rounded-xl w-full" />
      ))}
    </div>
  );
}
