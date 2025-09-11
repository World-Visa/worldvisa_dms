import { fetcher } from '../fetcher';
import { DocumentsResponse } from '@/types/applications';

const ZOHO_BASE_URL = 'https://worldvisagroup-19a980221060.herokuapp.com/api/zoho_dms';

export async function getApplicationDocuments(id: string): Promise<DocumentsResponse> {
  return fetcher<DocumentsResponse>(`${ZOHO_BASE_URL}/visa_applications/${id}/documents`);
}
