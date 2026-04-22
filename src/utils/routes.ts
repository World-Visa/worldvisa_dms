export const ROUTES = {
  SIGN_IN: '/auth/sign-in',
  SIGN_UP: '/accept-invite',
  VERIFYING: '/verifying',
  ADMIN_HOME: '/v2/applications',
  CLIENT_HOME: '/client/applications',
  CLIENT_APPLICATION_DETAILS: (leadId: string) =>
    `/client/applications/${leadId}`,
  APPLICATION_DETAILS: (id: string) => `/v2/applications/${id}`,
  APPLICATION_CHECKLIST: (id: string) => `/v2/applications/${id}/checklist`,
  SPOUSE_SKILL_ASSESSMENT_APPLICATIONS: '/v2/spouse-skill-assessment-applications',
  SPOUSE_SKILL_ASSESSMENT_APPLICATION_DETAILS: (id: string) =>
    `/v2/spouse-skill-assessment-applications/${id}`,
  SPOUSE_APPLICATION_CHECKLIST: (id: string) =>
    `/v2/spouse-skill-assessment-applications/${id}/checklist`,
  CHECKLIST_REQUESTS: '/v2/checklist-requests',
  CHECKLIST_DOCS: '/v2/checklist-docs',
  CHECKLIST_DOCS_VISA: (visaType: string) =>
    `/v2/checklist-docs/${encodeURIComponent(visaType)}`,
  CHECKLIST_DOCS_CATEGORY: (visaType: string, category: string) =>
    `/v2/checklist-docs/${encodeURIComponent(visaType)}/${encodeURIComponent(category)}`,
  USERS: '/v2/users',
  USER_INVITATIONS: '/v2/users/invitations',
  CLIENTS: '/v2/clients',
  CLIENT_INVITATIONS: '/v2/clients/invitations',
  USER_DETAILS: (id: string) => `/v2/users/${id}`,
  PROFILE: '/v2/profile',
  PROFILE_SETTINGS: '/v2/profile/settings',
  SETTINGS_ACCOUNT: '/client/settings/account',
  STAFF_SETTINGS: '/v2/profile/settings',
  APPROVAL_REQUESTS: '/v2/approval-requests',
  ANALYTICS: '/v2/analytics',
  VISA_APPLICATIONS: '/v2/applications',
  CALL_LOGS: '/v2/call-logs',
  QUALITY_CHECK: '/v2/quality-check',
  REQUESTED_DOCS: '/v2/requested-docs',
  EMAIL: '/v2/mail',
  CHAT: '/v2/messages',
} as const;
