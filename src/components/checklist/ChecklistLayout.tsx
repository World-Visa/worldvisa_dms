"use client";

import React, { memo } from "react";
import { Button } from "@/components/ui/primitives/button";
import { Save } from "lucide-react";
import type { ChecklistPageMode } from "./types";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/primitives/breadcrumb";
interface ChecklistLayoutProps {
  applicationsListHref: string;
  applicationDetailsHref: string;
  applicationLabel: string;
  mode: ChecklistPageMode;
  isSaving: boolean;
  hasChanges: boolean;
  onSave: () => void;
  children: React.ReactNode;
}

export const ChecklistLayout = memo(function ChecklistLayout({
  applicationsListHref,
  applicationDetailsHref,
  applicationLabel,
  mode,
  isSaving,
  hasChanges,
  onSave,
  children,
}: ChecklistLayoutProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-row items-start justify-between gap-4">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <Breadcrumb>
            <BreadcrumbList className="flex-wrap">
              <BreadcrumbItem>
                <BreadcrumbLink href={applicationsListHref}>
                  Applications
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink
                  href={applicationDetailsHref}
                  transitionTypes={["nav-back"]}
                  className="max-w-[min(40vw,16rem)] truncate"
                >
                  {applicationLabel}
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Manage Checklist</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <div className="flex shrink-0 items-center justify-end gap-2">
          <Button
            size="xs"
            onClick={onSave}
            disabled={isSaving || !hasChanges}
            className="gap-2 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
            variant="primary"
            mode="gradient"
          >
            {isSaving ? (
              <>
                <span className="animate-spin rounded-full h-3 w-3 border-2 border-current border-t-transparent" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                {mode === "create"
                  ? "Save Checklist"
                  : "Save Checklist Changes"}
              </>
            )}
          </Button>
        </div>
      </div>

      {children}
    </div>
  );
});
