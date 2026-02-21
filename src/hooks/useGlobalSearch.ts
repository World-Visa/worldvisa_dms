"use client";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { globalSearch, type GlobalSearchResponse } from "@/lib/api/globalSearch";

export function useGlobalSearch(
  search: string,
  country: "Australia" | "Canada",
) {
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const trimmed = search.trim();
    if (!trimmed) {
      setDebouncedSearch("");
      return;
    }
    const timer = setTimeout(() => {
      setDebouncedSearch(trimmed);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  return useQuery<GlobalSearchResponse>({
    queryKey: ["global-search", debouncedSearch, country],
    queryFn: () => globalSearch({ search: debouncedSearch, limit: 10, country }),
    enabled: debouncedSearch.length >= 2,
    staleTime: 1000 * 30,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}
