import { type NextRequest } from "next/server";
import { proxyToBackend } from "@/lib/api/server/proxy";

async function handler(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  return proxyToBackend(req, `/api/zoho_dms/${path.join("/")}`);
}

export {
  handler as GET,
  handler as POST,
  handler as PUT,
  handler as PATCH,
  handler as DELETE,
};
