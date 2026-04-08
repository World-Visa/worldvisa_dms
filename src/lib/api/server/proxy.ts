import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { BACKEND_HOST } from "@/lib/config/api";

const SEARCH_VALIDATED_PATHS = new Set([
  "/api/zoho_dms/users/all",
  "/api/zoho_dms/clients/all",
]);

function validateUserSearch(req: NextRequest): NextResponse | null {
  const hasSearchParam = req.nextUrl.searchParams.has("search");
  if (!hasSearchParam) return null;

  const raw = req.nextUrl.searchParams.get("search") ?? "";
  const trimmed = raw.trim();

  if (trimmed.length === 0) {
    return NextResponse.json(
      { status: "error", message: "Invalid search: `search` must not be empty." },
      { status: 400 },
    );
  }

  if (trimmed.length > 100) {
    return NextResponse.json(
      {
        status: "error",
        message: "Invalid search: `search` must be 100 characters or fewer.",
      },
      { status: 400 },
    );
  }

  return null;
}

export async function proxyToBackend(req: NextRequest, backendPath: string): Promise<NextResponse> {
  const { userId, getToken } = await auth();

  if (!userId) {
    return NextResponse.json(
      { status: "error", message: "Unauthorized" },
      { status: 401 },
    );
  }

  if (SEARCH_VALIDATED_PATHS.has(backendPath)) {
    const validationError = validateUserSearch(req);
    if (validationError) return validationError;
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
