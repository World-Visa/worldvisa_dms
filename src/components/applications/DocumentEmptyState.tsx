import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { IconFolderCode } from "@tabler/icons-react"
import { useRouter } from "next/navigation"


export function DocumentEmptyState({ applicationId }: { applicationId: string }) {
    const router = useRouter();
    const handleCreateChecklist = () => {
        router.push(`/v2/applications/${applicationId}/checklist`);
    }
    
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <IconFolderCode />
        </EmptyMedia>
        <EmptyTitle>No Documents Yet</EmptyTitle>
        <EmptyDescription>
          No documents have been uploaded for this application.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent className="flex-row justify-center gap-2">
        <Button onClick={handleCreateChecklist} premium3D={true} className="bg-primary-blue">Create Checklist</Button>
        <Button variant="outline">Upload Documents</Button>
      </EmptyContent>
    </Empty>
  )
}
