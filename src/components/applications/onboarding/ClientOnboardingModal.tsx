"use client";

import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ProgressSection } from "./progress-section";
import type { Application, ApplicationOnboarding } from "@/types/applications";

interface ClientOnboardingModalProps {
  applicationId: string;
  application: Application | null | undefined;
  onboarding: ApplicationOnboarding;
  isSpouseApplication?: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ClientOnboardingModal({
  applicationId,
  application,
  onboarding,
  isSpouseApplication = false,
  open,
  onOpenChange,
}: ClientOnboardingModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] min-h-[420px] p-0 overflow-hidden rounded-xl">
        <VisuallyHidden>
          <DialogTitle>Client Onboarding</DialogTitle>
        </VisuallyHidden>
        <ProgressSection
          applicationId={applicationId}
          application={application}
          onboarding={onboarding}
          isSpouseApplication={isSpouseApplication}
        />
      </DialogContent>
    </Dialog>
  );
}
