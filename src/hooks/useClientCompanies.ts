import { useState, useEffect, useMemo } from "react";
import { Company } from "@/types/documents";
import { parseCompaniesFromDocuments } from "@/utils/companyParsing";

interface UseClientCompaniesProps {
  allDocuments: Array<{ document_category?: string }> | undefined;
}

/**
 * Hook to manage company state and parsing from documents
 * Handles company parsing, state management, and add/remove operations
 */
export function useClientCompanies({ allDocuments }: UseClientCompaniesProps) {
  const [companies, setCompanies] = useState<Company[]>([]);

  // Parse companies from documents when documents change
  useEffect(() => {
    if (allDocuments && allDocuments.length > 0) {
      const parsedCompanies = parseCompaniesFromDocuments(allDocuments);

      // Update companies state with parsed data
      if (parsedCompanies.length > 0) {
        setCompanies(parsedCompanies);
      }
    }
  }, [allDocuments]);

  // Extract companies from documents API response, but prioritize actual company data
  const finalCompanies = useMemo(() => {
    const companyCategories = new Set<string>();
    if (allDocuments && allDocuments.length > 0) {
      allDocuments.forEach((doc) => {
        if (
          doc.document_category &&
          doc.document_category.includes("Company Documents")
        ) {
          companyCategories.add(doc.document_category);
        }
      });
    }

    // Always include companies from the companies state (which have correct dates and descriptions)
    const existingCompanies = companies || [];

    // If we have companies from state, use them (regardless of whether they have documents)
    if (existingCompanies.length > 0) {
      return existingCompanies;
    }

    if (companyCategories.size > 0) {
      return parseCompaniesFromDocuments(allDocuments || []);
    }

    return [];
  }, [allDocuments, companies]);

  const handleAddCompany = (company: Company) => {
    setCompanies((prev) => [...prev, company]);
  };

  const handleRemoveCompany = (companyName: string) => {
    setCompanies((prev) =>
      prev.filter(
        (company) => company.name.toLowerCase() !== companyName.toLowerCase(),
      ),
    );
  };

  return {
    companies: finalCompanies,
    handleAddCompany,
    handleRemoveCompany,
  };
}
