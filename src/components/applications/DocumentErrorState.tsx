import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { IconAlertCircle } from "@tabler/icons-react"
import { RefreshCcwIcon } from "lucide-react"
import { useRouter } from "next/navigation"

export function DocumentErrorState() {
    const router = useRouter();
    const handleRefresh = () => {
        router.refresh();
    }
  return (
    <Empty className="bg-muted/30 h-full">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <IconAlertCircle className="text-destructive" />
        </EmptyMedia>
        <EmptyTitle>Error Loading Documents</EmptyTitle>
        <EmptyDescription className="max-w-xs text-pretty">
          Failed to load documents for this application. Please try again later.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button variant="outline" onClick={handleRefresh}>
          <RefreshCcwIcon />
          Refresh
        </Button>
      </EmptyContent>
    </Empty>
  )
}
