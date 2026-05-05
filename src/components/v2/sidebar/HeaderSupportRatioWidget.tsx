"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { SupportRatioGauge } from "@/components/v2/users/SupportRatioGauge";
import { useAuth } from "@/hooks/useAuth";
import { useUserDetails } from "@/hooks/useUserDetails";

export function HeaderSupportRatioWidget() {
  const { user } = useAuth();
  const { data, isLoading } = useUserDetails(user?._id ?? "");

  if (isLoading) {
    return <Skeleton className="size-11 rounded-full" />;
  }

  const ratio = data?.data?.user?.support_ratio;

  return <SupportRatioGauge ratio={ratio} size="sm" />;
}
