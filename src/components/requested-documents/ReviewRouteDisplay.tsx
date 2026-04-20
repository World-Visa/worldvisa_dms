import React from "react";
import { ArrowRight } from "lucide-react";
import type { RequestedDocument } from "@/lib/api/requestedDocuments";
import { useAdminUsers } from "@/hooks/useAdminUsers";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/primitives/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

function ParticipantAvatar({
  name,
  imageUrl,
}: {
  name: string;
  imageUrl?: string;
}) {
  const initials = name.slice(0, 2).toUpperCase();
  return (
    <TooltipProvider>
      <Tooltip delayDuration={100}>
        <TooltipTrigger asChild>
          <Avatar className="size-5 shrink-0 cursor-default ring-2 ring-background">
            {imageUrl && <AvatarImage src={imageUrl} alt={name} />}
            <AvatarFallback className="text-[9px] font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
        </TooltipTrigger>
        <TooltipContent side="top" variant="default">
          <span className="capitalize">{name}</span>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function ReviewRouteDisplay({
  document,
}: {
  document: RequestedDocument;
}) {
  const { data: adminUsers = [] } = useAdminUsers();

  const adminMap = React.useMemo(() => {
    const map: Record<string, string | undefined> = {};
    for (const u of adminUsers) {
      if (u.username) map[u.username] = u.profile_image_url ?? undefined;
    }
    return map;
  }, [adminUsers]);

  const chain = document.review_chain;

  let nodes: string[] = [];

  if (!chain?.length) {
    const review = document.requested_review;
    const firstSender = review.messages?.[0]?.username;
    if (firstSender && firstSender !== review.requested_by) {
      nodes.push(firstSender);
    }
    nodes.push(review.requested_by);
    if (review.requested_to !== nodes[nodes.length - 1]) {
      nodes.push(review.requested_to);
    }
  } else if (chain.length === 1) {
    const firstSender = chain[0].messages?.[0]?.username;
    if (firstSender && firstSender !== chain[0].requested_by) {
      nodes.push(firstSender);
    }
    nodes.push(chain[0].requested_by);
    if (chain[0].requested_to !== nodes[nodes.length - 1]) {
      nodes.push(chain[0].requested_to);
    }
  } else {
    nodes.push(chain[0].requested_by);
    for (const entry of chain) {
      if (entry.requested_to !== nodes[nodes.length - 1]) {
        nodes.push(entry.requested_to);
      }
    }
  }

  return (
    <div className="flex items-center gap-1">
      {nodes.map((node, i) => (
        <React.Fragment key={`${node}-${i}`}>
          <ParticipantAvatar name={node} imageUrl={adminMap[node]} />
          {i < nodes.length - 1 && (
            <ArrowRight className="h-3 w-3 text-muted-foreground/40 shrink-0" />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}
