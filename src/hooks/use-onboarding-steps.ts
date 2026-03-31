import { useMemo } from "react";
import type { ApplicationOnboarding } from "@/types/applications";

export type StepStatus = "completed" | "in-progress" | "pending";

export interface OnboardingStep {
  id: "account-creation" | "portal-invite";
  title: string;
  description: string;
  status: StepStatus;
}

export interface OnboardingStepsResult {
  steps: OnboardingStep[];
  totalSteps: number;
  completedSteps: number;
  isFullyOnboarded: boolean;
}

export function useOnboardingSteps(
  data: ApplicationOnboarding | null | undefined,
): OnboardingStepsResult {
  const steps = useMemo((): OnboardingStep[] => {
    const accountStatus: StepStatus = data?.client_record_exists
      ? "completed"
      : "pending";

    let inviteStatus: StepStatus;
    if (data?.clerk_id) {
      inviteStatus = "completed";
    } else if (data?.clerk_invitation_id) {
      inviteStatus = "in-progress"; // invite sent, not yet accepted
    } else {
      inviteStatus = "pending";
    }

    const inviteDescription =
      data?.clerk_invitation_id && !data?.clerk_id
        ? "Invitation sent — awaiting client acceptance."
        : "Send the client an invitation to access the DMS portal.";

    return [
      {
        id: "account-creation",
        title: "Create DMS Account",
        description: "Set up a DMS account for this client.",
        status: accountStatus,
      },
      {
        id: "portal-invite",
        title: "Invite to Portal",
        description: inviteDescription,
        status: inviteStatus,
      },
    ];
  }, [data]);

  const completedSteps = steps.filter((s) => s.status === "completed").length;

  return {
    steps,
    totalSteps: steps.length,
    completedSteps,
    isFullyOnboarded: completedSteps === steps.length,
  };
}
