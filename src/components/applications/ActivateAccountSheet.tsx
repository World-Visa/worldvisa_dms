"use client";

import React, { useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Loader2, Eye, EyeOff, Check, X } from "lucide-react";
import {
  useCheckClientAccount,
  useUpdateClientAccount,
  useCreateClientAccount,
} from "@/hooks/useActivateAccount";
import type { CheckClientAccountResponseClient } from "@/lib/api/activateAccount";

const MIN_PHONE_DIGITS = 10;

function stripNonDigits(value: string): string {
  return value.replace(/\D/g, "");
}

function isPhoneValid(value: string): boolean {
  return stripNonDigits(value).length >= MIN_PHONE_DIGITS;
}

function getPhoneError(value: string): string | null {
  const digits = stripNonDigits(value);
  if (digits.length === 0) return null;
  if (digits.length < MIN_PHONE_DIGITS) {
    return `Phone must have at least ${MIN_PHONE_DIGITS} digits.`;
  }
  return null;
}

type Phase = "check" | "edit" | "create";

export interface ActivateAccountSheetApplication {
  id?: string;
  Name?: string;
  Email?: string;
  Phone?: string;
  Application_Handled_By?: string;
  Record_Type?: string;
}

interface ActivateAccountSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId: string;
  application?: ActivateAccountSheetApplication | null;
}

export function ActivateAccountSheet({
  open,
  onOpenChange,
  leadId,
  application,
}: ActivateAccountSheetProps) {
  const [phase, setPhase] = React.useState<Phase>("check");
  const [client, setClient] =
    React.useState<CheckClientAccountResponseClient | null>(null);
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [initialEmail, setInitialEmail] = React.useState("");
  const [initialPhone, setInitialPhone] = React.useState("");
  const [initialPassword, setInitialPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);

  const [createName, setCreateName] = React.useState("");
  const [createEmail, setCreateEmail] = React.useState("");
  const [createPhone, setCreatePhone] = React.useState("");
  const [createLeadOwner, setCreateLeadOwner] = React.useState("");
  const [createRecordType, setCreateRecordType] = React.useState("");
  const [createPassword, setCreatePassword] = React.useState("");
  const [createShowPassword, setCreateShowPassword] = React.useState(false);

  const prefillCreateForm = useCallback(() => {
    setCreateName(application?.Name ?? "");
    setCreateEmail(application?.Email ?? "");
    setCreatePhone(application?.Phone ?? "");
    setCreateLeadOwner(application?.Application_Handled_By ?? "");
    setCreateRecordType(application?.Record_Type ?? "");
    setCreatePassword("");
  }, [application]);

  const handleNotFound = useCallback(() => {
    prefillCreateForm();
    setPhase("create");
  }, [prefillCreateForm]);

  const checkMutation = useCheckClientAccount({
    onSuccess: (data) => {
      const c = data.data.client;
      setClient(c);
      setEmail(c.email);
      setPhone(c.phone);
      setPassword(c.password_value);
      setInitialEmail(c.email);
      setInitialPhone(c.phone);
      setInitialPassword(c.password_value);
      setPhase("edit");
    },
    onNotFound: handleNotFound,
  });

  const updateMutation = useUpdateClientAccount({
    onSuccess: () => {
      setInitialEmail(email);
      setInitialPhone(phone);
      setInitialPassword(password);
    },
  });

  const createMutation = useCreateClientAccount({
    onSuccess: () => {
      onOpenChange(false);
    },
  });

  useEffect(() => {
    if (!open) {
      setPhase("check");
      setClient(null);
      setEmail("");
      setPhone("");
      setPassword("");
      setInitialEmail("");
      setInitialPhone("");
      setInitialPassword("");
      setShowPassword(false);
      setCreateName("");
      setCreateEmail("");
      setCreatePhone("");
      setCreateLeadOwner("");
      setCreateRecordType("");
      setCreatePassword("");
      setCreateShowPassword(false);
    }
  }, [open]);

  useEffect(() => {
    if (phase === "create" && open && application) {
      prefillCreateForm();
    }
  }, [phase, open, application, prefillCreateForm]);

  const isCheckPending = checkMutation.isPending;
  const isUpdatePending = updateMutation.isPending;
  const isCreatePending = createMutation.isPending;

  const editPhoneValid = isPhoneValid(phone);
  const editPhoneError = getPhoneError(phone);
  const createPhoneValid = isPhoneValid(createPhone);
  const createPhoneError = getPhoneError(createPhone);

  const dirty = useMemo(
    () =>
      phase === "edit" &&
      (email !== initialEmail ||
        phone !== initialPhone ||
        password !== initialPassword),
    [
      phase,
      email,
      phone,
      password,
      initialEmail,
      initialPhone,
      initialPassword,
    ],
  );

  const createFormValid = useMemo(() => {
    if (!createName.trim() || !createEmail.trim() || !createPassword.trim())
      return false;
    if (!createPhoneValid) return false;
    return true;
  }, [createName, createEmail, createPhoneValid, createPassword]);

  const handleCheck = useCallback(() => {
    if (!leadId) return;
    checkMutation.mutate(leadId);
  }, [leadId, checkMutation]);

  const handleSave = useCallback(() => {
    if (!leadId || !dirty || !editPhoneValid) return;
    updateMutation.mutate({
      leadId,
      payload: { email, phone, password },
    });
  }, [leadId, dirty, editPhoneValid, email, phone, password, updateMutation]);

  const handleCreate = useCallback(() => {
    if (!createFormValid || !leadId || isCreatePending) return;
    createMutation.mutate({
      name: createName.trim(),
      email: createEmail.trim(),
      phone: createPhone.trim(),
      lead_id: leadId,
      lead_owner: createLeadOwner.trim(),
      record_type: createRecordType.trim(),
      password: createPassword,
    });
  }, [
    createFormValid,
    leadId,
    isCreatePending,
    createName,
    createEmail,
    createPhone,
    createLeadOwner,
    createRecordType,
    createPassword,
    createMutation,
  ]);

  const createDescription =
    phase === "check"
      ? "Verify that a client account exists for this lead."
      : phase === "edit"
        ? "View and update client account details. Save when you&apos;re done."
        : "Account not found. Create a new client account using the form below.";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Activate account</SheetTitle>
          <SheetDescription>{createDescription}</SheetDescription>
        </SheetHeader>

        <div className="grid flex-1 auto-rows-min gap-6 px-4 overflow-y-auto">
          {phase === "check" && (
            <div className="grid gap-3">
              <Label htmlFor="activate-account-lead-id">
                Lead ID (record ID)
              </Label>
              <Input
                id="activate-account-lead-id"
                value={leadId}
                readOnly
                disabled
                className="bg-muted"
              />
            </div>
          )}

          {phase === "edit" && client && (
            <>
              <div className="grid gap-3">
                <Label htmlFor="activate-account-name">Name</Label>
                <Input
                  id="activate-account-name"
                  value={client.name}
                  readOnly
                  disabled
                  className="bg-muted"
                />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="activate-account-email">Email</Label>
                <Input
                  id="activate-account-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  disabled={isUpdatePending}
                />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="activate-account-phone">Phone</Label>
                <Input
                  id="activate-account-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Phone"
                  disabled={isUpdatePending}
                  className={editPhoneError ? "border-destructive" : ""}
                />
                {editPhoneError && (
                  <p className="text-sm text-destructive" role="alert">
                    {editPhoneError}
                  </p>
                )}
              </div>
              <div className="grid gap-3">
                <Label htmlFor="activate-account-password">Password</Label>
                <div className="relative">
                  <Input
                    id="activate-account-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    disabled={isUpdatePending}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isUpdatePending}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              {client.accountStatus && (
                <div className="grid gap-2">
                  <Label>Account status</Label>
                  <div className="flex flex-wrap gap-2">
                    <Badge
                      variant="outline"
                      className={
                        client.accountStatus.emailValid
                          ? "bg-green-500/10 text-green-700 border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-800"
                          : "bg-red-500/10 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-800"
                      }
                    >
                      {client.accountStatus.emailValid ? (
                        <Check className="h-3 w-3 mr-1" />
                      ) : (
                        <X className="h-3 w-3 mr-1" />
                      )}
                      Email valid
                    </Badge>
                    <Badge
                      variant="outline"
                      className={
                        client.accountStatus.phoneValid
                          ? "bg-green-500/10 text-green-700 border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-800"
                          : "bg-red-500/10 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-800"
                      }
                    >
                      {client.accountStatus.phoneValid ? (
                        <Check className="h-3 w-3 mr-1" />
                      ) : (
                        <X className="h-3 w-3 mr-1" />
                      )}
                      Phone valid
                    </Badge>
                    <Badge
                      variant="outline"
                      className={
                        client.accountStatus.emailExists
                          ? "bg-green-500/10 text-green-700 border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-800"
                          : "bg-red-500/10 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-800"
                      }
                    >
                      {client.accountStatus.emailExists ? (
                        <Check className="h-3 w-3 mr-1" />
                      ) : (
                        <X className="h-3 w-3 mr-1" />
                      )}
                      Email exists
                    </Badge>
                    <Badge
                      variant="outline"
                      className={
                        client.accountStatus.phoneExists
                          ? "bg-green-500/10 text-green-700 border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-800"
                          : "bg-red-500/10 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-800"
                      }
                    >
                      {client.accountStatus.phoneExists ? (
                        <Check className="h-3 w-3 mr-1" />
                      ) : (
                        <X className="h-3 w-3 mr-1" />
                      )}
                      Phone exists
                    </Badge>
                  </div>
                </div>
              )}
            </>
          )}

          {phase === "create" && (
            <>
              <div className="grid gap-3">
                <Label htmlFor="create-account-name">Name</Label>
                <Input
                  id="create-account-name"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  placeholder="Name"
                  disabled={isCreatePending}
                />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="create-account-email">Email</Label>
                <Input
                  id="create-account-email"
                  type="email"
                  value={createEmail}
                  onChange={(e) => setCreateEmail(e.target.value)}
                  placeholder="Email"
                  disabled={isCreatePending}
                />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="create-account-phone">Phone</Label>
                <Input
                  id="create-account-phone"
                  type="tel"
                  value={createPhone}
                  onChange={(e) => setCreatePhone(e.target.value)}
                  placeholder="Phone"
                  disabled={isCreatePending}
                  className={createPhoneError ? "border-destructive" : ""}
                />
                {createPhoneError && (
                  <p className="text-sm text-destructive" role="alert">
                    {createPhoneError}
                  </p>
                )}
              </div>
              <div className="grid gap-3">
                <Label htmlFor="create-account-lead-id">Lead ID</Label>
                <Input
                  id="create-account-lead-id"
                  value={leadId}
                  readOnly
                  disabled
                  className="bg-muted"
                />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="create-account-lead-owner">Lead owner</Label>
                <Input
                  id="create-account-lead-owner"
                  value={createLeadOwner}
                  onChange={(e) => setCreateLeadOwner(e.target.value)}
                  placeholder="Lead owner"
                  disabled={isCreatePending}
                />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="create-account-record-type">Record type</Label>
                <Input
                  id="create-account-record-type"
                  value={createRecordType}
                  onChange={(e) => setCreateRecordType(e.target.value)}
                  placeholder="Record type"
                  disabled={isCreatePending}
                />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="create-account-password">Password</Label>
                <div className="relative">
                  <Input
                    id="create-account-password"
                    type={createShowPassword ? "text" : "password"}
                    value={createPassword}
                    onChange={(e) => setCreatePassword(e.target.value)}
                    placeholder="Password"
                    disabled={isCreatePending}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setCreateShowPassword(!createShowPassword)}
                    disabled={isCreatePending}
                  >
                    {createShowPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>

        <SheetFooter className="flex-row gap-2 sm:gap-2">
          {phase === "check" && (
            <>
              <Button
                onClick={handleCheck}
                disabled={!leadId || isCheckPending}
                className="flex items-center gap-2"
              >
                {isCheckPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Checking...
                  </>
                ) : (
                  "Check account exist"
                )}
              </Button>
              <SheetClose asChild>
                <Button variant="outline">Close</Button>
              </SheetClose>
            </>
          )}
          {phase === "edit" && (
            <>
              <Button
                onClick={handleSave}
                disabled={!dirty || !editPhoneValid || isUpdatePending}
                className="flex items-center gap-2"
              >
                {isUpdatePending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save changes"
                )}
              </Button>
              <SheetClose asChild>
                <Button variant="outline">Close</Button>
              </SheetClose>
            </>
          )}
          {phase === "create" && (
            <>
              <Button
                onClick={handleCreate}
                disabled={!createFormValid || isCreatePending}
                className="flex items-center gap-2"
              >
                {isCreatePending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create account"
                )}
              </Button>
              <SheetClose asChild>
                <Button variant="outline">Close</Button>
              </SheetClose>
            </>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
