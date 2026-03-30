"use client";

import { UserButton } from "@clerk/nextjs";
import { ROUTES } from "@/utils/routes";

export function UserProfile() {
  return (
    <div>
      <UserButton
        key="new"
        userProfileUrl={ROUTES.SETTINGS_ACCOUNT}
        appearance={{
          elements: {
            avatarBox: "h-6 w-6",
            userButtonTrigger:
              "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring",
          },
        }}
      />
    </div>
  );
}
