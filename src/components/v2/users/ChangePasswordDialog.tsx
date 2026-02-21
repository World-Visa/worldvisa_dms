"use client";

import * as React from "react";
import { Eye, EyeOff, KeyRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useResetUserPassword } from "@/hooks/useUserMutations";

interface ChangePasswordDialogProps {
  username: string;
}

export function ChangePasswordDialog({ username }: ChangePasswordDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [showNew, setShowNew] = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);

  const { mutate: resetPassword, isPending } = useResetUserPassword();

  const passwordMismatch =
    newPassword.length > 0 && confirmPassword.length > 0 && newPassword !== confirmPassword;
  const isFormValid =
    newPassword.length >= 6 && confirmPassword.length > 0 && newPassword === confirmPassword;

  const handleReset = () => {
    setNewPassword("");
    setConfirmPassword("");
    setShowNew(false);
    setShowConfirm(false);
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) handleReset();
    setOpen(next);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;
    resetPassword(
      { username, newPassword },
      { onSuccess: () => { setOpen(false); handleReset(); } },
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full gap-2">
          <KeyRound className="size-4" />
          Change Password
        </Button>
      </DialogTrigger>
      <DialogContent className="flex max-h-[90vh] flex-col gap-0 p-0 sm:max-w-sm">
        <DialogHeader className="shrink-0 border-b px-6 pb-4 pt-6">
          <DialogTitle className="text-lg font-semibold">Change Password</DialogTitle>
          <DialogDescription>
            Set a new password for <span className="font-medium text-foreground capitalize">{username}</span>.
            Minimum 6 characters.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
            <div className="space-y-2">
              <Label htmlFor="cp-new">New Password</Label>
              <div className="relative">
                <Input
                  id="cp-new"
                  type={showNew ? "text" : "password"}
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={isPending}
                  className="pr-10"
                  autoComplete="new-password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 size-full max-w-10 hover:bg-transparent"
                  onClick={() => setShowNew((v) => !v)}
                  disabled={isPending}
                  tabIndex={-1}
                >
                  {showNew ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </Button>
              </div>
              {newPassword.length > 0 && newPassword.length < 6 && (
                <p className="text-muted-foreground text-xs">At least 6 characters required.</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="cp-confirm">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="cp-confirm"
                  type={showConfirm ? "text" : "password"}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isPending}
                  className={passwordMismatch ? "border-destructive pr-10" : "pr-10"}
                  autoComplete="new-password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 size-full max-w-10 hover:bg-transparent"
                  onClick={() => setShowConfirm((v) => !v)}
                  disabled={isPending}
                  tabIndex={-1}
                >
                  {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </Button>
              </div>
              {passwordMismatch && (
                <p className="text-destructive text-sm">Passwords do not match.</p>
              )}
            </div>
          </div>

          <DialogFooter className="shrink-0 border-t px-6 pb-6 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!isFormValid || isPending}>
              {isPending ? "Saving..." : "Save Password"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
