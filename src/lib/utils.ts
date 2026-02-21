import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const AVATAR_INDICES = [1, 2, 3, 5, 6, 7, 8, 9, 10, 11, 12];

export function getAvatarUrl(userId: string): string {
  const sum = userId.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return `/avatars/${AVATAR_INDICES[sum % AVATAR_INDICES.length]}.png`;
}

export function formatRole(role: string): string {
  return role.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export const getInitials = (str: string): string => {
  if (typeof str !== "string" || !str.trim()) return "?";

  return (
    str
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((word) => word[0])
      .join("")
      .toUpperCase() || "?"
  );
};