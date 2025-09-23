"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Users, FileText, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import ManageUsers from "@/components/users/ManageUsers";

export default function AdminDashboard() {
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Admin Dashboard
        </h2>
        <p className="text-gray-600">
          Manage your document management system and oversee client
          applications.
        </p>
      </div>

      <Card className="my-4">
        <CardHeader>
          <CardTitle>Manage Users</CardTitle>
        </CardHeader>
        <CardContent>
          <ManageUsers />
        </CardContent>
      </Card>
    </main>
  );
}
