'use client';

import { useRouter } from 'next/navigation';
import type { RequestedReviewItem } from '@/lib/api/globalSearch';
import { Command } from '../command-types';

export function useRequestedDocsCommands(reviews: RequestedReviewItem[] | undefined): Command[] {
  const router = useRouter();

  if (!reviews?.length) return [];

  const seen = new Set<string>();
  const uniqueReviews = reviews.filter((item) => {
    if (seen.has(item._id)) return false;
    seen.add(item._id);
    return true;
  });

  return uniqueReviews.map((item) => ({
    id: `review-${item._id}`,
    label: item.client_name,
    description: item.document_name + (item.document_category ? ` · ${item.document_category}` : ''),
    category: 'requested-docs' as const,
    keywords: [item.client_name, item.document_name, item.document_category, item.requested_review.status].filter(Boolean) as string[],
    priority: 'high' as const,
    metadata: { status: item.requested_review.status },
    // Navigate with documentId param — RequestedDocsClient auto-opens the sheet
    execute: () => { router.push(`/v2/requested-docs?documentId=${item._id}`); },
  }));
}
