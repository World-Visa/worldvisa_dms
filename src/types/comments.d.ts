export interface Comment {
  _id: string;
  comment: string;
  added_by: string;
  created_at: string;
  document_id: string;
  is_important?: boolean;
}

// Zoho API comment format
export interface ZohoComment {
  _id: string;
  comment?: string;
  added_by: string;
  added_at: string;
}

export interface AddCommentRequest {
  comment: string;
  added_by: string;
  document_id: string;
}

export interface AddCommentResponse {
  status: "success" | "error";
  message?: string;
  data?: Comment;
  error?: string;
}

export interface GetCommentsResponse {
  status: "success" | "error";
  message?: string;
  data?: Comment[];
  error?: string;
}

export interface DeleteCommentRequest {
  commentId: string;
}

export interface DeleteCommentResponse {
  status: "success" | "error";
  message?: string;
  error?: string;
}

export interface CommentEvent {
  type: "comment_added" | "comment_updated" | "comment_deleted";
  document_id: string;
  comment: Comment;
  timestamp: string;
}

export interface RealtimeConnectionState {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  lastEvent: string | null;
}
