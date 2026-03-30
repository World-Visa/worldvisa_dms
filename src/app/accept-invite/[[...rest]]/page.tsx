import React, { Suspense } from 'react'
import { AuthSideBanner } from '@/components/auth/AuthSideBanner';
import { createMeta } from '@/lib/seo';
import { SignUp as SignUpForm } from '@clerk/nextjs';
import { ROUTES } from '@/utils/routes';
import { clerkSignupAppearance } from '@/lib/clerk-appearance';

export const metadata = createMeta(
    {
        title: 'Accept Invite | WorldVisa DMS',
        description: 'Accept the invite to join WorldVisa DMS.',
    }
)

function InviteSignupFallback() {
    return (
        <div className="flex flex-1 justify-end px-4 py-0 sm:py-0 md:items-center md:px-0">
            <div className="flex w-full max-w-[400px] flex-col items-start justify-start gap-[18px]">
                <div className="w-full rounded-xl border bg-white/70 p-6 shadow-sm backdrop-blur">
                    <div className="h-6 w-2/3 animate-pulse rounded-md bg-black/10" />
                    <div className="mt-4 h-10 w-full animate-pulse rounded-md bg-black/10" />
                    <div className="mt-3 h-10 w-full animate-pulse rounded-md bg-black/10" />
                    <div className="mt-6 h-9 w-full animate-pulse rounded-md bg-black/10" />
                </div>
            </div>
        </div>
    );
}

const InvitePage = () => {
 
    return (
        <div className="flex min-h-screen w-full flex-col md:max-w-[1100px] md:flex-row md:gap-36">
            <div className="w-full md:w-auto">
                <AuthSideBanner />
            </div>
            <Suspense fallback={<InviteSignupFallback />}>
                <div className="flex flex-1 justify-end py-0 sm:py-0 md:items-center md:px-0">
                    <div className="flex w-full max-w-[400px] flex-col items-start justify-start md:gap-[18px]">
                        <SignUpForm
                            path={ROUTES.SIGN_UP}
                            signInUrl={ROUTES.SIGN_IN}
                            appearance={clerkSignupAppearance}
                            forceRedirectUrl={ROUTES.VERIFYING}
                        />
                    </div>
                </div>
            </Suspense>
        </div>
    );
};

export default InvitePage;