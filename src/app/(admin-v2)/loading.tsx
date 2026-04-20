import { LogoLoadingScreen } from "@/components/common/LogoLoadingScreen";

export default function AdminLoading() {
  return (
    <LogoLoadingScreen
      className="flex min-h-0 flex-1 flex-col"
      statusLabel="Loading workspace"
    />
  );
}
