import type { ColumnDef } from "@tanstack/react-table";
import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { z } from "zod";

import { DataTableColumnHeader } from "@/components/v2/datatable/data-table-column-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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

export const applicationColumns: ColumnDef<ApplicationRow>[] = [
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
