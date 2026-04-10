// ── Participant & Member ────────────────────────────────────────

export type ParticipantType = "staff" | "client";
export type ConversationType = "dm" | "group";

export interface ChatParticipantRef {
  type: ParticipantType;
  id: string;
  profile_image_url?: string;
}

export interface ConversationMember {
  type: ParticipantType;
  id: string;
  displayName: string;
  email?: string;
  lastReadAt?: string | null;
  online_status?: boolean;       // backward compat boolean
  presence_status?: import('./presence').PresenceStatus;
  lastSeen?: string | null;
  profile_image_url?: string;
}

// ── Attachment & Message ───────────────────────────────────────

export interface ChatAttachment {
  url: string;
  name: string;
  contentType: string;
  size: number;
}

export interface ChatMessage {
  _id: string;
  conversationId: string;
  sender: {
    type: ParticipantType;
    id: string;
  };
  content?: string;
  attachments?: ChatAttachment[];
  forwardedFromMessageId?: string | null;
  createdAt: string;
  deletedAt?: string | null;
}

// ── Conversation ───────────────────────────────────────────────

export interface Conversation {
  _id: string;
  type: ConversationType;
  name?: string;
  description?: string;
  imageUrl?: string;
  participants: ChatParticipantRef[];
  createdBy?: ChatParticipantRef;
  lastMessageAt?: string | null;
  archivedBy?: ChatParticipantRef[];
  createdAt: string;
  updatedAt: string;
  // Computed/aggregated fields
  unreadCount: number;
  lastMessage?: {
    content?: string;
    sender: { type: ParticipantType; id: string };
    createdAt: string;
  } | null;
  otherDisplayName?: string; // DM only
  members?: ConversationMember[]; // full detail endpoint only
}

// ── Staff User (from /users endpoint) ─────────────────────────

export interface StaffUser {
  _id: string;
  username: string;
  email?: string;
  role: "admin" | "team_leader" | "master_admin" | "supervisor";
  profile_image_url?: string;
}

// ── Client User (from /clients/all endpoint) ───────────────────

export interface ClientUser {
  _id: string;
  name: string;
  email?: string;
  lead_owner: string; // admin username who handles this client
  lead_id?: string; // Zoho lead / application id, used to match applications for restricted admins
  profile_image_url?: string;
}

// ── Request shapes ─────────────────────────────────────────────

export interface CreateDMRequest {
  type: "dm";
  participant: ChatParticipantRef;
}

export interface CreateGroupRequest {
  type: "group";
  name: string;
  description?: string;
  imageUrl?: string;
  participants: ChatParticipantRef[];
}

export type CreateConversationRequest = CreateDMRequest | CreateGroupRequest;

export interface UpdateGroupRequest {
  name?: string;
  description?: string;
  imageUrl?: string;
}

export interface UpdateParticipantsRequest {
  add?: ChatParticipantRef[];
  remove?: ChatParticipantRef[];
}

export interface SendMessageRequest {
  content?: string;
  attachments?: ChatAttachment[];
  forwardedFromMessageId?: string;
}

export interface MarkReadRequest {
  lastReadAt?: string;
}

// ── Response shapes ────────────────────────────────────────────

export interface ConversationListResponse {
  status: "success" | "fail";
  data: Conversation[];
  total: number;
  page: number;
  limit: number;
}

export interface SingleConversationResponse {
  status: "success" | "fail";
  data: Conversation;
}

export interface MessageListResponse {
  status: "success" | "fail";
  data: ChatMessage[];
}

export interface SingleMessageResponse {
  status: "success" | "fail";
  data: ChatMessage;
}

export interface UploadAttachmentResponse {
  status: "success" | "fail";
  data: ChatAttachment;
}

export interface StaffUsersResponse {
  status: string;
  data: StaffUser[];
}

// ── Query params ───────────────────────────────────────────────

export interface ConversationListParams {
  page?: number;
  limit?: number;
  type?: ConversationType;
  search?: string;
  archived?: boolean;
}

export interface MessageListParams {
  before?: string;
  limit?: number;
}

// ── Socket event payloads ──────────────────────────────────────

export interface ChatMessageEvent {
  conversationId: string;
  message: ChatMessage;
}

export interface ChatReadEvent {
  conversationId: string;
  participant: ChatParticipantRef;
  lastReadAt: string;
}

// ── Connection state ───────────────────────────────────────────

export interface ChatConnectionState {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  lastEvent: string | null;
}

// ── Permission mode ────────────────────────────────────────────

export type PermissionMode = "restricted" | "unrestricted";
