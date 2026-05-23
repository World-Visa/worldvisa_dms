/** Subclass 189 (Skilled Independent) has no state/territory nomination. */
export const SUBCLASS_WITHOUT_STATE = "189" as const;

/** Stored/sent when state selection does not apply. */
export const STAGE2_STATE_NOT_APPLICABLE = "N/A" as const;

export function isSubclassWithoutState(subclass: string): boolean {
  return subclass === SUBCLASS_WITHOUT_STATE;
}

/** Whether the user must pick AU state(s) in the sheet UI. */
export function requiresStateSelection(subclass: string): boolean {
  return subclass.length > 0 && !isSubclassWithoutState(subclass);
}

/** States to iterate for EOI create uploads. */
export function resolveStage2StatesForUpload(
  subclass: string,
  selectedStates: string[],
): string[] {
  if (isSubclassWithoutState(subclass)) return [STAGE2_STATE_NOT_APPLICABLE];
  return selectedStates;
}

/** Single state for invitation create / edit PATCH. */
export function resolveStage2StateForApi(
  subclass: string,
  selectedState: string,
): string {
  if (isSubclassWithoutState(subclass)) return STAGE2_STATE_NOT_APPLICABLE;
  return selectedState;
}
