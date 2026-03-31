import { Button } from "@/components/ui/primitives/button";
import { CompactButton } from "@/components/ui/primitives/button-compact";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/primitives/dropdown-menu";
import { TableCell } from "@/components/ui/table";
import type { Stage2Document } from "@/types/stage2Documents";
import { RiDeleteBin2Line, RiEyeLine, RiMore2Fill, RiPencilLine } from "react-icons/ri";

type Stage2RowActionsCellProps = {
  document: Stage2Document;
  isClientView: boolean;
  onView: (document: Stage2Document) => void;
  onEdit?: (document: Stage2Document) => void;
  onDelete?: (document: Stage2Document) => void;
};

export function Stage2RowActionsCell({
  document,
  isClientView,
  onView,
  onEdit,
  onDelete,
}: Stage2RowActionsCellProps) {
  if (isClientView) {
    return (
      <TableCell className="text-right">
        <div className="flex justify-end">
          <Button
            variant="secondary"
            mode="outline"
            size="2xs"
            onClick={() => onView(document)}
            title="View document"
          >
            View
          </Button>
        </div>
      </TableCell>
    );
  }

  return (
    <TableCell className="text-right">
      <div className="flex justify-end">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <CompactButton
              icon={RiMore2Fill}
              variant="ghost"
              className="z-10 h-8 w-8 p-0"
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onView(document)}>
              <RiEyeLine />
              View Document
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit?.(document)} disabled={!onEdit}>
              <RiPencilLine />
              Edit Document
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuGroup className="*:cursor-pointer">
            <DropdownMenuItem
              onClick={() => onDelete?.(document)}
              className="text-destructive"
              data-variant="destructive"
              disabled={!onDelete}
            >
              <RiDeleteBin2Line />
              Delete Document
            </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </TableCell>
  );
}
