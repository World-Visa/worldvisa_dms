export const PENDING_DOCS_SUBJECT =
  "Action Required: Pending Documents for Your Application";

type DocStatus =
  | "missing"
  | "pending"
  | "rejected"
  | "request_review"
  | "approved"
  | "reviewed";

function formatStatus(status: DocStatus | string): string {
  if (status === "missing") return "Not uploaded";
  const labels: Record<string, string> = {
    pending: "Pending review",
    rejected: "Rejected",
    request_review: "Review requested",
    approved: "Approved",
    reviewed: "Reviewed",
  };
  return labels[status] ?? status;
}

/**
 * Generates TipTap-compatible HTML for the compose editor.
 * Uses p, strong, ul, li, table, tr, th, td — all supported via
 * StarterKit + the table extensions loaded in RichMailEditor.
 */
export function buildPendingDocumentsReminderHtml(
  clientName: string,
  docs: { label: string; status: string }[],
): string {
  const rows = docs
    .map(
      (doc) =>
        `<tr><td>${doc.label}</td><td>${formatStatus(doc.status)}</td></tr>`,
    )
    .join("");

  return [
    `<p>Dear <strong>${clientName}</strong>,</p>`,
    `<p>We hope you are doing well.</p>`,
    `<p>This is a gentle reminder that a few required documents are still pending from your end. Submitting these documents is necessary to move your application to the next phase — <strong>Quality Check</strong> — where your entire application will be reviewed.</p>`,
    `<p>Kindly log in to your portal and take the required action at the earliest.</p>`,
    `<p><strong>Pending Documents</strong></p>`,
    `<table><thead><tr><th>Document</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table>`,
    `<p>If you have already submitted the documents, please ignore this email. For any assistance, feel free to reach out to us.</p>`,
    `<p>Best regards,<br><strong>WorldVisa Team</strong></p>`,
  ].join("");
}
