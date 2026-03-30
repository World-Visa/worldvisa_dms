"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X, SendIcon } from "lucide-react";
import { FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { DialogOverlay, DialogPortal } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useInviteUser, checkAvailability } from "@/hooks/useUserMutations";
import { ROLE_OPTIONS } from "@/lib/constants/users";
import { PlusIcon } from "@radix-ui/react-icons";

interface FieldErrors {
  username?: string;
  email?: string;
}

export function InviteUserModal() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [role, setRole] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [checking, setChecking] = useState<{ username?: boolean; email?: boolean }>({});
  const { mutate: inviteUser, isPending } = useInviteUser();

  const resetForm = () => {
    setEmail("");
    setUsername("");
    setRole("");
    setFieldErrors({});
    setChecking({});
  };

  const handleBlurEmail = async () => {
    if (!email) return;
    setChecking((c) => ({ ...c, email: true }));
    try {
      const result = await checkAvailability({ email });
      setFieldErrors((prev) => ({
        ...prev,
        email: result.email ? "Email is already registered." : undefined,
      }));
    } finally {
      setChecking((c) => ({ ...c, email: false }));
    }
  };

  const handleBlurUsername = async () => {
    if (!username) return;
    setChecking((c) => ({ ...c, username: true }));
    try {
      const result = await checkAvailability({ username });
      setFieldErrors((prev) => ({
        ...prev,
        username: result.username ? "Username is already taken." : undefined,
      }));
    } finally {
      setChecking((c) => ({ ...c, username: false }));
    }
  };

  const hasErrors = Boolean(fieldErrors.username || fieldErrors.email);
  const isChecking = Boolean(checking.username || checking.email);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!email || !username || !role || hasErrors || isChecking) return;
    inviteUser(
      { email, role, username },
      {
        onSuccess: () => {
          setOpen(false);
          resetForm();
        },
      },
    );
  };

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) resetForm();
  };

  return (
    <>
      <Button onClick={() => setOpen(true)} premium3D>
        <PlusIcon className="size-4" />
        Invite
      </Button>

      <DialogPrimitive.Root open={open} onOpenChange={handleOpenChange}>
        <DialogPortal>
          <DialogOverlay />
          <DialogPrimitive.Content
            className={cn(
              "fixed top-[50%] left-[50%] z-50 flex w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] flex-col overflow-hidden rounded-2xl border bg-background shadow-2xl sm:max-w-[480px]",
              "data-[state=open]:animate-in data-[state=closed]:animate-out",
              "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
              "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 duration-200",
            )}
          >
            {/* ── Header ─────────────────────────────────── */}
            <div className="flex items-center gap-3 border-b px-4 py-4">
              <DialogPrimitive.Close
                aria-label="Close"
                className="flex size-8 items-center justify-center rounded-full transition-colors hover:bg-accent"
              >
                <X className="size-4" />
              </DialogPrimitive.Close>

              <DialogPrimitive.Title className="flex-1 text-center text-base font-semibold">
                Invite a team member
              </DialogPrimitive.Title>

              {/* balance spacer */}
              <div className="size-8" aria-hidden />
            </div>

            {/* ── Body ───────────────────────────────────── */}
            <form id="invite-form" onSubmit={handleSubmit}>
              <div className="space-y-5 px-6 py-6">
                <div className="space-y-2">
                  <Label htmlFor="invite-email">Email address</Label>
                  <Input
                    id="invite-email"
                    type="email"
                    placeholder="colleague@example.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (fieldErrors.email) {
                        setFieldErrors((prev) => ({ ...prev, email: undefined }));
                      }
                    }}
                    onBlur={handleBlurEmail}
                    required
                    autoComplete="off"
                    className={cn(
                      "h-11",
                      fieldErrors.email && "border-destructive focus-visible:ring-destructive",
                    )}
                  />
                  {fieldErrors.email && (
                    <p className="text-destructive text-xs">{fieldErrors.email}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="invite-username">Username</Label>
                  <Input
                    id="invite-username"
                    type="text"
                    placeholder="e.g. tanushree"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      if (fieldErrors.username) {
                        setFieldErrors((prev) => ({ ...prev, username: undefined }));
                      }
                    }}
                    onBlur={handleBlurUsername}
                    required
                    autoComplete="off"
                    className={cn(
                      "h-11",
                      fieldErrors.username && "border-destructive focus-visible:ring-destructive",
                    )}
                  />
                  {fieldErrors.username && (
                    <p className="text-destructive text-xs">{fieldErrors.username}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="invite-role">Role</Label>
                  <Select value={role} onValueChange={setRole}>
                    <SelectTrigger id="invite-role" className="h-11 w-full">
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLE_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          <div className="flex flex-col py-0.5">
                            <span>{opt.label}</span>
                            <span className="text-muted-foreground text-xs">
                              {opt.description}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </form>

            {/* ── Footer ─────────────────────────────────── */}
            <div className="flex items-center justify-between border-t px-6 py-4">
              <p className="text-muted-foreground text-xs">
                An email invite will be sent to the recipient.
              </p>
              <Button
                type="submit"
                form="invite-form"
                disabled={isPending || isChecking || !email || !username || !role || hasErrors}
                className="min-w-[148px] gap-2"
                premium3D
              >
                <SendIcon className="size-3.5" />
                {isPending ? "Sending…" : isChecking ? "Checking…" : "Send invitation"}
              </Button>
            </div>
          </DialogPrimitive.Content>
        </DialogPortal>
      </DialogPrimitive.Root>
    </>
  );
}
