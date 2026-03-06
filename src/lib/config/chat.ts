import { API_BASE_URL, ZOHO_BASE_URL } from "./api";

export const CHAT_API_BASE_URL = API_BASE_URL; // for Socket.IO
export const CHAT_REST_BASE = `${ZOHO_BASE_URL}/chats`;

export const CHAT_ENDPOINTS = {
  LIST: CHAT_REST_BASE,
  BY_ID: (id: string) => `${CHAT_REST_BASE}/${id}`,
  MESSAGES: (id: string) => `${CHAT_REST_BASE}/${id}/messages`,
  MESSAGE: (id: string, msgId: string) =>
    `${CHAT_REST_BASE}/${id}/messages/${msgId}`,
  READ: (id: string) => `${CHAT_REST_BASE}/${id}/read`,
  CLEAR: (id: string) => `${CHAT_REST_BASE}/${id}/clear`,
  LEAVE: (id: string) => `${CHAT_REST_BASE}/${id}/leave`,
  ARCHIVE: (id: string) => `${CHAT_REST_BASE}/${id}/archive`,
  PARTICIPANTS: (id: string) => `${CHAT_REST_BASE}/${id}/participants`,
  ATTACHMENTS: `${CHAT_REST_BASE}/attachments`,
  SOCKET_PATH: "/socket.io",
} as const;

export const CHAT_SOCKET_EVENTS = {
  MESSAGE: "chat:message",
  READ: "chat:read",
} as const;

export const CHAT_CONNECTION_CONFIG = {
  MAX_RECONNECT_ATTEMPTS: 5,
  INITIAL_RECONNECT_DELAY: 1000,
  MAX_RECONNECT_DELAY: 30000,
  CONNECTION_TIMEOUT: 10000,
  TRANSPORTS: ["websocket", "polling"] as const,
} as const;

export const CHAT_QUERY_KEYS = {
  conversations: ["chat", "conversations"] as const,
  conversation: (id: string) => ["chat", "conversation", id] as const,
  messages: (id: string) => ["chat", "messages", id] as const,
  staffUsers: ["chat", "staff-users"] as const,
  clientUsers: ["chat", "client-users"] as const,
} as const;
