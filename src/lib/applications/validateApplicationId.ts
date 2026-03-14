export function isValidApplicationId(id: string | undefined | null): boolean {
  if (id == null || typeof id !== "string") return false;
  const trimmed = id.trim();
  if (trimmed.length === 0) return false;
  if (trimmed.includes("%%") || trimmed.includes("drp:")) return false;
  return true;
}
