import React from "react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RequestedDocument } from "@/lib/api/requestedDocuments";
import { useAdminUsers } from "@/hooks/useAdminUsers";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/primitives/avatar";

function ParticipantNode({
  name,
  imageUrl,
  isLast,
}: {
  name: string;
  imageUrl?: string;
  isLast: boolean;
}) {
  const initials = name.slice(0, 2).toUpperCase();
  return (
    <div className="flex items-center gap-1">
      <Avatar className="size-4 shrink-0">
        {imageUrl && <AvatarImage src={imageUrl} alt={name} />}
        <AvatarFallback className="text-[8px] font-semibold">
          {initials}
        </AvatarFallback>
      </Avatar>
      <span
        className={cn(
          "text-xs capitalize",
          isLast ? "font-medium text-gray-900" : "text-gray-500",
        )}
      >
        {name}
      </span>
    </div>
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

  if (!chain?.length) {
    const review = document.requested_review;
    const firstSender = review.messages?.[0]?.username;
    const fallbackNodes: string[] = [];
    if (firstSender && firstSender !== review.requested_by) {
      fallbackNodes.push(firstSender);
    }
    fallbackNodes.push(review.requested_by);
    if (review.requested_to !== fallbackNodes[fallbackNodes.length - 1]) {
      fallbackNodes.push(review.requested_to);
    }
    return (
      <div className="flex items-center gap-1.5 flex-wrap">
        {fallbackNodes.map((node, i) => (
          <React.Fragment key={`${node}-${i}`}>
            <ParticipantNode
              name={node}
              imageUrl={adminMap[node]}
              isLast={i === fallbackNodes.length - 1}
            />
            {i < fallbackNodes.length - 1 && (
              <ArrowRight className="h-3 w-3 text-gray-300 shrink-0" />
            )}
          </React.Fragment>
        ))}
      </div>
    );
  }

  const nodes: string[] = [];

  if (chain.length === 1) {
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
    <div className="flex items-center gap-1.5 flex-wrap">
      {nodes.map((node, i) => (
        <React.Fragment key={`${node}-${i}`}>
          <ParticipantNode
            name={node}
            imageUrl={adminMap[node]}
            isLast={i === nodes.length - 1}
          />
          {i < nodes.length - 1 && (
            <ArrowRight className="h-3 w-3 text-gray-500 shrink-0" />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}
