export interface AddDescriptionRequest {
  description: string;
  checklist_id: string;
}

export interface AddDescriptionResponse {
  status: string;
  message: string;
}

export interface DescriptionValidation {
  isValid: boolean;
  errors: string[];
}

export const DESCRIPTION_CONSTRAINTS = {
  MIN_LENGTH: 1,
  MAX_LENGTH: 1000,
  REQUIRED_FIELD: 'Description is required',
  TOO_SHORT: 'Description must be at least 1 character long',
  TOO_LONG: 'Description cannot exceed 1000 characters',
  INVALID_CHARACTERS: 'Description contains invalid characters'
} as const;
