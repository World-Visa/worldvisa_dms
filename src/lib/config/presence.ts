export const PRESENCE_SOCKET_EVENTS = {
  UPDATE:    'presence:update',
  SNAPSHOT:  'presence:snapshot',
  HEARTBEAT: 'presence:heartbeat',
  ACTIVITY:  'presence:activity',
  SUBSCRIBE: 'presence:subscribe',
} as const;

// How often to refetch user/conversation data to keep online_status fresh.
// Acts as a fallback if the backend does not emit presence:update socket events.
// Only fires when the tab is visible (refetchIntervalInBackground: false).
export const PRESENCE_POLLING_INTERVAL_MS = 60 * 1000;
