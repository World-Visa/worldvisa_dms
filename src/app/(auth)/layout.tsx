import type { ReactNode } from "react";

import { Command } from "lucide-react";

import { Separator } from "@/components/ui/separator";

export default function Layout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <main>
      <div className="grid h-dvh justify-center p-2 lg:grid-cols-2">
        <div className="relative order-2 hidden h-full rounded-3xl bg-primary lg:flex">
          <div className="absolute top-10 space-y-1 px-10 text-primary-foreground">
            <Command className="size-10" />
            <h1 className="font-medium text-2xl">WorldVisa DMS</h1>
            <p className="text-sm">Simple. Secure. Organized.</p>
          </div>

          <div className="absolute bottom-10 flex w-full justify-between px-10">
            <div className="flex-1 space-y-1 text-primary-foreground">
              <h2 className="font-medium">Organize Documents Easily</h2>
              <p className="text-sm">
                Upload, manage, and share your files securely with WorldVisa DMS for efficient document collaboration.
              </p>
            </div>
            <Separator orientation="vertical" className="mx-3 h-auto!" />
            <div className="flex-1 space-y-1 text-primary-foreground">
              <h2 className="font-medium">Stay Compliant </h2>
              <p className="text-sm">
                Our system helps you track requirements, approvals, and deadlines to ensure worry-free compliance.
              </p>
            </div>
          </div>
        </div>
        <div className="relative order-1 flex h-full">{children}</div>
      </div>
    </main>
  );
}