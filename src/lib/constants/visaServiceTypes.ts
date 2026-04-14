export const VISA_SERVICE_TYPE_VALUES = [
  "All",
  "University Admission",
  "Work Permit",
  "Investor Migration",
  "College Admission",
  "Student Visa",
  "Business Visa",
  "Permanent Residency",
  "Dependent Spouse",
  "Intra Office",
  "Visit Visa",
  "Tourist Visa",
  "Oppurtunity Card",
  "Job Seeker Visa",
  "Germany Opportunity Card",
  "Parent Visa RRV",
  "Australia GTI",
  "Australia Parent Visa",
  "Australia Child Visa",
  "Australia Partner Visa",
  "Parent Visa Australia SC804",
  "Australia RRV",
  "Child Visa Agreement Australia",
  "Retainer Agreement JSV Germany",
  "Parent Visa Australia retainer agreement",
  "EOI & Visa Stage 2",
  "Australia GTI Agreement",
  "Temporary Dependent Visa",
  "Australian Student Visa",
  "Visitor Visa Rejection",
  "Australia Work in Holiday Visa",
  "Germany Family Re-Union Visa",
  "Partner of Student Work Visa",
  "Business Visitor Visa",
  "Super Visa",
  "SC 403 Visa Application",
  "SC 400 Visa Application",
  "National Innovation Visa(NIV)",
] as const;

export const VISA_SERVICE_TYPE_FILTER_OPTIONS = VISA_SERVICE_TYPE_VALUES.filter(
  (v) => v !== "All",
).map((v) => ({ label: v, value: v }));

type ServiceBadgePaletteItem = {
  bg: string;
  text: string;
  ring: string;
};

const SERVICE_BADGE_PALETTE: readonly ServiceBadgePaletteItem[] = [
  { bg: "bg-emerald-50", text: "text-emerald-900", ring: "ring-emerald-200" },
  { bg: "bg-sky-50", text: "text-sky-900", ring: "ring-sky-200" },
  { bg: "bg-amber-50", text: "text-amber-950", ring: "ring-amber-200" },
  { bg: "bg-violet-50", text: "text-violet-950", ring: "ring-violet-200" },
  { bg: "bg-fuchsia-50", text: "text-fuchsia-950", ring: "ring-fuchsia-200" },
  { bg: "bg-rose-50", text: "text-rose-950", ring: "ring-rose-200" },
  { bg: "bg-lime-50", text: "text-lime-950", ring: "ring-lime-200" },
  { bg: "bg-teal-50", text: "text-teal-950", ring: "ring-teal-200" },
  { bg: "bg-indigo-50", text: "text-indigo-950", ring: "ring-indigo-200" },
  { bg: "bg-orange-50", text: "text-orange-950", ring: "ring-orange-200" },
] as const;

const SERVICE_BADGE_FALLBACK: ServiceBadgePaletteItem = {
  bg: "bg-neutral-50",
  text: "text-neutral-900",
  ring: "ring-neutral-200",
};

function hashStringToIndex(input: string, mod: number) {
  // djb2-ish hash; stable + cheap; output always [0..mod-1]
  let h = 5381;
  for (let i = 0; i < input.length; i += 1) {
    h = (h * 33) ^ input.charCodeAt(i);
  }
  return Math.abs(h) % mod;
}

export function getServiceTypeBadgePalette(serviceType: string | null | undefined) {
  const s = (serviceType ?? "").trim();
  if (!s) return SERVICE_BADGE_FALLBACK;
  const idx = hashStringToIndex(s, SERVICE_BADGE_PALETTE.length);
  return SERVICE_BADGE_PALETTE[idx] ?? SERVICE_BADGE_FALLBACK;
}

