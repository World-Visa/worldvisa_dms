import { fetcher } from "@/lib/fetcher";
import { ZOHO_BASE_URL } from "@/lib/config/api";

export interface AccountStatus {
  emailValid: boolean;
  phoneValid: boolean;
  emailExists: boolean;
  phoneExists: boolean;
}

export interface CheckClientAccountResponseClient {
  _id: string;
  name: string;
  email: string;
  phone: string;
  password_value: string;
  lead_id: string;
  lead_owner: string;
  record_type: string;
  created_at: string;
  accountStatus: AccountStatus;
}

export interface CheckClientAccountResponse {
  status: "success";
  data: {
    client: CheckClientAccountResponseClient;
  };
}

export type CheckClientAccountResult =
  | CheckClientAccountResponse
  | { status: "fail"; message: string };

export interface UpdateClientAccountPayload {
  email?: string;
  phone?: string;
  password?: string;
}

export interface UpdateClientAccountResponseClient {
  _id: string;
  name: string;
  email: string;
  phone: string;
  lead_id: string;
  lead_owner: string;
  record_type: string;
  created_at: string;
  password_value: string;
}

export interface UpdateClientAccountResponse {
  status: "success";
  message: string;
  data: {
    client: UpdateClientAccountResponseClient;
  };
}

export interface CreateClientAccountPayload {
  name: string;
  email: string;
  phone: string;
  lead_id: string;
  lead_owner: string;
  record_type: string;
  password: string;
}

export interface CreateClientAccountResponseClient {
  _id: string;
  name: string;
  email: string;
  phone: string;
  lead_id: string;
  lead_owner: string;
  record_type: string;
  created_at: string;
}

export interface CreateClientAccountResponse {
  status: "success";
  message?: string;
  data: {
    client: CreateClientAccountResponseClient;
  };
}

export async function checkClientAccount(
  leadId: string,
): Promise<CheckClientAccountResult> {
  const url = `${ZOHO_BASE_URL}/clients/admin/check/${leadId}`;
  return fetcher<CheckClientAccountResult>(url, { method: "GET" });
}

export async function updateClientAccount(
  leadId: string,
  payload: UpdateClientAccountPayload,
): Promise<UpdateClientAccountResponse> {
  const url = `${ZOHO_BASE_URL}/clients/admin/update/${leadId}`;
  return fetcher<UpdateClientAccountResponse>(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function createClientAccount(
  payload: CreateClientAccountPayload,
): Promise<CreateClientAccountResponse> {
  const url = `${ZOHO_BASE_URL}/clients/signup`;
  return fetcher<CreateClientAccountResponse>(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}
