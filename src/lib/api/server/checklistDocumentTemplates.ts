import { auth } from '@clerk/nextjs/server';
import { cacheLife, cacheTag } from 'next/cache';
import { BACKEND_ZOHO_URL } from '@/lib/config/api';
import type {
  GroupedResponse,
  SummaryResponse,
  VisaServiceTypesResponse,
} from '@/types/checklistDocumentTemplates';

async function serverFetch<T>(
  url: string,
  token: string | null,
): Promise<T | null> {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) return null;
  return response.json() as Promise<T>;
}

export async function getVisaServiceTypesServer(
  token: string | null,
): Promise<VisaServiceTypesResponse | null> {
  'use cache';
  cacheLife('hours');
  cacheTag('checklist-visa-types');
  return serverFetch<VisaServiceTypesResponse>(
    `${BACKEND_ZOHO_URL}/checklist-documents/visa-service-types`,
    token,
  );
}

export async function getChecklistSummaryServer(
  token: string | null,
): Promise<SummaryResponse | null> {
  'use cache';
  cacheLife('minutes');
  cacheTag('checklist-templates-summary');
  return serverFetch<SummaryResponse>(
    `${BACKEND_ZOHO_URL}/checklist-documents/summary`,
    token,
  );
}

export async function getGroupedDocumentsServer(
  visaType: string,
  token: string | null,
): Promise<GroupedResponse | null> {
  'use cache';
  cacheLife('minutes');
  cacheTag('checklist-templates-grouped');
  cacheTag(`checklist-grouped-${visaType}`);
  return serverFetch<GroupedResponse>(
    `${BACKEND_ZOHO_URL}/checklist-documents/grouped?visaServiceType=${encodeURIComponent(visaType)}`,
    token,
  );
}

export async function getServerToken(): Promise<string | null> {
  const { getToken } = await auth();
  return getToken();
}
