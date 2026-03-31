import { useState, useEffect, useCallback } from "react";
import { localStorageUtils } from "@/lib/localStorage";
import { parseCompaniesFromDocuments } from "@/utils/companyParsing";
import type { DocumentCategory } from "@/types/documents";
import type { Company } from "@/types/documents";
import type { Document } from "@/types/applications";
import { useChecklistURLState } from "@/lib/urlState";

const DEFAULT_CATEGORY: DocumentCategory = "submitted";
const INVALID_STORED_CATEGORY_VALUES = new Set(["", "null", "undefined"]);

function normalizeSelectedCategory(
  category: DocumentCategory | null | undefined,
  urlCategory: DocumentCategory | undefined,
): DocumentCategory {
  if (urlCategory) {
    return urlCategory;
  }

  if (typeof category !== "string") {
    return DEFAULT_CATEGORY;
  }

  const normalizedCategory = category.trim();
  if (
    !normalizedCategory ||
    INVALID_STORED_CATEGORY_VALUES.has(normalizedCategory.toLowerCase())
  ) {
    return DEFAULT_CATEGORY;
  }

  // "all" was previously used as a legacy default and can incorrectly open
  // checklist tables for old applications. Default to submitted instead.
  if (normalizedCategory === "all") {
    return DEFAULT_CATEGORY;
  }

  return normalizedCategory as DocumentCategory;
}

interface UseApplicationStateProps {
  applicationId: string;
  urlCategory: DocumentCategory | undefined;
  allDocuments: Document[] | undefined;
}

export function useApplicationState({
  applicationId,
  urlCategory,
  allDocuments,
}: UseApplicationStateProps) {
  const { setCategory: setURLCategory } = useChecklistURLState(applicationId);

  // Document category state
  const [selectedCategory, setSelectedCategory] = useState<DocumentCategory>(() =>
    urlCategory ?? DEFAULT_CATEGORY,
  );

  // Companies state
  const [companies, setCompanies] = useState<Company[]>(() => {
    const savedCompanies = localStorageUtils.loadCompanies(applicationId, []);
    return savedCompanies;
  });

  // Sync URL category with local state
  useEffect(() => {
    if (urlCategory && urlCategory !== selectedCategory) {
      setSelectedCategory(urlCategory as DocumentCategory);
      localStorageUtils.saveCategory(applicationId, urlCategory);
    }
  }, [urlCategory, selectedCategory, applicationId]);

  // Hydrate category from localStorage after mount to avoid SSR/client mismatch
  useEffect(() => {
    if (urlCategory) {
      return;
    }

    const savedCategory = localStorageUtils.loadCategory(
      applicationId,
      DEFAULT_CATEGORY,
    ) as DocumentCategory;
    const normalizedCategory = normalizeSelectedCategory(savedCategory, undefined);

    setSelectedCategory((prevCategory) =>
      prevCategory === normalizedCategory ? prevCategory : normalizedCategory,
    );

    if (normalizedCategory !== savedCategory) {
      localStorageUtils.saveCategory(applicationId, normalizedCategory);
    }
  }, [applicationId, urlCategory]);

  useEffect(() => {
    if (allDocuments && allDocuments.length > 0) {
      const parsedCompanies = parseCompaniesFromDocuments(allDocuments);
      if (parsedCompanies.length > 0) {
        setCompanies((prevCompanies) => {
          const existingCompaniesMap = new Map(
            prevCompanies.map((c) => [c.name.toLowerCase(), c]),
          );

          const isDefaultDate = (date: string | null): boolean => {
            if (!date) return false;
            return (
              date === "2024-01-01" ||
              date === "2025-12-31" ||
              date === "2024-01" ||
              date === "2025-12"
            );
          };

          const mergedCompanies = [...prevCompanies];

          parsedCompanies.forEach((parsedCompany) => {
            const existingCompany = existingCompaniesMap.get(
              parsedCompany.name.toLowerCase(),
            );

            if (existingCompany) {
              const existingHasDefaultDates =
                isDefaultDate(existingCompany.fromDate) ||
                isDefaultDate(existingCompany.toDate);
              const parsedHasValidDates =
                !isDefaultDate(parsedCompany.fromDate) &&
                parsedCompany.fromDate !== null;

              if (existingHasDefaultDates && parsedHasValidDates) {
                const index = mergedCompanies.findIndex(
                  (c) =>
                    c.name.toLowerCase() === parsedCompany.name.toLowerCase(),
                );
                if (index !== -1) {
                  mergedCompanies[index] = {
                    ...mergedCompanies[index],
                    fromDate: parsedCompany.fromDate,
                    toDate: parsedCompany.toDate,
                    isCurrentEmployment: parsedCompany.isCurrentEmployment,
                    description:
                      parsedCompany.description ||
                      mergedCompanies[index].description,
                  };
                }
              }
            } else {
              if (
                !isDefaultDate(parsedCompany.fromDate) &&
                parsedCompany.fromDate !== null
              ) {
                mergedCompanies.push(parsedCompany);
              }
            }
          });

          localStorageUtils.saveCompanies(applicationId, mergedCompanies);

          return mergedCompanies;
        });
      }
    }
  }, [allDocuments, applicationId]);

  // Memoized handlers
  const handleCategoryChange = useCallback(
    (category: DocumentCategory) => {
      if (category === selectedCategory) {
        return;
      }
      setSelectedCategory(category);
      setURLCategory(category);
      localStorageUtils.saveCategory(applicationId, category);
    },
    [applicationId, selectedCategory, setURLCategory],
  );

  const handleAddCompany = useCallback(
    (company: Company) => {
      setCompanies((prevCompanies) => {
        const newCompanies = [...prevCompanies, company];
        localStorageUtils.saveCompanies(applicationId, newCompanies);
        return newCompanies;
      });
    },
    [applicationId],
  );

  const handleRemoveCompany = useCallback(
    (companyName: string) => {
      setCompanies((prevCompanies) => {
        const newCompanies = prevCompanies.filter(
          (company) => company.name.toLowerCase() !== companyName.toLowerCase(),
        );
        localStorageUtils.saveCompanies(applicationId, newCompanies);

        // Reset category if it was a company category
        if (selectedCategory === `company-${companyName}`) {
          setSelectedCategory("all");
          setURLCategory("all");
          localStorageUtils.saveCategory(applicationId, "all");
        }

        return newCompanies;
      });
    },
    [applicationId, selectedCategory, setURLCategory],
  );

  return {
    selectedCategory,
    setSelectedCategory,
    companies,
    setCompanies,
    handleCategoryChange,
    handleAddCompany,
    handleRemoveCompany,
  };
}
