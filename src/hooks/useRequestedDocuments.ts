import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import {
  getRequestedDocumentsToMe,
  getMyRequestedDocuments,
  getAllRequestedDocuments,
  getRequestedDocumentsSearch,
  updateRequestedDocumentStatus,
  RequestedDocumentsParams,
  RequestedDocument,
} from "@/lib/api/requestedDocuments";
import { toast } from "sonner";
import * as Sentry from "@sentry/nextjs";
import { useAuth } from "./useAuth";

interface UseRequestedDocumentsOptions {
  enabled?: boolean;
}

export function useRequestedDocumentsToMe(
  params: RequestedDocumentsParams = {},
  options?: UseRequestedDocumentsOptions,
) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["requested-documents-to-me", params],
    queryFn: () => getRequestedDocumentsToMe(params),
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: false,
    enabled: options?.enabled ?? true,
    select: (data) => {
      const enhancedData = data.data.map((doc) => ({
        ...doc,
        isOverdue: isDocumentOverdue(doc, user?.role),
        daysSinceRequest: getDaysSinceRequest(doc),
        priority: getDocumentPriority(doc, user?.role),
        formattedUploadDate: new Date(doc.uploaded_at).toLocaleDateString(),
        formattedRequestDate: new Date(
          doc.requested_review.requested_at,
        ).toLocaleDateString(),
      }));

      return {
        ...data,
        data: sortByRequestedAtDesc(enhancedData),
      };
    },
    meta: {
      errorMessage: "Failed to load requested documents. Please try again.",
    },
  });
}

export function useRequestedDocumentsToMePaginated(
  page: number = 1,
  limit: number = 10,
  filters: Omit<RequestedDocumentsParams, "page" | "limit"> = {},
  options?: UseRequestedDocumentsOptions,
) {
  const { user } = useAuth();
  const params: RequestedDocumentsParams = {
    page,
    limit,
    ...filters,
  };

  return useQuery({
    queryKey: ["requested-documents-to-me", page, limit, filters],
    queryFn: () => getRequestedDocumentsToMe(params),
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: false,
    enabled: options?.enabled ?? true,
    placeholderData: keepPreviousData,
    select: (data) => {
      const enhancedData = data.data.map((doc) => ({
        ...doc,
        isOverdue: isDocumentOverdue(doc, user?.role),
        daysSinceRequest: getDaysSinceRequest(doc),
        priority: getDocumentPriority(doc, user?.role),
        formattedUploadDate: new Date(doc.uploaded_at).toLocaleDateString(),
        formattedRequestDate: new Date(
          doc.requested_review.requested_at,
        ).toLocaleDateString(),
      }));

      return {
        ...data,
        data: sortByRequestedAtDesc(enhancedData),
      };
    },
    meta: {
      errorMessage: "Failed to load requested documents. Please try again.",
    },
  });
}

export function useMyRequestedDocuments(
  params: RequestedDocumentsParams = {},
  options?: UseRequestedDocumentsOptions,
) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["my-requested-documents", params],
    queryFn: () => getMyRequestedDocuments(params),
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: false,
    enabled: options?.enabled ?? true,
    select: (data) => {
      const enhancedData = data.data.map((doc) => ({
        ...doc,
        isOverdue: isDocumentOverdue(doc, user?.role),
        daysSinceRequest: getDaysSinceRequest(doc),
        priority: getDocumentPriority(doc, user?.role),
        formattedUploadDate: new Date(doc.uploaded_at).toLocaleDateString(),
        formattedRequestDate: new Date(
          doc.requested_review.requested_at,
        ).toLocaleDateString(),
      }));

      return {
        ...data,
        data: sortByRequestedAtDesc(enhancedData),
      };
    },
    meta: {
      errorMessage: "Failed to load my requested documents. Please try again.",
    },
  });
}

export function useMyRequestedDocumentsPaginated(
  page: number = 1,
  limit: number = 10,
  filters: Omit<RequestedDocumentsParams, "page" | "limit"> = {},
  options?: UseRequestedDocumentsOptions,
) {
  const { user } = useAuth();
  const params: RequestedDocumentsParams = {
    page,
    limit,
    ...filters,
  };

  return useQuery({
    queryKey: ["my-requested-documents", page, limit, filters],
    queryFn: () => getMyRequestedDocuments(params),
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: false,
    enabled: options?.enabled ?? true,
    placeholderData: keepPreviousData,
    select: (data) => {
      const enhancedData = data.data.map((doc) => ({
        ...doc,
        isOverdue: isDocumentOverdue(doc, user?.role),
        daysSinceRequest: getDaysSinceRequest(doc),
        priority: getDocumentPriority(doc, user?.role),
        formattedUploadDate: new Date(doc.uploaded_at).toLocaleDateString(),
        formattedRequestDate: new Date(
          doc.requested_review.requested_at,
        ).toLocaleDateString(),
      }));

      return {
        ...data,
        data: sortByRequestedAtDesc(enhancedData),
      };
    },
    meta: {
      errorMessage: "Failed to load my requested documents. Please try again.",
    },
  });
}

export function useUpdateRequestedDocumentStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      documentId,
      status,
      message,
    }: {
      documentId: string;
      status: "reviewed";
      message?: string;
    }) => {
      const startTime = Date.now();

      try {
        const result = await updateRequestedDocumentStatus(
          documentId,
          status,
          message,
        );

        const responseTime = Date.now() - startTime;

        if (responseTime > 3000) {
          console.warn(`Slow status update: ${responseTime}ms`);
        }

        return {
          documentId,
          status,
          message,
          result,
        };
      } catch (error) {
        const responseTime = Date.now() - startTime;

        Sentry.captureException(error, {
          tags: {
            operation: "update_requested_document_status",
            documentId,
          },
          extra: {
            documentId,
            status,
            message,
            responseTime,
          },
        });

        throw error;
      }
    },
    onMutate: async ({ status }) => {
      await queryClient.cancelQueries({
        queryKey: ["requested-documents-to-me"],
      });
      await queryClient.cancelQueries({ queryKey: ["my-requested-documents"] });

      toast.loading(`Updating document status to ${status}...`, {
        id: "update-document-status",
      });
    },
    onSuccess: (data) => {
      const { status } = data;

      queryClient.invalidateQueries({
        queryKey: ["requested-documents-to-me"],
      });
      queryClient.invalidateQueries({ queryKey: ["my-requested-documents"] });
      queryClient.invalidateQueries({ queryKey: ["application-documents"] });

      toast.dismiss("update-document-status");

      toast.success(`Document ${status} successfully!`, {
        duration: 3000,
      });
    },
    onError: (error, variables) => {
      const { status } = variables;

      toast.dismiss("update-document-status");

      toast.error(`Failed to ${status} document. Please try again.`, {
        description: error.message,
        duration: 5000,
      });
    },
  });
}

function isDocumentOverdue(doc: RequestedDocument, userRole?: string): boolean {
  if (doc.requested_review.status !== "pending") {
    return false;
  }

  const requestDate = new Date(doc.requested_review.requested_at);
  const now = new Date();
  const daysDiff = Math.floor(
    (now.getTime() - requestDate.getTime()) / (1000 * 60 * 60 * 24),
  );

  switch (userRole) {
    case "master_admin":
      return daysDiff > 4;
    case "team_leader":
      return daysDiff > 1;
    default:
      return daysDiff > 4;
  }
}

function getDaysSinceRequest(doc: RequestedDocument): number {
  const requestDate = new Date(doc.requested_review.requested_at);
  const now = new Date();
  return Math.floor(
    (now.getTime() - requestDate.getTime()) / (1000 * 60 * 60 * 24),
  );
}

function getDocumentPriority(
  doc: RequestedDocument,
  userRole?: string,
): "high" | "medium" | "low" {
  const daysSinceRequest = getDaysSinceRequest(doc);
  const isOverdue = isDocumentOverdue(doc, userRole);

  if (isOverdue) return "high";

  switch (userRole) {
    case "master_admin":
      if (daysSinceRequest > 3) return "high";
      if (daysSinceRequest > 2) return "medium";
      return "low";
    case "team_leader":
      if (daysSinceRequest > 0) return "high";
      return "medium";
    default:
      if (daysSinceRequest > 3) return "high";
      if (daysSinceRequest > 2) return "medium";
      return "low";
  }
}

function sortByRequestedAtDesc(
  documents: RequestedDocument[],
): RequestedDocument[] {
  return [...documents].sort((a, b) => {
    const aDate = new Date(a.requested_review?.requested_at || 0).getTime();
    const bDate = new Date(b.requested_review?.requested_at || 0).getTime();
    return bDate - aDate; // Descending: newest first
  });
}

export function useAllRequestedDocumentsPaginated(
  page: number = 1,
  limit: number = 10,
  filters: Omit<RequestedDocumentsParams, "page" | "limit"> = {},
  options?: UseRequestedDocumentsOptions,
) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["all-requested-documents-paginated", page, limit, filters],
    queryFn: () => getAllRequestedDocuments(page, limit, filters),
    enabled:
      options?.enabled !== undefined
        ? options.enabled
        : !!user && user.role === "master_admin",
    placeholderData: keepPreviousData,
    select: (data) => {
      if (!data?.data) return data;

      const enhancedData = data.data.map((doc) => ({
        ...doc,
        isOverdue: isDocumentOverdue(doc, user?.role),
        daysSinceRequest: getDaysSinceRequest(doc),
        priority: getDocumentPriority(doc, user?.role),
        formattedUploadDate: new Date(doc.uploaded_at).toLocaleDateString(),
        formattedRequestDate: new Date(
          doc.requested_review.requested_at,
        ).toLocaleDateString(),
      }));

      return {
        ...data,
        data: sortByRequestedAtDesc(enhancedData),
      };
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: false,
  });
}

export function useAllRequestedDocuments(
  filters: Omit<RequestedDocumentsParams, "page" | "limit"> = {},
  options?: UseRequestedDocumentsOptions,
) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["all-requested-documents", filters],
    queryFn: () => getAllRequestedDocuments(1, 1000, filters),
    enabled:
      options?.enabled !== undefined
        ? options.enabled
        : !!user && user.role === "master_admin",
    select: (data) => {
      if (!data?.data) return data;

      const enhancedData = data.data.map((doc) => ({
        ...doc,
        isOverdue: isDocumentOverdue(doc, user?.role),
        daysSinceRequest: getDaysSinceRequest(doc),
        priority: getDocumentPriority(doc, user?.role),
        formattedUploadDate: new Date(doc.uploaded_at).toLocaleDateString(),
        formattedRequestDate: new Date(
          doc.requested_review.requested_at,
        ).toLocaleDateString(),
      }));

      return {
        ...data,
        data: sortByRequestedAtDesc(enhancedData),
      };
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: false,
  });
}

export function useRequestedDocumentsSearch(
  page: number,
  limit: number,
  documentName: string,
  documentCategory?: string,
  options?: UseRequestedDocumentsOptions,
) {
  const { user } = useAuth();
  const hasSearch =
    Boolean(documentName?.trim()) || Boolean(documentCategory?.trim());

  return useQuery({
    queryKey: [
      "requested-documents-search",
      page,
      limit,
      documentName?.trim() ?? "",
      documentCategory ?? "",
    ],
    queryFn: () =>
      getRequestedDocumentsSearch({
        page,
        limit,
        document_name: documentName?.trim() || undefined,
        document_category: documentCategory?.trim() || undefined,
      }),
    enabled: hasSearch && (options?.enabled ?? true),
    placeholderData: keepPreviousData,
    select: (data) => {
      if (!data?.data) return data;

      const enhancedData = data.data.map((doc) => ({
        ...doc,
        isOverdue: isDocumentOverdue(doc, user?.role),
        daysSinceRequest: getDaysSinceRequest(doc),
        priority: getDocumentPriority(doc, user?.role),
        formattedUploadDate: new Date(doc.uploaded_at).toLocaleDateString(),
        formattedRequestDate: new Date(
          doc.requested_review.requested_at,
        ).toLocaleDateString(),
      }));

      return {
        ...data,
        data: sortByRequestedAtDesc(enhancedData),
      };
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: false,
  });
}
