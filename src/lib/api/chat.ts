import { fetcher } from "@/lib/fetcher";
import { getStoredToken } from "@/lib/auth";
import { ZOHO_BASE_URL } from "@/lib/config/api";
import { CHAT_ENDPOINTS } from "@/lib/config/chat";
import type {
  ClientUser,
  ConversationListParams,
  ConversationListResponse,
  CreateConversationRequest,
  MarkReadRequest,
  MessageListParams,
  MessageListResponse,
  SendMessageRequest,
  SingleConversationResponse,
  SingleMessageResponse,
  StaffUser,
  StaffUsersResponse,
  UpdateGroupRequest,
  UpdateParticipantsRequest,
  UploadAttachmentResponse,
} from "@/types/chat";

export async function getConversations(
  params: ConversationListParams = {},
): Promise<ConversationListResponse> {
  const search = new URLSearchParams();
  if (params.page) search.set("page", String(params.page));
  if (params.limit) search.set("limit", String(params.limit));
  if (params.type) search.set("type", params.type);
  if (params.search) search.set("search", params.search);
  if (params.archived) search.set("archived", "true");

  const qs = search.toString();
  return fetcher<ConversationListResponse>(
    `${CHAT_ENDPOINTS.LIST}${qs ? `?${qs}` : ""}`,
  );
}

export async function getConversation(
  conversationId: string,
): Promise<SingleConversationResponse> {
  return fetcher<SingleConversationResponse>(
    CHAT_ENDPOINTS.BY_ID(conversationId),
  );
}

export async function createConversation(
  data: CreateConversationRequest,
): Promise<SingleConversationResponse> {
  return fetcher<SingleConversationResponse>(CHAT_ENDPOINTS.LIST, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateGroup(
  conversationId: string,
  data: UpdateGroupRequest,
): Promise<SingleConversationResponse> {
  return fetcher<SingleConversationResponse>(
    CHAT_ENDPOINTS.BY_ID(conversationId),
    {
      method: "PATCH",
      body: JSON.stringify(data),
    },
  );
}

export async function updateParticipants(
  conversationId: string,
  data: UpdateParticipantsRequest,
): Promise<SingleConversationResponse> {
  return fetcher<SingleConversationResponse>(
    CHAT_ENDPOINTS.PARTICIPANTS(conversationId),
    {
      method: "PATCH",
      body: JSON.stringify(data),
    },
  );
}

export async function getMessages(
  conversationId: string,
  params: MessageListParams = {},
): Promise<MessageListResponse> {
  const search = new URLSearchParams();
  if (params.before) search.set("before", params.before);
  if (params.limit) search.set("limit", String(params.limit));

  const qs = search.toString();
  return fetcher<MessageListResponse>(
    `${CHAT_ENDPOINTS.MESSAGES(conversationId)}${qs ? `?${qs}` : ""}`,
  );
}

export async function sendMessage(
  conversationId: string,
  data: SendMessageRequest,
): Promise<SingleMessageResponse> {
  return fetcher<SingleMessageResponse>(
    CHAT_ENDPOINTS.MESSAGES(conversationId),
    {
      method: "POST",
      body: JSON.stringify(data),
    },
  );
}

// Multipart send: do NOT use fetcher (it sets Content-Type: application/json)
export async function sendMessageWithFiles(
  conversationId: string,
  content: string | undefined,
  files: File[],
  forwardedFromMessageId?: string,
): Promise<SingleMessageResponse> {
  const formData = new FormData();
  if (content) formData.append("content", content);
  for (const file of files) {
    formData.append("files", file);
  }
  if (forwardedFromMessageId) {
    formData.append("forwardedFromMessageId", forwardedFromMessageId);
  }

  const token = getStoredToken();
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const response = await fetch(CHAT_ENDPOINTS.MESSAGES(conversationId), {
    method: "POST",
    body: formData,
    headers,
  });

  if (!response.ok) {
    let errorMessage = `HTTP error! status: ${response.status}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorData.error || errorMessage;
    } catch {
      errorMessage = response.statusText || errorMessage;
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

// Standalone attachment upload — also multipart
export async function uploadAttachment(
  file: File,
): Promise<UploadAttachmentResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const token = getStoredToken();
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const response = await fetch(CHAT_ENDPOINTS.ATTACHMENTS, {
    method: "POST",
    body: formData,
    headers,
  });

  if (!response.ok) {
    let errorMessage = `HTTP error! status: ${response.status}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorData.error || errorMessage;
    } catch {
      errorMessage = response.statusText || errorMessage;
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

export async function markRead(
  conversationId: string,
  data?: MarkReadRequest,
): Promise<{ status: string; data: { lastReadAt: string } }> {
  return fetcher(`${CHAT_ENDPOINTS.READ(conversationId)}`, {
    method: "POST",
    body: JSON.stringify(data ?? {}),
  });
}

export async function clearConversation(
  conversationId: string,
): Promise<{ status: string; message: string }> {
  return fetcher(CHAT_ENDPOINTS.CLEAR(conversationId), {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export async function leaveConversation(
  conversationId: string,
): Promise<{ status: string; message: string }> {
  return fetcher(CHAT_ENDPOINTS.LEAVE(conversationId), {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export async function archiveConversation(
  conversationId: string,
  body: { archived: boolean },
): Promise<SingleConversationResponse> {
  return fetcher<SingleConversationResponse>(
    CHAT_ENDPOINTS.ARCHIVE(conversationId),
    {
      method: "POST",
      body: JSON.stringify(body),
    },
  );
}

export async function deleteConversation(
  conversationId: string,
): Promise<{ status: string; message: string }> {
  return fetcher(CHAT_ENDPOINTS.BY_ID(conversationId), {
    method: "DELETE",
  });
}

export async function deleteMessage(
  conversationId: string,
  messageId: string,
): Promise<SingleMessageResponse> {
  return fetcher<SingleMessageResponse>(
    CHAT_ENDPOINTS.MESSAGE(conversationId, messageId),
    { method: "DELETE" },
  );
}

export async function getChatClients(params: {
  lead_owner?: string;
  limit?: number;
}): Promise<{ status: string; data: ClientUser[] }> {
  const qs = new URLSearchParams();
  if (params.lead_owner) qs.set("lead_owner", params.lead_owner);
  qs.set("limit", String(params.limit ?? 200));

  const raw = await fetcher<{
    status: string;
    data: { clients: ClientUser[] };
  }>(`${ZOHO_BASE_URL}/clients/all?${qs.toString()}`);
  return { status: raw.status, data: raw.data?.clients ?? [] };
}

// Fetches one page of clients with total count (server caps at 100/page)
export async function getChatClientsPage(
  page: number,
): Promise<{ clients: ClientUser[]; total: number }> {
  const qs = new URLSearchParams({ limit: "100", page: String(page) });
  const raw = await fetcher<{
    status: string;
    pagination: { totalRecords: number };
    data: { clients: ClientUser[] };
  }>(`${ZOHO_BASE_URL}/clients/all?${qs.toString()}`);
  return {
    clients: raw.data?.clients ?? [],
    total: raw.pagination?.totalRecords ?? 0,
  };
}

export async function getStaffUsers(): Promise<StaffUsersResponse> {
  // /users/all returns { status, data: { users: [...] } }
  const raw = await fetcher<{
    status: string;
    data: { users: StaffUser[] };
  }>(`${ZOHO_BASE_URL}/users/all?limit=500`);
  return { status: raw.status, data: raw.data?.users ?? [] };
}
