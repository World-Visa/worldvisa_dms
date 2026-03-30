import { Globe } from "lucide-react";
import Image from "next/image";
import Logo from "../../../../../../public/logos/world-visa-logo.webp";
import { SignIn as SignInForm } from "@clerk/nextjs";
import { clerkSignupAppearance } from "@/lib/clerk-appearance";
import { ROUTES } from "@/utils/routes";
import { Suspense } from "react";

function SignInFallback() {
  return (
    <div className="space-y-4">
      <div className="w-full rounded-xl border bg-white/70 p-6 shadow-sm backdrop-blur">
        <div className="h-6 w-2/3 animate-pulse rounded-md bg-black/10" />
        <div className="mt-4 h-10 w-full animate-pulse rounded-md bg-black/10" />
        <div className="mt-3 h-10 w-full animate-pulse rounded-md bg-black/10" />
        <div className="mt-6 h-9 w-full animate-pulse rounded-md bg-black/10" />
      </div>
    </div>
  );
}

export default function LoginV2() {
  return (
    <div className="flex h-full min-h-0 w-full items-center justify-center overflow-auto p-4 md:p-0">
      <div className="mx-auto flex w-full flex-col justify-center space-y-8 sm:w-[350px]">
        <div className="space-y-2 text-center items-center flex flex-col justify-center">
          <div className="relative md:hidden h-12 w-36">
            <Image
              src={Logo}
              alt="WorldVisa Logo"
              height={72}
              width={120}
              className="w-full h-full object-contain"
              priority
            />
          </div>
        </div>
        <Suspense fallback={<SignInFallback />}>
          <SignInForm
            appearance={clerkSignupAppearance}
            fallbackRedirectUrl={ROUTES.VERIFYING}
            withSignUp={false}
          />
        </Suspense>
      </div>


      <div className="absolute bottom-5 flex w-full justify-between px-10">
        <div className="text-sm">Copyright © 2026 WorldVisa DMS</div>
        <div className="flex items-center gap-1 text-sm">
          <Globe className="size-4 text-muted-foreground" />
          ENG
        </div>
      </div>
    </div>
  );
}