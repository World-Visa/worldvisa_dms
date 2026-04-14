"use client";

import { useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import qs from "query-string";
import type { Country } from "@/types/applications";
import type { ApplicationsResponse } from "@/types/applications";
import { fetcher } from "@/lib/fetcher";
import { COUNTRIES } from "@/lib/applications/utils";

type UseCountryApplicationTotalsOptions = {
  countries?: readonly Country[];
  staleTimeMs?: number;
  /** Returns a full URL for the totals query for a given country. */
  getUrl: (country: Country) => string;
  queryKeyPrefix?: readonly string[];
};

export function useCountryApplicationTotals({
  countries = COUNTRIES,
  staleTimeMs = 1000 * 60 * 5,
  getUrl,
  queryKeyPrefix = ["applications", "totals"],
}: UseCountryApplicationTotalsOptions) {
  const queries = useQueries({
    queries: countries.map((country) => {
      const url = getUrl(country);

      return {
        queryKey: [...queryKeyPrefix, country] as const,
        queryFn: () => fetcher<ApplicationsResponse>(url),
        staleTime: staleTimeMs,
        gcTime: staleTimeMs * 2,
        retry: 1,
        refetchOnWindowFocus: false,
        placeholderData: (prev: ApplicationsResponse | undefined) => prev,
      };
    }),
  });

  const countryTotals = useMemo(() => {
    const out: Record<Country, number | undefined> = {
      Australia: undefined,
      Canada: undefined,
      Germany: undefined,
    };
    countries.forEach((country, idx) => {
      out[country] = queries[idx]?.data?.pagination.totalRecords;
    });
    return out;
  }, [countries, queries]);

  const visibleCountries = useMemo(() => {
    // Avoid flicker: keep country visible while total is unknown (undefined).
    return countries.filter((c) => {
      const total = countryTotals[c];
      return total === undefined ? true : total > 0;
    });
  }, [countries, countryTotals]);

  return { countryTotals, visibleCountries };
}

