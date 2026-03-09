import type { ReactNode } from "react";

/** Removes page padding for the messages (chat) page so it can be full-bleed. */
export default function MessagesLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <div className="-m-4 md:-m-6 h-full min-h-0">
      {children}
    </div>
  );
}
