"use client";

import { NotificationModal } from "./NotificationModal";

export function IOSNotificationFlow({ onInstalled }: { onInstalled?: () => void }) {
  return <NotificationModal platform="ios" onInstalled={onInstalled} />;
}

