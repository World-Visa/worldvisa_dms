import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { BACKEND_HOST } from "@/lib/config/api";

export async function proxyToBackend(req: NextRequest, backendPath: string): Promise<NextResponse> {
  const { userId, getToken } = await auth();

  if (!userId) {
    return NextResponse.json(
      { status: "error", message: "Unauthorized" },
      { status: 401 },
    );
  }

  const token = await getToken();
  const url = `${BACKEND_HOST}${backendPath}${req.nextUrl.search}`;

  const headers: HeadersInit = { Authorization: `Bearer ${token}` };
  const contentType = req.headers.get("content-type");
  if (contentType) (headers as Record<string, string>)["Content-Type"] = contentType;

  const body =
    req.method === "GET" || req.method === "HEAD"
      ? undefined
      : Buffer.from(await req.arrayBuffer());

  const res = await fetch(url, { method: req.method, headers, body });
  const resBody = await res.arrayBuffer();

  return new NextResponse(resBody, {
    status: res.status,
    headers: {
      "Content-Type": res.headers.get("content-type") ?? "application/json",
    },
  });
}
