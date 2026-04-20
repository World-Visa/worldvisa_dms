import {
  getAnzscoCodeByCode,
  getStateByCode,
  getVisaSubclassByCode,
} from "@/lib/constants/australianData";

export function getStage2SubclassDisplay(code?: string) {
  if (!code) return "N/A";
  const subclass = getVisaSubclassByCode(code);
  return subclass ? subclass.label : code;
}

export function getStage2StateDisplay(code?: string) {
  if (!code) return "N/A";
  const state = getStateByCode(code);
  return state ? `${state.code} - ${state.name}` : code;
}

export function getStage2AnzscoDisplay(code?: string) {
  if (!code) return "N/A";
  const data = getAnzscoCodeByCode(code);
  if (data) return `${data.anzsco_code} - ${data.name} (${data.assessing_authority})`;
  return code;
}
