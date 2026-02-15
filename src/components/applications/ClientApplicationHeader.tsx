import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw } from "lucide-react";
import { ClientApplicationResponse } from "@/types/client";

interface ClientApplicationHeaderProps {
  applicationData?: ClientApplicationResponse;
  isApplicationLoading: boolean;
  isRefreshing: boolean;
  onRefresh: () => void;
}

export function ClientApplicationHeader({
  applicationData,
  isApplicationLoading,
  isRefreshing,
  onRefresh,
}: ClientApplicationHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-lexend font-bold">
            My Application
          </h1>
          <div className="text-muted-foreground">
            {isApplicationLoading ? (
              <Skeleton className="h-4 w-32" />
            ) : applicationData?.data ? (
              `Application ID: ${applicationData.data.id}`
            ) : (
              "Loading..."
            )}
          </div>
        </div>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={onRefresh}
        disabled={isRefreshing}
        className="flex items-center gap-2"
      >
        <RefreshCw
          className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
        />
        <span className="hidden sm:inline">Refresh</span>
      </Button>
    </div>
  );
}
