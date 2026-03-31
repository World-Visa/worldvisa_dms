"use client";

import React, { memo } from "react";
import { Button } from "@/components/ui/button";
import { Company } from "@/types/documents";
import type { ChecklistState } from "@/types/checklist";
import { RiBuilding4Line } from "react-icons/ri";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

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
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="default"
          size="sm"
          className="cursor-pointer whitespace-nowrap md:h-7 h-10 bg-blue-500 hover:bg-blue-600"
          onClick={onAddCompany}
        >
          <RiBuilding4Line className="size-3.75 text-white" />
          <span className="text-sm font-medium text-white">Add Company</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom" variant="default" size="2xs" className="rounded-md">
        <p>Add a company information to access company specific documents in your checklist</p>
      </TooltipContent>
      </Tooltip>
  );
});
