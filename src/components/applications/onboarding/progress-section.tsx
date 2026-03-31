"use client";

import { motion } from "motion/react";
import {
  RiArrowRightDoubleFill,
  RiCheckLine,
  RiLoader3Line,
  RiMailCloseLine,
  RiMailSendLine,
  RiUserAddLine,
} from "react-icons/ri";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PointingArrow } from "@/components/icons/pointing-arrows";
import { useInviteClient, useRevokeClientInvitation } from "@/hooks/useUserMutations";
import { useCreateClientAccount } from "@/hooks/useActivateAccount";
import { useOnboardingSteps, type StepStatus } from "@/hooks/use-onboarding-steps";
import type { Application, ApplicationOnboarding } from "@/types/applications";
import { cn } from "@/lib/utils";

interface ProgressSectionProps {
  applicationId: string;
  application: Application | null | undefined;
  onboarding: ApplicationOnboarding;
}

interface StepActionProps {
  stepId: "account-creation" | "portal-invite";
  status: StepStatus;
  accountComplete: boolean;
  isCreateLoading: boolean;
  isInviteLoading: boolean;
  isRevokeLoading: boolean;
  invitationId: string | null;
  onActivate: () => void;
  onInvite: () => void;
  onRevoke: () => void;
}

function StepIndicator({ status, isLoading }: { status: StepStatus; isLoading?: boolean }) {
  if (isLoading) {
    return (
      <div className="flex h-6 w-6 min-w-6 items-center justify-center rounded-full bg-blue-100">
        <RiLoader3Line className="h-3.5 w-3.5 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (status === "completed") {
    return (
      <div className="flex h-6 w-6 min-w-6 items-center justify-center rounded-full bg-emerald-500 animate-check-pop">
        <RiCheckLine className="h-3.5 w-3.5 text-white" />
      </div>
    );
  }

  if (status === "in-progress") {
    return (
      <div className="flex h-6 w-6 min-w-6 items-center justify-center rounded-full border-2 border-amber-300 bg-amber-50">
        <div className="w-2 h-2 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
      </div>
    );
  }

  return <div className="flex h-6 w-6 min-w-6 rounded-full border-2 border-neutral-200 bg-white" />;
}

function StepAction({
  stepId,
  status,
  accountComplete,
  isCreateLoading,
  isInviteLoading,
  isRevokeLoading,
  invitationId,
  onActivate,
  onInvite,
  onRevoke,
}: StepActionProps) {
  if (status === "completed") return null;

  if (stepId === "account-creation" && status === "pending") {
    return (
      <Button
        size="sm"
        variant="outline"
        className="mt-2 h-7 text-xs gap-1.5"
        onClick={onActivate}
        disabled={isCreateLoading}
      >
        {isCreateLoading ? (
          <RiLoader3Line className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <RiUserAddLine className="w-3.5 h-3.5" />
        )}
        Create Account
      </Button>
    );
  }

  if (stepId === "portal-invite") {
    if (status === "in-progress" && invitationId) {
      return (
        <Button
          size="sm"
          variant="outline"
          className="mt-2 h-7 text-xs gap-1.5 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
          onClick={onRevoke}
          disabled={isRevokeLoading}
        >
          {isRevokeLoading ? (
            <RiLoader3Line className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <RiMailCloseLine className="w-3.5 h-3.5" />
          )}
          Revoke Invitation
        </Button>
      );
    }

    if (status === "pending" && accountComplete) {
      return (
        <Button
          size="sm"
          variant="outline"
          className="mt-2 h-7 text-xs gap-1.5"
          onClick={onInvite}
          disabled={isInviteLoading}
        >
          {isInviteLoading ? (
            <RiLoader3Line className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <RiMailSendLine className="w-3.5 h-3.5" />
          )}
          Send Invite
        </Button>
      );
    }
  }

  return null;
}

function WelcomeHeader() {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="flex w-full grow flex-col items-start justify-between gap-2 rounded-t-xl bg-[#FBFBFB] p-4 md:max-w-[400px] md:rounded-l-xl md:rounded-tr-none md:p-6"
    >
      <div className="flex w-full flex-col gap-6">
        <motion.h2
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
          className="text-xl font-semibold text-foreground"
        >
          You&apos;re doing great work! 💪
        </motion.h2>

        <div className="flex flex-col gap-3 text-base text-muted-foreground">
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
          >
            Get your client set up on the DMS portal in just a few steps.
          </motion.p>
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
            className="hidden md:block"
          >
            Once onboarded, they can upload documents, track progress, and communicate directly.
          </motion.p>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4, ease: "easeOut" }}
        className="hidden items-center gap-0 md:flex"
      >
        <p className="text-base text-foreground">Get started with our setup guide.</p>
        <PointingArrow className="relative left-[15px] top-[-10px]" />
      </motion.div>
    </motion.div>
  );
}

export function ProgressSection({ applicationId, application, onboarding }: ProgressSectionProps) {
  const queryClient = useQueryClient();
  const { steps } = useOnboardingSteps(onboarding);
  const createAccount = useCreateClientAccount();
  const inviteClient = useInviteClient();
  const revokeInvitation = useRevokeClientInvitation();

  const accountComplete = steps[0]?.status === "completed";

  const handleCreate = () => {
    if (!application?.Email) return;
    createAccount.mutate(
      {
        name: application.Name ?? "",
        email: application.Email,
        phone: application.Phone ?? "",
        lead_id: applicationId,
        lead_owner: application.Application_Handled_By ?? "",
        record_type: application.Record_Type ?? "",
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["application", applicationId] });
        },
      },
    );
  };

  const handleInvite = () => {
    if (!application?.Email) return;
    inviteClient.mutate(application.Email, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["application", applicationId] });
      },
    });
  };

  const handleRevoke = () => {
    if (!onboarding.clerk_invitation_id) return;
    revokeInvitation.mutate(
      { invitationId: onboarding.clerk_invitation_id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["application", applicationId] });
        },
      },
    );
  };

  return (
    <Card className="relative flex items-stretch rounded-xl border-neutral-100 shadow-none w-full flex-col md:flex-row overflow-hidden">
      <WelcomeHeader />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.2, ease: "easeOut" }}
        className="flex flex-1 flex-col gap-5 p-5 md:p-8"
      >
        {steps.map((step, index) => {
          const isCreateLoading = step.id === "account-creation" && createAccount.isPending;
          const isInviteLoading = step.id === "portal-invite" && inviteClient.isPending;
          const isRevokeLoading = step.id === "portal-invite" && revokeInvitation.isPending;

          return (
            <motion.div
              key={`${step.id}-${step.status}`}
              className="flex w-full items-center gap-1.5 md:max-w-[370px]"
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.25 + index * 0.08, ease: "easeOut" }}
            >
              <StepIndicator
                key={`indicator-${step.id}-${step.status}`}
                status={step.status}
                isLoading={isCreateLoading || isInviteLoading || isRevokeLoading}
              />

              <Card
                className={cn(
                  "shadow-xs w-full p-1",
                  step.status !== "completed" && "transition-all duration-200 hover:translate-x-px hover:shadow-md",
                )}
              >
                <CardContent className="flex flex-col rounded-[6px] bg-[#FBFBFB] px-3 py-3">
                  <div className="flex items-center justify-between">
                    <span
                      className={cn(
                        "text-xs",
                        step.status === "completed"
                          ? "text-muted-foreground line-through"
                          : "text-foreground",
                      )}
                    >
                      {step.title}
                    </span>
                    <RiArrowRightDoubleFill className="h-4 w-4 text-muted-foreground shrink-0" />
                  </div>
                  <p className="text-xs leading-[16px] text-muted-foreground mt-1">
                    {step.description}
                  </p>
                  <StepAction
                    stepId={step.id}
                    status={step.status}
                    accountComplete={accountComplete}
                    isCreateLoading={isCreateLoading}
                    isInviteLoading={isInviteLoading}
                    isRevokeLoading={isRevokeLoading}
                    invitationId={onboarding.clerk_invitation_id}
                    onActivate={handleCreate}
                    onInvite={handleInvite}
                    onRevoke={handleRevoke}
                  />
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>
    </Card>
  );
}
