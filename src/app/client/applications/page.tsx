"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CircleAlert, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { ROUTES } from "@/utils/routes";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function ClientApplicationsPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated && user?.lead_id) {
      router.push(`/client/applications/${user.lead_id}`);
    }
  }, [user, isAuthenticated, isLoading, router]);

  const needsSignIn = !isLoading && !isAuthenticated;
  const noApplicationLinked =
    !isLoading && isAuthenticated && !user?.lead_id;
  const redirecting =
    !isLoading && isAuthenticated && Boolean(user?.lead_id);

  const showSpinner = isLoading || redirecting;

  return (
    <div className="flex min-h-[calc(100vh-4.5rem)] flex-col items-center justify-center bg-background px-4 py-10">
      <Card className="w-full max-w-md border-none shadow-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold tracking-tight text-foreground">
            {needsSignIn
              ? "Sign in required"
              : isLoading
                ? "Loading your portal"
                : noApplicationLinked
                  ? "No application on file"
                  : "Opening your application"}
          </CardTitle>
          <CardDescription className="text-pretty">
            {needsSignIn
              ? "Your session is not active. Sign in to access your applications."
              : isLoading
                ? "Verifying your session and account."
                : noApplicationLinked
                  ? "There is no case linked to this account yet. If you believe this is a mistake, contact your WorldVisa advisor."
                  : "Redirecting you to your application timeline."}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4 pb-6 pt-4">
          {needsSignIn && (
            <Button asChild variant="default" size="sm" className="w-full sm:w-auto">
              <Link href={ROUTES.SIGN_IN}>Sign in</Link>
            </Button>
          )}
          {showSpinner && (
            <Loader2
              className="h-7 w-7 animate-spin text-primary"
              aria-hidden
            />
          )}
          {noApplicationLinked && (
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                <CircleAlert
                  className="h-5 w-5 text-muted-foreground"
                  aria-hidden
                />
              </div>
              <p className="max-w-sm text-xs text-muted-foreground">
                Support can link your application to this login when your case
                is ready.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
