import type { ReactNode } from "react";
import { createMeta } from '@/lib/seo';
import { Separator } from "@/components/ui/separator";
import { AuthHeroAnimation } from "@/components/auth/AuthHeroAnimation";
import Image from "next/image";

export const metadata = createMeta({
  title: 'Login',
  description:
    'Securely sign in to your WorldVisa DMS account to manage documents and workflows.',
  noIndex: true,
});

export default function Layout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <main className="overflow-hidden min-h-0 bg-[url('/auth/background.svg')] bg-cover bg-center bg-no-repeat">
      <div className="grid h-dvh justify-center lg:grid-cols-2">
        <div className="relative order-2 hidden h-full rounded-3xl bg-primary lg:flex m-0 md:m-2">
          <div className="absolute top-10 space-y-1 px-10 text-primary-foreground">
            <Image src="/logos/worldvisa-profile.png" alt="WorldVisa Logo" width={40} height={40} className="object-contain" />
            <h1 className="font-medium text-2xl">WorldVisa DMS</h1>
            <p className="text-sm">Simple. Secure. Organized.</p>
          </div>

          <div className="absolute inset-x-5 top-20 bottom-20">
            <AuthHeroAnimation />
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
        <div className="relative order-1 flex h-full ">
          {children}
        </div>
      </div>
    </main>
  );
}