import { useMutation, useQueryClient } from "@tanstack/react-query";
import { sendForReview } from "@/lib/api/reviewRequest";
import {
  showErrorToast,
  showSuccessToast,
} from "@/components/ui/primitives/sonner-helpers";

/**
 * Every list that shows review requests. Sending a review changes the
 * requested-docs tabs and the application document lists, so all are refreshed.
 * The `["requested-document", id]` cache is intentionally absent: it is a
 * cache-only snapshot with no server fetch, so invalidating it does nothing.
 */
const REVIEW_QUERY_KEYS = [
  ["requested-documents-to-me"],
  ["my-requested-documents"],
  ["all-requested-documents"],
  ["all-requested-documents-paginated"],
  ["requested-documents-search"],
  ["application-documents"],
  ["application-documents-paginated"],
  ["application-details"],
] as const;

interface SendForReviewVariables {
  documentId: string;
  recipient: string;
  message: string;
}

export function useSendForReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ documentId, recipient, message }: SendForReviewVariables) =>
      sendForReview(documentId, { requested_to: [recipient], message }),
    onSuccess: (_data, { recipient }) => {
      for (const queryKey of REVIEW_QUERY_KEYS) {
        queryClient.invalidateQueries({ queryKey });
      }
      showSuccessToast(`Review request sent to ${recipient}.`);
    },
    onError: () => {
      showErrorToast("Failed to send review request. Please try again.");
    },
  });
}
