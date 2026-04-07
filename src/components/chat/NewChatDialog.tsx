"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { Search, X, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { getDefaultAvatarSrc } from "@/lib/chatAvatars";
import { useDebounce } from "@/hooks/useDebounce";
import { useCreateConversation, useStaffUsers, useChatClients } from "@/hooks/useChat";
import type {
  ChatParticipantRef,
  StaffUser,
} from "@/types/chat";

interface NewChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUserId: string;
  onCreated: (conversationId: string) => void;
}

interface UserOption {
  _id: string;
  displayName: string;
  role?: string;
  participantType: "staff" | "client";
  profileImageUrl?: string;
}

function UserSelectItem({
  user,
  selected,
  onToggle,
}: {
  user: UserOption;
  selected: boolean;
  onToggle: (user: UserOption) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onToggle(user)}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors",
        selected ? "bg-primary/10" : "hover:bg-muted/60",
      )}
    >
      <div className="relative h-8 w-8 rounded-full overflow-hidden shrink-0">
        <Image
          src={user.profileImageUrl?.trim() ? user.profileImageUrl : getDefaultAvatarSrc(user._id)}
          alt={user.displayName}
          fill
          className="object-cover"
          unoptimized
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{user.displayName}</p>
        {user.role && (
          <p className="text-xs text-muted-foreground capitalize">
            {user.role.replace("_", " ")}
          </p>
        )}
      </div>
      {selected && (
        <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center shrink-0">
          <span className="text-[10px] text-primary-foreground font-bold">✓</span>
        </div>
      )}
    </button>
  );
}

type UserFilter = "all" | "staff" | "clients";

const TABS = [
  { label: "Direct Message", value: "dm" },
  { label: "Group", value: "group" },
] as const;

export function NewChatDialog({
  open,
  onOpenChange,
  currentUserId,
  onCreated,
}: NewChatDialogProps) {
  const [activeTab, setActiveTab] = useState<"dm" | "group">("dm");
  const [search, setSearch] = useState("");
  const [userFilter, setUserFilter] = useState<UserFilter>("all");
  const [selectedDmUser, setSelectedDmUser] = useState<UserOption | null>(null);
  const [groupName, setGroupName] = useState("");
  const [groupDesc, setGroupDesc] = useState("");
  const [selectedGroupUsers, setSelectedGroupUsers] = useState<UserOption[]>([]);

  const debouncedSearch = useDebounce(search, 300);

  const { data: staffData, isLoading: staffLoading } = useStaffUsers();
  const {
    data: clientData,
    isLoading: clientLoading,
    total: clientTotal,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useChatClients({
    permissionMode: "staff",
    currentUsername: currentUserId,
    search: userFilter !== "staff" ? debouncedSearch : undefined,
  });
  const createConversation = useCreateConversation();

  const isLoading = staffLoading || clientLoading;

  const handleClientListScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (!hasNextPage || isFetchingNextPage) return;
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop - clientHeight < 80) {
      fetchNextPage();
    }
  };

  const staffOptions: UserOption[] = useMemo(() => {
    const users = staffData?.data ?? [];
    return users
      .filter((u: StaffUser) => !!u._id && u._id !== currentUserId)
      .map((u: StaffUser) => ({
        _id: u._id,
        displayName: u.username,
        role: u.role,
        participantType: "staff" as const,
        profileImageUrl: u.profile_image_url,
      }));
  }, [staffData, currentUserId]);

  const clientOptions: UserOption[] = useMemo(() => {
    const clients = clientData?.data ?? [];
    return clients
      .filter((c) => !!c._id)
      .map((c) => ({
        _id: c._id,
        displayName: c.name,
        role: "client",
        participantType: "client" as const,
        profileImageUrl: c.profile_image_url,
      }));
  }, [clientData]);

  // Staff is client-side filtered (small list); clients are server-side filtered via debouncedSearch
  const filteredStaff = useMemo(() => {
    const q = debouncedSearch.toLowerCase();
    return !q ? staffOptions : staffOptions.filter((u) => u.displayName.toLowerCase().includes(q));
  }, [staffOptions, debouncedSearch]);

  const filteredOptions = useMemo(() => {
    if (userFilter === "staff") return filteredStaff;
    if (userFilter === "clients") return clientOptions;
    return [...filteredStaff, ...clientOptions];
  }, [filteredStaff, clientOptions, userFilter]);

  const handleCreateDM = async () => {
    if (!selectedDmUser) return;
    const res = await createConversation.mutateAsync({
      type: "dm",
      participant: {
        type: selectedDmUser.participantType,
        id: selectedDmUser._id,
      },
    });
    if (res.data._id) {
      onCreated(res.data._id);
      handleClose();
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedGroupUsers.length === 0) return;
    const participants: ChatParticipantRef[] = selectedGroupUsers.map((u) => ({
      type: u.participantType,
      id: u._id,
    }));
    const res = await createConversation.mutateAsync({
      type: "group",
      name: groupName.trim(),
      description: groupDesc.trim() || undefined,
      participants,
    });
    if (res.data._id) {
      onCreated(res.data._id);
      handleClose();
    }
  };

  const handleClose = () => {
    setSearch("");
    setUserFilter("all");
    setSelectedDmUser(null);
    setGroupName("");
    setGroupDesc("");
    setSelectedGroupUsers([]);
    onOpenChange(false);
  };

  const toggleGroupUser = (user: UserOption) => {
    setSelectedGroupUsers((prev) =>
      prev.some((u) => u._id === user._id)
        ? prev.filter((u) => u._id !== user._id)
        : [...prev, user],
    );
  };

  const isActionDisabled =
    activeTab === "dm"
      ? !selectedDmUser || createConversation.isPending
      : !groupName.trim() || selectedGroupUsers.length === 0 || createConversation.isPending;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent showCloseButton={false} className="sm:max-w-[440px] gap-0 p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <DialogTitle className="text-base font-semibold">New Chat</DialogTitle>
          <button
            type="button"
            onClick={handleClose}
            className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b mb-4">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => {
                setActiveTab(tab.value);
                setSearch("");
                setUserFilter("all");
              }}
              className={cn(
                "px-4 py-2 text-sm font-medium transition-colors relative",
                activeTab === tab.value
                  ? "text-foreground after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* DM Content */}
        {activeTab === "dm" && (
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search people…"
                className="pl-8 bg-muted/50 border-border/60 rounded-xl"
              />
            </div>

            <div className="flex gap-1.5">
              {(["all", "staff", "clients"] as UserFilter[]).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setUserFilter(f)}
                  className={cn(
                    "px-3 py-1 rounded-full text-xs font-medium transition-colors",
                    userFilter === f
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80",
                  )}
                >
                  {f === "all"
                    ? "All"
                    : f === "staff"
                      ? `Staff (${staffOptions.length})`
                      : `Clients (${clientTotal})`}
                </button>
              ))}
            </div>

            <div
              className="max-h-60 overflow-y-auto space-y-0.5 rounded-xl border border-border/40 p-1"
              onScroll={handleClientListScroll}
            >
              {isLoading ? (
                <UserListSkeleton />
              ) : filteredOptions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  No people found
                </p>
              ) : userFilter === "all" ? (
                <>
                  <UserListWithSections
                    staffOptions={filteredStaff}
                    clientOptions={clientOptions}
                    selectedId={selectedDmUser?._id ?? null}
                    onSelect={(u) =>
                      setSelectedDmUser(selectedDmUser?._id === u._id ? null : u)
                    }
                  />
                  {isFetchingNextPage && (
                    <div className="flex justify-center py-1">
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                    </div>
                  )}
                </>
              ) : (
                <>
                  {filteredOptions.map((user) => (
                    <UserSelectItem
                      key={user._id}
                      user={user}
                      selected={selectedDmUser?._id === user._id}
                      onToggle={(u) =>
                        setSelectedDmUser(selectedDmUser?._id === u._id ? null : u)
                      }
                    />
                  ))}
                  {userFilter === "clients" && isFetchingNextPage && (
                    <div className="flex justify-center py-1">
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Group Content */}
        {activeTab === "group" && (
          <div className="space-y-3">
            <Input
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Group name *"
              className="bg-muted/50 border-border/60 rounded-xl"
            />
            <Input
              value={groupDesc}
              onChange={(e) => setGroupDesc(e.target.value)}
              placeholder="Description (optional)"
              className="bg-muted/50 border-border/60 rounded-xl"
            />

            {selectedGroupUsers.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {selectedGroupUsers.map((u) => (
                  <div
                    key={u._id}
                    className="flex items-center gap-1 bg-primary/10 text-primary rounded-full px-2.5 py-1 text-xs"
                  >
                    {u.displayName}
                    <button
                      type="button"
                      onClick={() => toggleGroupUser(u)}
                      className="hover:opacity-70"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Add participants…"
                className="pl-8 bg-muted/50 border-border/60 rounded-xl"
              />
            </div>

            <div className="flex gap-1.5">
              {(["all", "staff", "clients"] as UserFilter[]).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setUserFilter(f)}
                  className={cn(
                    "px-3 py-1 rounded-full text-xs font-medium transition-colors",
                    userFilter === f
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80",
                  )}
                >
                  {f === "all" ? "All" : f === "staff" ? "Staff" : "Clients"}
                </button>
              ))}
            </div>

            <div
              className="max-h-44 overflow-y-auto space-y-0.5 rounded-xl border border-border/40 p-1"
              onScroll={handleClientListScroll}
            >
              {isLoading ? (
                <UserListSkeleton />
              ) : filteredOptions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  No people found
                </p>
              ) : userFilter === "all" ? (
                <>
                  <UserListWithSections
                    staffOptions={filteredStaff}
                    clientOptions={clientOptions}
                    selectedId={null}
                    selectedIds={selectedGroupUsers.map((u) => u._id)}
                    onSelect={toggleGroupUser}
                  />
                  {isFetchingNextPage && (
                    <div className="flex justify-center py-1">
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                    </div>
                  )}
                </>
              ) : (
                <>
                  {filteredOptions.map((user) => (
                    <UserSelectItem
                      key={user._id}
                      user={user}
                      selected={selectedGroupUsers.some((u) => u._id === user._id)}
                      onToggle={toggleGroupUser}
                    />
                  ))}
                  {userFilter === "clients" && isFetchingNextPage && (
                    <div className="flex justify-center py-1">
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="-mx-5 -mb-5 flex items-center justify-end gap-2 border-t bg-muted/50 px-5 py-4 mt-4">
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            type="button"
            className="bg-primary-blue"
            disabled={isActionDisabled}
            onClick={activeTab === "dm" ? handleCreateDM : handleCreateGroup}
            premium3D
          >
            {createConversation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            {activeTab === "dm" ? "Start Chat" : "Create Group"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SectionHeader({ label, count }: { label: string; count: number }) {
  if (count === 0) return null;
  return (
    <div className="px-3 pt-2 pb-1">
      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
        {label} ({count})
      </p>
    </div>
  );
}

function UserListWithSections({
  staffOptions,
  clientOptions,
  selectedId,
  selectedIds,
  onSelect,
}: {
  staffOptions: UserOption[];
  clientOptions: UserOption[];
  selectedId: string | null;
  selectedIds?: string[];
  onSelect: (user: UserOption) => void;
}) {
  const isSelected = (id: string) =>
    selectedId === id || (selectedIds?.includes(id) ?? false);

  return (
    <>
      <SectionHeader label="Staff" count={staffOptions.length} />
      {staffOptions.map((user) => (
        <UserSelectItem
          key={user._id}
          user={user}
          selected={isSelected(user._id)}
          onToggle={onSelect}
        />
      ))}
      <SectionHeader label="Clients" count={clientOptions.length} />
      {clientOptions.map((user) => (
        <UserSelectItem
          key={user._id}
          user={user}
          selected={isSelected(user._id)}
          onToggle={onSelect}
        />
      ))}
    </>
  );
}

function UserListSkeleton() {
  return (
    <div className="space-y-1 p-1">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-3 px-3 py-2.5 animate-pulse">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="space-y-1.5 flex-1">
            <Skeleton className="h-3 w-24 rounded" />
            <Skeleton className="h-2.5 w-16 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
