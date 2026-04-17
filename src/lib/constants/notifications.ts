"use client";

import type { Notification } from "@/types/notifications";
import { ROUTES } from "@/utils/routes";

export type NotificationAction = { label: string; href: string };

export function getNotificationAction(n: Notification): NotificationAction | null {
  switch (n.source) {
    case "document_review": {
      if (!n.leadId) return { label: "View Document", href: ROUTES.REQUESTED_DOCS };

      const basePath =
        n.applicationType === "Spouse_Skill_Assessment"
          ? ROUTES.SPOUSE_SKILL_ASSESSMENT_APPLICATION_DETAILS(n.leadId)
          : ROUTES.APPLICATION_DETAILS(n.leadId);

      return {
        label: "View Document",
        href: n.documentId ? `${basePath}?documentId=${n.documentId}` : basePath,
      };
    }
    case "requested_reviews":
      return {
        label: "View Review",
        href: n.documentId
          ? `${ROUTES.REQUESTED_DOCS}?documentId=${n.documentId}`
          : ROUTES.REQUESTED_DOCS,
      };
    case "quality_check":
      return { label: "View QC", href: ROUTES.QUALITY_CHECK };
    case "requested_checklist":
      return { label: "View Checklist", href: ROUTES.CHECKLIST_REQUESTS };
    case "chat":
      return { label: "Open Chat", href: ROUTES.CHAT };
    default:
      return null;
  }
}

