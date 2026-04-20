"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CircleAlert } from "lucide-react";
import { LogoLoadingScreen } from "@/components/common/LogoLoadingScreen";
import { useAuth } from "@/hooks/useAuth";
import { ROUTES } from "@/utils/routes";
import { Button } from "@/components/ui/button";

export default function ClientApplicationsPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated && user?.lead_id) {
      router.push(ROUTES.CLIENT_APPLICATION_DETAILS(user.lead_id));
    }
  }, [user, isAuthenticated, isLoading, router]);

  const needsSignIn = !isLoading && !isAuthenticated;
  const noApplicationLinked =
    !isLoading && isAuthenticated && !user?.lead_id;

  return (
    <LogoLoadingScreen className="min-h-[calc(100vh-4.5rem)]">
      {needsSignIn && (
        <Button asChild variant="default" size="sm">
          <Link href={ROUTES.SIGN_IN}>Sign in</Link>
        </Button>
      )}

      {noApplicationLinked && (
        <div className="flex max-w-sm flex-col items-center gap-3 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
            <CircleAlert
              className="h-5 w-5 text-muted-foreground"
              aria-hidden
            />
          </div>
          <p className="text-sm text-muted-foreground">
            No case is linked to this account yet. Contact your WorldVisa
            advisor if this looks wrong.
          </p>
        </div>
      )}
    </LogoLoadingScreen>
  );
}
