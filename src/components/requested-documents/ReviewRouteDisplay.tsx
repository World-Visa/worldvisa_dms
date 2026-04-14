import React from "react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RequestedDocument } from "@/lib/api/requestedDocuments";

/**
 * Renders the full review forwarding chain for a document.
 *
 * New docs (multiple review_chain entries): chain is complete — render as-is.
 * Old docs (single entry, old system overwrote requested_by/requested_to):
 *   recover the original requester from messages[0].username.
 */
export function ReviewRouteDisplay({ document }: { document: RequestedDocument }) {
  const chain = document.review_chain;

  // Fallback for docs without a chain (older records before review_chain was added)
  if (!chain?.length) {
    return (
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-sm text-gray-900">
          {document.requested_review.requested_by}
        </span>
        <ArrowRight className="h-3 w-3 text-gray-400 shrink-0" />
        <span className="text-sm font-medium text-gray-900">
          {document.requested_review.requested_to}
        </span>
      </div>
    );
  }

  const nodes: string[] = [];

  if (chain.length === 1) {
    // Old doc: the old system overwrote requested_by/requested_to on the same entry.
    // The first message sender is the original requester before the overwrite.
    const firstSender = chain[0].messages?.[0]?.username;
    if (firstSender && firstSender !== chain[0].requested_by) {
      nodes.push(firstSender);
    }
    nodes.push(chain[0].requested_by);
    if (chain[0].requested_to !== nodes[nodes.length - 1]) {
      nodes.push(chain[0].requested_to);
    }
  } else {
    // New docs: each forward creates a separate entry — build from the full chain
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
          <span
            className={cn(
              "text-sm capitalize",
              i === nodes.length - 1
                ? "font-medium text-gray-900"
                : "text-gray-500",
            )}
          >
            {node}
          </span>
          {i < nodes.length - 1 && (
            <ArrowRight className="h-3 w-3 text-gray-400 shrink-0" />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}
