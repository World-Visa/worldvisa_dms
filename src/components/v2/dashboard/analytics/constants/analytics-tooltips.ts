export const ANALYTICS_TOOLTIPS = {
  MESSAGES_DELIVERED:
    'Total visa applications currently active in the DMS portal across all stages and assigned agents.',

  ACTIVE_SUBSCRIBERS:
    'Clients who have accepted their portal invitation and activated their account — ready to upload documents and communicate.',

  INTERACTIONS:
    'Document review requests currently awaiting admin or team leader response:\n\n• Submitted by clients\n• Pending approval or rejection\n\nDoes not include documents already approved or rejected.',

  AVG_MESSAGES_PER_SUBSCRIBER:
    'Applications whose lodgement deadline has already passed. These require immediate attention to avoid further delays.',

  DELIVERY_TREND:
    'Daily communication volume across all channels:\n\n• Email — sent, received, and system notifications\n• Chat — in-portal messages with clients\n• Call — tracked via MCube call logs\n• In-App — system-generated activity events\n\nShows trends over the selected period.',

  INTERACTION_TREND:
    'Daily document and workflow activity across all active applications:\n\n• Documents Uploaded — new files submitted by clients\n• Documents Reviewed — status changes by admin team\n• Comments Added — notes and feedback on documents\n• Quality Checks — QC requests initiated by the team',

  TOP_WORKFLOWS_BY_VOLUME:
    'Application counts grouped by lodgement deadline status:\n\n• All Lodgements — total applications with a deadline set\n• Approaching — deadline within the next 30 days\n• Overdue — deadline has already passed\n• Future — deadline more than 30 days away\n• No Deadline — applications without a lodgement deadline',

  WORKFLOW_RUNS_TREND:
    'Daily breakdown of new application intakes (Lodgements) and completed document reviews over the selected period. Helps track processing velocity against intake volume.',

  ACTIVE_SUBSCRIBERS_TREND:
    'Staff members with an active account status. Online badge indicates real-time portal presence tracked via WebSocket connection.',

  PROVIDERS_BY_VOLUME:
    'Total application volume grouped by destination country. Includes both main visa applications and spouse skill assessments.',

  INSUFFICIENT_DATE_RANGE:
    'At least 5 days of activity data is required to display this chart. Keep using the portal to generate more data points.',

  INSUFFICIENT_ENTRIES:
    'At least 2 entries with data are required to display this chart.',
} as const;
