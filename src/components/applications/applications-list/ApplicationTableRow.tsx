import { memo } from "react";
import { Badge } from "@/components/ui/badge";
import { TableCell, TableRow } from "@/components/ui/table";
import TruncatedText from "@/components/ui/truncated-text";
import { CopyButton } from "@/components/ui/primitives/copy-button";
import type { VisaApplication } from "@/types/applications";
import { formatDate } from "@/utils/format";

export const ApplicationTableRow = memo(function ApplicationTableRow({
  application,
  onClick,
}: {
  application: VisaApplication;
  onClick: (id: string) => void;
}) {
  const hasAttachments = application.AttachmentCount > 0;

  return (
    <TableRow
      className="group relative isolate cursor-pointer transition-colors hover:bg-neutral-50"
      onClick={() => onClick(application.id)}
    >
      <TableCell className="font-medium">
        <TruncatedText className="max-w-[28ch]">{application.Name}</TruncatedText>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <TruncatedText className="text-foreground-600 max-w-[32ch] text-sm font-normal">
            {application.Email || "—"}
          </TruncatedText>
          {application.Email && (
            <CopyButton
              className="z-10 p-1 opacity-0 group-hover:opacity-100"
              valueToCopy={application.Email}
              size="2xs"
            />
          )}
        </div>
      </TableCell>
      <TableCell className="text-foreground-600 text-sm">{application.Phone || "—"}</TableCell>
      <TableCell>
        {application.Application_Handled_By ? (
          <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
            {application.Application_Handled_By}
          </span>
        ) : (
          <span className="text-foreground-400 text-sm">—</span>
        )}
      </TableCell>
      <TableCell className="text-foreground-600 text-sm">
        {application.Created_Time ? formatDate(application.Created_Time, "time") : "—"}
      </TableCell>
      <TableCell className="text-center">
        <Badge
          variant="secondary"
          className={hasAttachments ? "bg-green-600 hover:bg-green-400 text-white" : "bg-gray-400 hover:bg-gray-300 text-white"}
        >
          {application.AttachmentCount}
        </Badge>
      </TableCell>
    </TableRow>
  );
});

