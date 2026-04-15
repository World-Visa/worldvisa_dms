import type { Country } from "@/types/applications";

export const COUNTRIES: readonly Country[] = ["Australia", "Canada"] as const;

export const COUNTRY_IMAGE_URLS: Record<Country, string> = {
  Australia:
    "https://images.pexels.com/photos/1766215/pexels-photo-1766215.jpeg",
  Canada: "https://images.pexels.com/photos/2448946/pexels-photo-2448946.jpeg",
};


export const formatLocalDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};


export const resolveCountry = (urlCountry: string | undefined): Country =>
  urlCountry === "Canada" ? "Canada" : "Australia";
