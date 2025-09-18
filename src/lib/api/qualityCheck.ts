import { fetcher } from '@/lib/fetcher';
import { QualityCheckRequest, QualityCheckResponse } from '@/types/common';

const ZOHO_BASE_URL = 'https://worldvisagroup-19a980221060.herokuapp.com/api/zoho_dms';

/**
 * Push application for quality check
 */
export async function pushForQualityCheck(
  data: QualityCheckRequest,
  page: number = 1,
  limit: number = 10
): Promise<QualityCheckResponse> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });

  return fetcher<QualityCheckResponse>(
    `${ZOHO_BASE_URL}/visa_applications/quality_check?${params}`,
    {
      method: 'POST',
      body: JSON.stringify(data),
    }
  );
}
