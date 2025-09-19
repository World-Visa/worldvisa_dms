export interface AddDescriptionRequest {
  description: string;
  checklist_id: string;
}

export interface AddDescriptionResponse {
  status: string;
  message: string;
}
