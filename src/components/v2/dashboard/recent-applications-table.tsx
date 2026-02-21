"use client";
"use no memo";

import { Download } from "lucide-react";

import { DataTable } from "@/components/v2/datatable/data-table";
import { DataTablePagination } from "@/components/v2/datatable/data-table-pagination";
import { DataTableViewOptions } from "@/components/v2/datatable/data-table-view-options";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useDataTableInstance } from "@/hooks/use-data-table-instance";

import { applicationColumns } from "./columns.application";

const recentApplicationsData = [
    {
      id: "L-1012",
      name: "Guillermo Rauch",
      company: "Vercel",
      status: "Qualified",
      source: "Website",
      lastActivity: "30m ago",
    },
    {
      id: "L-1018",
      name: "Nizzy",
      company: "Mail0",
      status: "Qualified",
      source: "Website",
      lastActivity: "35m ago",
    },
    {
      id: "L-1005",
      name: "Sahaj",
      company: "Tweakcn",
      status: "Negotiation",
      source: "Website",
      lastActivity: "1h ago",
    },
    {
      id: "L-1001",
      name: "Shadcn",
      company: "Shadcn/ui",
      status: "Qualified",
      source: "Website",
      lastActivity: "2h ago",
    },
    {
      id: "L-1003",
      name: "Sam Altman",
      company: "OpenAI",
      status: "Proposal Sent",
      source: "Social Media",
      lastActivity: "4h ago",
    },
    {
      id: "L-1008",
      name: "Michael Andreuzza",
      company: "Lexington Themes",
      status: "Contacted",
      source: "Social Media",
      lastActivity: "5h ago",
    },
    {
      id: "L-1016",
      name: "Skyleen",
      company: "Animate UI",
      status: "Proposal Sent",
      source: "Referral",
      lastActivity: "7h ago",
    },
    {
      id: "L-1007",
      name: "Arham Khan",
      company: "Weblabs Studio",
      status: "Won",
      source: "Website",
      lastActivity: "6h ago",
    },
    {
      id: "L-1011",
      name: "Sebastian Rindom",
      company: "Medusa",
      status: "Proposal Sent",
      source: "Referral",
      lastActivity: "10h ago",
    },
    {
      id: "L-1014",
      name: "Fred K. Schott",
      company: "Astro",
      status: "Contacted",
      source: "Social Media",
      lastActivity: "12h ago",
    },
    {
      id: "L-1010",
      name: "Peer Richelsen",
      company: "Cal.com",
      status: "New",
      source: "Other",
      lastActivity: "8h ago",
    },
    {
      id: "L-1002",
      name: "Ammar Khnz",
      company: "BE",
      status: "Contacted",
      source: "Referral",
      lastActivity: "1d ago",
    },
    {
      id: "L-1015",
      name: "Toby",
      company: "Shadcn UI Kit ",
      status: "Negotiation",
      source: "Other",
      lastActivity: "2d ago",
    },
    {
      id: "L-1006",
      name: "David Haz",
      company: "React Bits",
      status: "Qualified",
      source: "Referral",
      lastActivity: "2d ago",
    },
    {
      id: "L-1004",
      name: "Erşad",
      company: "Align UI",
      status: "New",
      source: "Cold Outreach",
      lastActivity: "3d ago",
    },
  ];

export function RecentApplicationsTable() {
  const table = useDataTableInstance({
    data: recentApplicationsData,
    columns: applicationColumns,
    getRowId: (row) => row.id.toString(),
  });

  return (
    <div className="grid grid-cols-1 gap-4 *:data-[slot=card]:shadow-xs">
      <Card>
        <CardHeader>
          <CardTitle>Recent Applications</CardTitle>
          <CardDescription>Track and manage your latest leads and their status.</CardDescription>
          <CardAction>
            <div className="flex items-center gap-2">
              <DataTableViewOptions table={table} />
              <Button variant="outline" size="sm">
                <Download />
                <span className="hidden lg:inline">Export</span>
              </Button>
            </div>
          </CardAction>
        </CardHeader>
        <CardContent className="flex size-full flex-col gap-4">
          <div className="overflow-hidden rounded-md border">
            <DataTable table={table} columns={applicationColumns} />
          </div>
          <DataTablePagination table={table} />
        </CardContent>
      </Card>
    </div>
  );
}