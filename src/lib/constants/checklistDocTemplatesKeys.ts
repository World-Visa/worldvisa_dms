export const CHECKLIST_GROUPED_QUERY_PREFIX = ['checklist-templates', 'grouped'] as const;

export const CHECKLIST_TEMPLATE_KEYS = {
  visaTypes: ['checklist-templates', 'visa-types'] as const,
  summary: ['checklist-templates', 'summary'] as const,
  grouped: (visaType: string) =>
    [...CHECKLIST_GROUPED_QUERY_PREFIX, visaType] as const,
};
