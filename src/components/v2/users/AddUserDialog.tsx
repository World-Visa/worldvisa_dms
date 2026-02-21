"use client";

import * as React from "react";
import { Eye, EyeOff, UserPlus } from "lucide-react";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateUser } from "@/hooks/useUserMutations";

const ROLE_OPTIONS = [
  { value: "master_admin", label: "Master Admin" },
  { value: "admin", label: "Admin" },
  { value: "team_leader", label: "Team Leader" },
  { value: "supervisor", label: "Supervisor" },
] as const;

export function AddUserDialog() {
  const [open, setOpen] = React.useState(false);
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [role, setRole] = React.useState("admin");
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);

  const { mutate: createUser, isPending } = useCreateUser();

  const passwordMismatch = password.length > 0 && confirmPassword.length > 0 && password !== confirmPassword;
  const isFormValid =
    username.trim().length > 0 &&
    password.length > 0 &&
    confirmPassword.length > 0 &&
    password === confirmPassword &&
    role.length > 0;

  const handleReset = () => {
    setUsername("");
    setPassword("");
    setConfirmPassword("");
    setRole("admin");
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    createUser(
      { username: username.trim(), password, role },
      {
        onSuccess: () => {
          setOpen(false);
          handleReset();
        },
      },
    );
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) handleReset();
    setOpen(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-primary-blue" premium3D>
          <UserPlus className="size-4" />
          Add New User
        </Button>
      </DialogTrigger>
      <DialogContent className="flex max-h-[90vh] flex-col gap-0 p-0 sm:max-w-md">
        <DialogHeader className="shrink-0 border-b px-6 pb-4 pt-6">
          <DialogTitle className="text-lg font-semibold">Add New User</DialogTitle>
          <DialogDescription>
            Create a new user account.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
            <div className="space-y-2">
              <Label htmlFor="new-username">Username</Label>
              <Input
                id="new-username"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isPending}
                autoComplete="off"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-password">Password</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isPending}
                  className="pr-10"
                  autoComplete="new-password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 size-full max-w-10 hover:bg-transparent"
                  onClick={() => setShowPassword((v) => !v)}
                  disabled={isPending}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-confirm-password">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="new-confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm password"
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
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  disabled={isPending}
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </Button>
              </div>
              {passwordMismatch && (
                <p className="text-destructive text-sm">Passwords do not match.</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-role">Role</Label>
              <Select value={role} onValueChange={setRole} disabled={isPending}>
                <SelectTrigger id="new-role" className="w-full">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              {isPending ? "Creating..." : "Create User"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
