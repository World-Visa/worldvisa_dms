import { CircleCheck } from './icons/circle-check';
import { Plug } from './icons/plug';
import { ShieldZap } from './icons/shield-zap';
import { Sparkling } from './icons/sparkling';
import { AuthFeatureRow } from './AuthFeatureRow';
import Image from 'next/image';

export function AuthSideBanner() {
  return (
    <div className="inline-flex h-full w-full max-w-[486px] flex-col items-center justify-center gap-[50px] p-5">
      <div className="flex flex-col items-start justify-start gap-4">
        <div className="inline-flex items-center justify-start gap-3">
          <Image src="/logos/world-visa-logo.webp" className="w-36" alt="logo" width={128} height={128} />
        </div>
       
          <div className="hidden flex-col items-start justify-start gap-4 md:block">
            <div className="flex flex-col items-start justify-start gap-1.5 self-stretch">
              <div className="text-2xl font-medium leading-8 text-neutral-950">
                Welcome! You’ve been invited to access the WorldVisa DMS portal.
              </div>
              <div className="inline-flex items-start justify-start gap-2">
                <CircleCheck className="mt-1 h-4 w-4 shrink-0" color="#99a0ad" />
                <div className="text-sm font-medium leading-relaxed text-neutral-400 text-balance">
                  For your security, this invite link is private! Please keep it confidential and don’t share it.
                </div>
              </div>
            </div>
          </div>
        
      </div>
   
        <div className="hidden md:flex md:flex-col md:items-start md:justify-start md:gap-8 md:self-stretch">
          <AuthFeatureRow
            icon={<Plug className="h-6 w-6 text-[#DD2450]" />}
            title="Secure portal access"
            description="A secure, invite-only sign-in for accessing your WorldVisa DMS workspace."
          />
          <AuthFeatureRow
            icon={<Sparkling className="h-6 w-6" />}
            title="Verified access, every time"
            description="Trusted sign-in helps ensure only authorized users can access the portal."
          />
          <AuthFeatureRow
            icon={<ShieldZap className="h-6 w-6" />}
            title="Built-in account protection"
            description="Verification and security safeguards help keep your account and documents safe."
          />
        </div>
     
    </div>
  );
}
