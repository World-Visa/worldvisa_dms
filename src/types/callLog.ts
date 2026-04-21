export type DateRangePreset = 'last_24h' | 'last_7d' | 'last_30d' | 'last_90d';

export type CallStatus =
  | 'initiated'
  | 'answered'
  | 'completed'
  | 'missed'
  | 'busy'
  | 'cancelled';

export type CallAgentStatus =
  | 'unanswered'
  | 'client_busy'
  | 'client_asked_call_later'
  | 'not_connected'
  | 'answered'
  | 'none';

export type CallDirection = 'inbound' | 'outbound';


export interface CallLogListFilters {
  q?:         string;
  status?:    CallStatus | '';
  direction?: CallDirection | '';
  dateRange?: DateRangePreset | '';
  startDate?: string;
  endDate?:   string;
  page?:      number;
  limit?:     number;
}

// ── Document shapes ──────────────────────────────────────────────────────────

export interface PopulatedAgent {
  _id:          string;
  name:         string;
  email:        string;
  agent_number: string | null;
}

export interface PopulatedClient {
  _id:     string;
  Name:    string;
  Email:   string;
  Phone:   string;
  lead_id: string;
}

export interface CallLog {
  _id:               string;
  call_id:           string;
  direction:         CallDirection;
  status:            CallStatus;
  dial_status:       string;
  agent_phone:       string;
  agent_name:        string;
  /** Either an ObjectId string (list) or a populated object (detail) */
  agent_id:          string | PopulatedAgent | null;
  /** Lightweight populated agent from list endpoint */
  agent?:            PopulatedAgent;
  customer_phone:    string;
  /** Either an ObjectId string (list) or a populated object (detail) */
  client_id:         string | PopulatedClient | null;
  client_lead_id:    string;
  client_name:       string | null;
  mcube_did:         string;
  group_name:        string;
  start_time:        string;
  end_time:          string | null;
  answered_duration: string | null;
  disconnected_by:   string | null;
  recording_url:     string | null;
  call_note:         string | null;
  call_agent_status: CallAgentStatus | null;
  agent_image_url?:  string | null;
  client_image_url?: string | null;
  created_at:        string;
  updated_at:        string;
}

// ── Mutation payloads ────────────────────────────────────────────────────────

export interface UpdateCallNotesPayload {
  call_note?:         string | null;
  call_agent_status?: CallAgentStatus | null;
}

// ── API response shapes ──────────────────────────────────────────────────────

export interface CallLogPagination {
  currentPage:  number;
  totalPages:   number;
  totalRecords: number;
  limit:        number;
}

export interface CallLogListResponse {
  status:     'success';
  results:    number;
  pagination: CallLogPagination;
  data:       { callLogs: CallLog[] };
}

export interface CallLogDetailResponse {
  status: 'success';
  data:   { callLog: CallLog };
}
