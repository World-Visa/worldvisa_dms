import { auth } from "@clerk/nextjs/server";
import { type NextRequest, NextResponse } from "next/server";
import { BACKEND_HOST } from "@/lib/config/api";

interface AdminUser {
  username?: string;
  email?: string;
}

interface UsersResponse {
  data?: {
    users?: AdminUser[];
  };
}

async function fetchUsersWithSearch(token: string, search: string): Promise<AdminUser[]> {
  const url = `${BACKEND_HOST}/api/zoho_dms/users/all?search=${encodeURIComponent(search)}&limit=500`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return [];
  const json: UsersResponse = await res.json();
  return json.data?.users ?? [];
}

export async function GET(req: NextRequest) {
  const { userId, getToken } = await auth();
  if (!userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const token = await getToken();
  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const username = searchParams.get("username");
  const email = searchParams.get("email");

  const result: { username?: boolean; email?: boolean } = {};

  if (username) {
    const users = await fetchUsersWithSearch(token, username);
    result.username = users.some(
      (u) => u.username?.toLowerCase() === username.toLowerCase(),
    );
  }

  if (email) {
    const users = await fetchUsersWithSearch(token, email);
    result.email = users.some(
      (u) => u.email?.toLowerCase() === email.toLowerCase(),
    );
  }

  return NextResponse.json(result);
}
