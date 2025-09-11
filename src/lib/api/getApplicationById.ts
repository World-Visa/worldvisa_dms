import { fetcher } from '../fetcher';
import { ApplicationDetailsResponse } from '@/types/applications';

const ZOHO_BASE_URL = 'https://worldvisagroup-19a980221060.herokuapp.com/api/zoho_dms';

export async function getApplicationById(id: string): Promise<ApplicationDetailsResponse> {
  return fetcher<ApplicationDetailsResponse>(`${ZOHO_BASE_URL}/visa_applications/${id}`);
}
