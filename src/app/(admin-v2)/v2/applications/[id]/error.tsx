"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ApplicationDetailsErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ApplicationDetailsError({
  error,
  reset,
}: ApplicationDetailsErrorProps) {
  useEffect(() => {
    console.error("Application details error:", error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[400px] p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-destructive">
            Failed to load application
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {error.message || "An unexpected error occurred."}
          </p>
          <Button onClick={reset} variant="outline" size="sm">
            Try again
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
