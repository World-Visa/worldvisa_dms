'use server';

import { revalidateTag } from 'next/cache';

export async function invalidateChecklistSummary(): Promise<void> {
  revalidateTag('checklist-templates-summary');
}

export async function invalidateChecklistGrouped(visaType?: string): Promise<void> {
  if (visaType) {
    revalidateTag(`checklist-grouped-${visaType}`);
  } else {
    revalidateTag('checklist-templates-grouped');
  }
}

export async function invalidateChecklistVisaTypes(): Promise<void> {
  revalidateTag('checklist-visa-types');
}
