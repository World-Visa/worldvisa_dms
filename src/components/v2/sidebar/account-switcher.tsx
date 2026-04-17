"use client";

import { UserButton } from "@clerk/nextjs";

import { ROUTES } from "@/utils/routes";

export function AccountSwitcher() {
  return (
    <UserButton
      key="new"
      userProfileUrl={ROUTES.STAFF_SETTINGS}
      appearance={{
        elements: {
          avatarBox: "h-6 w-6",
          userButtonTrigger:
            "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring",
        },
      }}
    ></UserButton>
  );
}
