"use client";

import React, { memo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save } from "lucide-react";
import type { ChecklistPageMode } from "./types";
import { useRouter } from "next/navigation";

interface ChecklistLayoutProps {
  applicationId: string;
  mode: ChecklistPageMode;
  isSaving: boolean;
  onCancel: () => void;
  onSave: () => void;
  children: React.ReactNode;
}

export const ChecklistLayout = memo(function ChecklistLayout({
  applicationId,
  mode,
  isSaving,
  onCancel,
  onSave,
  children,
}: ChecklistLayoutProps) {
  const router = useRouter();
  return (
    <div className="space-y-6">
      <div className="flex flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => router.back()}
            className="cursor-pointer rounded-full"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-medium text-foreground">Manage Checklist</h1>
        </div>

        <div className="flex items-center justify-end gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={onCancel}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={onSave}
            disabled={isSaving}
            className="gap-2 bg-primary-blue"
            premium3D={true}
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
