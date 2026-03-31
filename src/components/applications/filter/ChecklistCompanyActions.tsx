"use client";

import { AddCompanyButton } from "@/components/applications/filter/AddCompanyButton";
import type { ChecklistState } from "@/types/checklist";
import type { Company } from "@/types/documents";

interface ChecklistCompanyActionsProps {
  isClientView: boolean;
  checklistState: ChecklistState;
  hasCompanyDocuments: boolean;
  companies: Company[];
  maxCompanies: number;
  onAddCompany?: () => void;
}

export function ChecklistCompanyActions({
  isClientView,
  checklistState,
  hasCompanyDocuments,
  companies,
  maxCompanies,
  onAddCompany,
}: ChecklistCompanyActionsProps) {
  return (
    <>
      <AddCompanyButton
        checklistState={checklistState}
        isClientView={isClientView}
        hasCompanyDocuments={hasCompanyDocuments}
        companies={companies}
        maxCompanies={maxCompanies}
        onAddCompany={onAddCompany}
      />
    </>
  );
}

