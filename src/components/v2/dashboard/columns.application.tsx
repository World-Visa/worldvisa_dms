import type { ColumnDef } from "@tanstack/react-table";
import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { z } from "zod";

import { DataTableColumnHeader } from "@/components/v2/datatable/data-table-column-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

export const applicationSchema = z.object({
  id: z.string(),
  Name: z.string(),
  Email: z.string(),
  Phone: z.string(),
  Application_Stage: z.string(),
  Application_Handled_By: z.string(),
  Qualified_Country: z.string().optional(),
  DMS_Application_Status: z.string().nullable(),
  Created_Time: z.string(),
  type: z.enum(["main", "spouse"]),
});

export type ApplicationRow = z.infer<typeof applicationSchema>;

function formatDate(dateStr: string): string {
  try {
    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(dateStr));
  } catch {
    return dateStr;
  }
}

export const applicationColumns: ColumnDef<ApplicationRow>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "Name",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
    cell: ({ row }) => (
      <div className="flex flex-col gap-0.5">
        <span className="font-medium">{row.original.Name}</span>
        <span className="text-muted-foreground text-xs">{row.original.Email}</span>
      </div>
    ),
    enableHiding: false,
  },
  {
    accessorKey: "type",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Type" />,
    cell: ({ row }) => (
      <Badge variant={row.original.type === "main" ? "default" : "secondary"}>
        {row.original.type === "main" ? "Main" : "Spouse"}
      </Badge>
    ),
    enableSorting: false,
  },
  {
    accessorKey: "Application_Handled_By",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Handled By" />,
    cell: ({ row }) => (
      <span className="text-sm">{row.original.Application_Handled_By}</span>
    ),
    enableSorting: false,
  },
  {
    accessorKey: "Qualified_Country",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Country" />,
    cell: ({ row }) =>
      row.original.Qualified_Country ? (
        <Badge variant="outline">{row.original.Qualified_Country}</Badge>
      ) : (
        <span className="text-muted-foreground text-xs">—</span>
      ),
    enableSorting: false,
  },
  {
    accessorKey: "Created_Time",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Date" />,
    cell: ({ row }) => (
      <span className="text-muted-foreground tabular-nums text-xs">
        {formatDate(row.original.Created_Time)}
      </span>
    ),
    enableSorting: false,
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const href =
        row.original.type === "main"
          ? `/v2/applications/${row.original.id}`
          : `/v2/spouse-skill-assessment-applications/${row.original.id}`;
      return (
        <Button variant="ghost" size="sm" asChild className="text-muted-foreground">
          <Link href={href}>
            <ExternalLink className="size-4" />
            <span className="sr-only">View application</span>
          </Link>
        </Button>
      );
    },
    enableSorting: false,
  },
];
