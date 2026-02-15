import {
  DescriptionValidation,
  DESCRIPTION_CONSTRAINTS,
} from "@/types/description";

// Re-export for convenience
export { DESCRIPTION_CONSTRAINTS };

/**
 * Validates description content and length
 */
export function validateDescription(
  description: string,
): DescriptionValidation {
  const errors: string[] = [];

  // Check if description is provided
  if (!description || description.trim().length === 0) {
    errors.push(DESCRIPTION_CONSTRAINTS.REQUIRED_FIELD);
    return { isValid: false, errors };
  }

  const trimmedDescription = description.trim();

  // Check minimum length
  if (trimmedDescription.length < DESCRIPTION_CONSTRAINTS.MIN_LENGTH) {
    errors.push(DESCRIPTION_CONSTRAINTS.TOO_SHORT);
  }

  // Check maximum length
  if (trimmedDescription.length > DESCRIPTION_CONSTRAINTS.MAX_LENGTH) {
    errors.push(DESCRIPTION_CONSTRAINTS.TOO_LONG);
  }

  // Check for potentially harmful characters (basic validation)
  const invalidChars = /[<>]/;
  if (invalidChars.test(trimmedDescription)) {
    errors.push(DESCRIPTION_CONSTRAINTS.INVALID_CHARACTERS);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Sanitizes description by trimming and limiting length
 */
export function sanitizeDescription(description: string): string {
  return description.trim().slice(0, DESCRIPTION_CONSTRAINTS.MAX_LENGTH);
}

/**
 * Checks if description is within valid length range
 */
export function isDescriptionLengthValid(description: string): boolean {
  const trimmed = description.trim();
  return (
    trimmed.length >= DESCRIPTION_CONSTRAINTS.MIN_LENGTH &&
    trimmed.length <= DESCRIPTION_CONSTRAINTS.MAX_LENGTH
  );
}
