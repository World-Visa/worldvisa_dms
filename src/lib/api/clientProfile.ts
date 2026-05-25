import { fetcher } from '@/lib/fetcher';
import { getClerkToken } from '@/lib/getToken';
import { API_ENDPOINTS } from '@/lib/config/api';

export interface ClientProfile {
  _id: string;
  name: string;
  email: string;
  phone: string;
  lead_id: string;
  record_type: string;
  profile_image_url: string;
  suggested_anzsco: string;
  assessing_authority: string;
  service_type: string;
}

interface ClientProfileResponse {
  status: string;
  data: { profile: ClientProfile };
}

export async function getClientProfile(leadId: string): Promise<ClientProfile> {
  const res = await fetcher<ClientProfileResponse>(API_ENDPOINTS.CLIENTS.PROFILE.BY_ID(leadId));
  return res.data.profile;
}

export interface UpdateClientProfilePayload {
  name?: string;
  email?: string;
  phone?: string;
  suggested_anzsco?: string;
  assessing_authority?: string;
  service_type?: string;
  record_type?: string;
}

export async function updateClientProfile(
  leadId: string,
  payload: UpdateClientProfilePayload,
): Promise<ClientProfile> {
  const res = await fetcher<ClientProfileResponse>(API_ENDPOINTS.CLIENTS.PROFILE.BY_ID(leadId), {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  return res.data.profile;
}

export async function uploadClientProfileImage(
  leadId: string,
  file: File,
  onProgress: (progress: number) => void,
): Promise<string> {
  const token = await getClerkToken();

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append('profile_image', file);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        onProgress(e.loaded / e.total);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText) as ClientProfileResponse;
          resolve(data.data.profile.profile_image_url);
        } catch {
          reject(new Error('Invalid server response'));
        }
      } else {
        try {
          const data = JSON.parse(xhr.responseText) as { message?: string };
          reject(new Error(data.message ?? `Upload failed: ${xhr.status}`));
        } catch {
          reject(new Error(`Upload failed: ${xhr.status}`));
        }
      }
    };

    xhr.onerror = () => reject(new Error('Network error during upload'));
    xhr.open('PATCH', API_ENDPOINTS.CLIENTS.PROFILE.BY_ID(leadId));
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.send(formData);
  });
}
