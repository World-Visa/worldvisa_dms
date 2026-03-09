"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import Image from "next/image";
import { Search, X, Users, MessageSquare, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { getDefaultAvatarSrc } from "@/lib/chatAvatars";
import { useCreateConversation, useStaffUsers, useChatClients } from "@/hooks/useChat";
import type {
  ChatParticipantRef,
  PermissionMode,
  StaffUser,
} from "@/types/chat";

interface NewChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUserId: string;
  currentUsername: string;
  permissionMode: PermissionMode;
  onCreated: (conversationId: string) => void;
}

interface UserOption {
  _id: string;
  displayName: string;
  role?: string;
  participantType: "staff" | "client";
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
          src={getDefaultAvatarSrc(user._id)}
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

export function NewChatDialog({
  open,
  onOpenChange,
  currentUserId,
  currentUsername,
  permissionMode,
  onCreated,
}: NewChatDialogProps) {
  const [activeTab, setActiveTab] = useState<"dm" | "group">("dm");
  const [search, setSearch] = useState("");
  const [userFilter, setUserFilter] = useState<UserFilter>("all");
  const [selectedDmUser, setSelectedDmUser] = useState<UserOption | null>(null);
  const [groupName, setGroupName] = useState("");
  const [groupDesc, setGroupDesc] = useState("");
  const [selectedGroupUsers, setSelectedGroupUsers] = useState<UserOption[]>([]);

  const { data: staffData, isLoading: staffLoading } = useStaffUsers();
  const {
    data: clientData,
    isLoading: clientLoading,
    total: clientTotal,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useChatClients({
    permissionMode,
    currentUsername,
  });
  const createConversation = useCreateConversation();

  const isLoading = staffLoading || clientLoading;

  // Sentinel ref for infinite scroll in client list
  const clientSentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const sentinel = clientSentinelRef.current;
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

  const staffOptions: UserOption[] = useMemo(() => {
    const users = staffData?.data ?? [];
    return users
      .filter((u: StaffUser) => u._id !== currentUserId)
      .map((u: StaffUser) => ({
        _id: u._id,
        displayName: u.username,
        role: u.role,
        participantType: "staff" as const,
      }));
  }, [staffData, currentUserId]);

  const clientOptions: UserOption[] = useMemo(() => {
    const clients = clientData?.data ?? [];
    return clients.map((c) => ({
      _id: c._id,
      displayName: c.name,
      role: "client",
      participantType: "client" as const,
    }));
  }, [clientData]);

  const filteredOptions = useMemo(() => {
    const q = search.toLowerCase();
    const matchesSearch = (u: UserOption) =>
      !q || u.displayName.toLowerCase().includes(q);

    if (userFilter === "staff") return staffOptions.filter(matchesSearch);
    if (userFilter === "clients") return clientOptions.filter(matchesSearch);
    // "all" — staff first, then clients
    return [
      ...staffOptions.filter(matchesSearch),
      ...clientOptions.filter(matchesSearch),
    ];
  }, [staffOptions, clientOptions, search, userFilter]);

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

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Chat</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "dm" | "group")}>
          <TabsList className="w-full">
            <TabsTrigger value="dm" className="flex-1">
              Direct Message
            </TabsTrigger>
            <TabsTrigger value="group" className="flex-1">
              Group
            </TabsTrigger>
          </TabsList>

          {/* DM Tab */}
          <TabsContent value="dm" className="space-y-3 mt-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search people…"
                className="pl-8 bg-muted/50 border-border/60 rounded-xl"
              />
            </div>

            {/* Filter chips */}
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

            <div className="max-h-60 overflow-y-auto space-y-0.5 rounded-xl border border-border/40 p-1">
              {isLoading ? (
                <UserListSkeleton />
              ) : filteredOptions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  No people found
                </p>
              ) : userFilter === "all" ? (
                <>
                  <UserListWithSections
                    staffOptions={staffOptions.filter(
                      (u) =>
                        !search ||
                        u.displayName.toLowerCase().includes(search.toLowerCase()),
                    )}
                    clientOptions={clientOptions.filter(
                      (u) =>
                        !search ||
                        u.displayName.toLowerCase().includes(search.toLowerCase()),
                    )}
                    selectedId={selectedDmUser?._id ?? null}
                    onSelect={(u) =>
                      setSelectedDmUser(selectedDmUser?._id === u._id ? null : u)
                    }
                  />
                  <div ref={clientSentinelRef} className="h-1" />
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
                        setSelectedDmUser(
                          selectedDmUser?._id === u._id ? null : u,
                        )
                      }
                    />
                  ))}
                  {userFilter === "clients" && (
                    <>
                      <div ref={clientSentinelRef} className="h-1" />
                      {isFetchingNextPage && (
                        <div className="flex justify-center py-1">
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
            <div className="flex justify-end">
              <Button
                className="w-[40%] bg-primary-blue"
                disabled={!selectedDmUser || createConversation.isPending}
                onClick={handleCreateDM}
                premium3D
              >
                {createConversation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Start Chat
              </Button>
            </div>


          </TabsContent>

          {/* Group Tab */}
          <TabsContent value="group" className="space-y-3 mt-3">
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

            {/* Selected users chips */}
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

            {/* Filter chips */}
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

            <div className="max-h-44 overflow-y-auto space-y-0.5 rounded-xl border border-border/40 p-1">
              {isLoading ? (
                <UserListSkeleton />
              ) : filteredOptions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  No people found
                </p>
              ) : userFilter === "all" ? (
                <>
                  <UserListWithSections
                    staffOptions={staffOptions.filter(
                      (u) =>
                        !search ||
                        u.displayName.toLowerCase().includes(search.toLowerCase()),
                    )}
                    clientOptions={clientOptions.filter(
                      (u) =>
                        !search ||
                        u.displayName.toLowerCase().includes(search.toLowerCase()),
                    )}
                    selectedId={null}
                    selectedIds={selectedGroupUsers.map((u) => u._id)}
                    onSelect={toggleGroupUser}
                  />
                  <div ref={clientSentinelRef} className="h-1" />
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
                  {userFilter === "clients" && (
                    <>
                      <div ref={clientSentinelRef} className="h-1" />
                      {isFetchingNextPage && (
                        <div className="flex justify-center py-1">
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </div>

            <div className="flex justify-end">
              <Button
                className="w-[40%] bg-primary-blue"
                disabled={
                  !groupName.trim() ||
                  selectedGroupUsers.length === 0 ||
                  createConversation.isPending
                }
                onClick={handleCreateGroup}
                premium3D
              >
                {createConversation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Create Group
              </Button>
            </div>

          </TabsContent>
        </Tabs>
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
