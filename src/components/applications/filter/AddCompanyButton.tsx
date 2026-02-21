"use client";

import React, { memo } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Company } from "@/types/documents";
import type { ChecklistState } from "@/types/checklist";

interface AddCompanyButtonProps {
  checklistState: ChecklistState;
  isClientView: boolean;
  hasCompanyDocuments: boolean;
  companies: Company[];
  maxCompanies: number;
  onAddCompany?: () => void;
}

export const AddCompanyButton = memo(function AddCompanyButton({
  checklistState,
  isClientView,
  hasCompanyDocuments,
  companies,
  maxCompanies,
  onAddCompany,
}: AddCompanyButtonProps) {
  const shouldShow =
    (checklistState === "saved" || isClientView) &&
    hasCompanyDocuments &&
    companies.length < maxCompanies;

  if (!shouldShow) return null;

  return (
    <Button
      variant="default"
      size="sm"
      onClick={onAddCompany}
      className="bg-primary-blue"
    >
      <Plus className="h-4 w-4" />
      <span>Add Company</span>
    </Button>
  );
});
