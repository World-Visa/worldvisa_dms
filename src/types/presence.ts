export type PresenceStatus = 'online' | 'idle' | 'offline';

export interface PresenceUpdateEvent {
  userId: string;
  status: PresenceStatus;
  lastSeen: string | null;
}

export interface PresenceSnapshotEvent {
  presences: Record<string, { status: PresenceStatus; lastSeen: string | null }>;
}
