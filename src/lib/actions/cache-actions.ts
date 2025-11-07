'use server';

import { revalidateTag } from 'next/cache';


export async function revalidateApplicationCache(applicationId: string) {
  revalidateTag('application', 'max');
  revalidateTag(`application-${applicationId}`, 'max');
}

export async function revalidateDocumentsCache(applicationId: string) {
  revalidateTag('documents', 'max');
  revalidateTag(`documents-${applicationId}`, 'max');
  revalidateTag('all-documents', 'max');
  revalidateTag(`all-documents-${applicationId}`, 'max');
}

export async function revalidateAllApplicationCaches(applicationId: string) {
  revalidateTag('application', 'max');
  revalidateTag(`application-${applicationId}`, 'max');
  revalidateTag('documents', 'max');
  revalidateTag(`documents-${applicationId}`, 'max');
  revalidateTag('all-documents', 'max');
  revalidateTag(`all-documents-${applicationId}`, 'max');
  revalidateTag('applications', 'max');
}

export async function revalidateApplicationsListCache() {
  revalidateTag('applications', 'max');
}
