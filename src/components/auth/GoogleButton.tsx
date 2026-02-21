import { siGoogle } from "simple-icons";

import { SimpleIcon } from "@/components/ui/simple-icon";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Badge } from "../ui/badge";

export function GoogleButton({ className, ...props }: React.ComponentProps<typeof Button>) {
  return (
    <Button variant="secondary" disabled={true} className={cn(className)} title="Coming Soon" {...props}>
      <SimpleIcon icon={siGoogle} className="size-4" />
      Continue with Google - <Badge variant="default">Coming Soon</Badge>
    </Button>
  );
}