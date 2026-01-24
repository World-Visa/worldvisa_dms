import { tokenStorage } from "../auth";
import type {
   Stage2Document,
   Stage2DocumentType,
   CreateStage2DocumentRequest,
   UpdateStage2DocumentRequest,
   Stage2DocumentsResponse,
   UploadStage2DocumentResponse,
   DeleteStage2DocumentResponse,
} from "@/types/stage2Documents";
import { ZOHO_BASE_URL } from '@/lib/config/api';

export async function fetchStage2Documents(
   applicationId: string,
   type?: Stage2DocumentType
): Promise<Stage2DocumentsResponse> {
   const token = tokenStorage.get();

   const headers: Record<string, string> = {
      "Content-Type": "application/json",
   };

   if (token) {
      headers["Authorization"] = `Bearer ${token}`;
   }

   const url = `${ZOHO_BASE_URL}/visa_applications/${applicationId}/aus-stage2-documents`;

   const response = await fetch(url, {
      method: "GET",
      headers,
   });

   if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;

      try {
         const errorData = await response.json();
         errorMessage = errorData.message || errorData.error || errorMessage;
      } catch {
         errorMessage = response.statusText || errorMessage;
      }

      throw new Error(errorMessage);
   }

   const data = await response.json();

   // Filter by type if specified
   if (type && data.data) {
      return {
         ...data,
         data: data.data.filter((doc: Stage2Document) => doc.type === type),
      };
   }

   return data;
}

export async function uploadStage2Document(
   request: CreateStage2DocumentRequest
): Promise<UploadStage2DocumentResponse> {
   // Validate files
   request.files.forEach((file) => {
      const fileName = file.name.toLowerCase();

      // Allowed file types for stage 2 documents
      const allowedExtensions = [
         ".pdf",
         ".doc",
         ".docx",
         ".jpg",
         ".jpeg",
         ".png",
      ];
      const allowedMimeTypes = [
         "application/pdf",
         "application/msword",
         "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
         "image/jpeg",
         "image/jpg",
         "image/png",
      ];

      const hasValidExtension = allowedExtensions.some((ext) =>
         fileName.endsWith(ext)
      );
      if (!hasValidExtension) {
         throw new Error(
            `File "${file.name}" has an unsupported file type. Only PDF, Word (.doc, .docx), and image files (.jpg, .jpeg, .png) are allowed.`
         );
      }

      const hasValidMimeType = allowedMimeTypes.includes(file.type);
      if (!hasValidMimeType) {
         throw new Error(
            `File "${file.name}" has an unsupported MIME type. Only PDF, Word, and image files are allowed.`
         );
      }

      if (file.size === 0) {
         throw new Error(
            `File "${file.name}" is empty. Please select a valid file.`
         );
      }

      if (file.size > 5 * 1024 * 1024) {
         throw new Error(
            `File "${file.name}" is too large. Maximum file size is 5MB.`
         );
      }
   });

   const formData = new FormData();

   // Add files
   request.files.forEach((file) => {
      formData.append("files", file);
   });

   // Add required fields
   formData.append("file_name", request.file_name);
   formData.append("document_name", request.document_name);
   formData.append("document_type", request.document_type);
   formData.append("uploaded_by", request.uploaded_by);
   formData.append("type", request.type);

    // Add optional fields based on document type
    if (request.subclass) {
       formData.append("subclass", request.subclass);
    }
    if (request.state) {
       formData.append("state", request.state);
    }
    if (request.point !== undefined) {
       formData.append("point", request.point.toString());
    }
   if (request.date) {
      formData.append("date", request.date);
   }
   if (request.deadline) {
      formData.append("deadline", request.deadline);
   }
   if (request.outcome_date) {
      formData.append("outcome_date", request.outcome_date);
   }
  if (request.outcome) {
     formData.append("outcome", request.outcome);
  }
  if (request.skill_assessing_body) {
     formData.append("skill_assessing_body", request.skill_assessing_body);
  }

   const token = tokenStorage.get();

   const headers: Record<string, string> = {};
   if (token) {
      headers["Authorization"] = `Bearer ${token}`;
   }

   const url = `${ZOHO_BASE_URL}/visa_applications/${request.applicationId}/aus-stage2-documents`;

   const response = await fetch(url, {
      method: "POST",
      body: formData,
      headers,
   });

   if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;

      try {
         const errorData = await response.json();
         errorMessage = errorData.message || errorData.error || errorMessage;
      } catch {
         errorMessage = response.statusText || errorMessage;
      }

      throw new Error(errorMessage);
   }

   return response.json();
}

export async function updateStage2Document(
   request: UpdateStage2DocumentRequest
): Promise<UploadStage2DocumentResponse> {
   const token = tokenStorage.get();

   // Build metadata object with only fields that have values
   const metadata: Record<string, string | number> = {};

   if (request.metadata.document_name) {
      metadata.document_name = request.metadata.document_name;
   }
   if (request.metadata.subclass) {
      metadata.subclass = request.metadata.subclass;
   }
   if (request.metadata.state) {
      metadata.state = request.metadata.state;
   }
   if (request.metadata.point !== undefined) {
      metadata.point = request.metadata.point;
   }
   // Include date fields if they exist and are non-empty strings
   if (request.metadata.date !== undefined && request.metadata.date !== null && String(request.metadata.date).trim() !== '') {
      metadata.date = String(request.metadata.date).trim();
   }
   if (request.metadata.deadline !== undefined && request.metadata.deadline !== null && String(request.metadata.deadline).trim() !== '') {
      metadata.deadline = String(request.metadata.deadline).trim();
   }
   if (request.metadata.outcome_date !== undefined && request.metadata.outcome_date !== null && String(request.metadata.outcome_date).trim() !== '') {
      metadata.outcome_date = String(request.metadata.outcome_date).trim();
   }
  if (request.metadata.outcome !== undefined && request.metadata.outcome !== null && String(request.metadata.outcome).trim() !== '') {
     metadata.outcome = String(request.metadata.outcome).trim();
  }
  if (request.metadata.skill_assessing_body !== undefined && request.metadata.skill_assessing_body !== null && String(request.metadata.skill_assessing_body).trim() !== '') {
     metadata.skill_assessing_body = String(request.metadata.skill_assessing_body).trim();
  }

   const headers: Record<string, string> = {
      'Content-Type': 'application/json',
   };
   if (token) {
      headers["Authorization"] = `Bearer ${token}`;
   }

   // Put document ID in URL path (matching pattern from reuploadDocument)
   const url = `${ZOHO_BASE_URL}/visa_applications/${request.applicationId}/aus-stage2-documents/${request.documentId}`;

   const response = await fetch(url, {
      method: "PATCH",
      headers,
      body: JSON.stringify(metadata),
   });

   if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;

      try {
         const errorData = await response.json();
         errorMessage = errorData.message || errorData.error || errorMessage;
      } catch {
         errorMessage = response.statusText || errorMessage;
      }

      throw new Error(errorMessage);
   }

   return response.json();
}

export async function deleteStage2Document(
   applicationId: string,
   documentId: string
): Promise<DeleteStage2DocumentResponse> {
   const token = tokenStorage.get();

   const headers: Record<string, string> = {};
   if (token) {
      headers["Authorization"] = `Bearer ${token}`;
   }

   const url = `${ZOHO_BASE_URL}/visa_applications/${applicationId}/aus-stage2-documents/${documentId}`;

   const response = await fetch(url, {
      method: "DELETE",
      headers,
   });

   if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;

      try {
         const errorData = await response.json();
         errorMessage = errorData.message || errorData.error || errorMessage;
      } catch {
         errorMessage = response.statusText || errorMessage;
      }

      throw new Error(errorMessage);
   }

   return response.json();
}
