import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import * as Sentry from "@sentry/nextjs";

const ADMIN_ROLES = ["admin", "team_leader", "master_admin", "supervisor"];

export async function GET(request: NextRequest) {
  try {
    const { userId, sessionClaims } = await auth();

    if (!userId) {
      return new Response("Unauthorized", { status: 401 });
    }

    const role = (sessionClaims?.publicMetadata as { role?: string } | undefined)?.role;
    if (!role || !ADMIN_ROLES.includes(role)) {
      return new Response("Forbidden - Clients cannot access messages", {
        status: 403,
      });
    }

    // Create SSE response
    const stream = new ReadableStream({
      start(controller) {
        // Send initial connection event
        const initEvent = `data: ${JSON.stringify({
          type: "connected",
          timestamp: new Date().toISOString(),
        })}\n\n`;
        controller.enqueue(new TextEncoder().encode(initEvent));

        // Keep connection alive with periodic ping
        const pingInterval = setInterval(() => {
          try {
            const pingEvent = `data: ${JSON.stringify({
              type: "ping",
              timestamp: new Date().toISOString(),
            })}\n\n`;
            controller.enqueue(new TextEncoder().encode(pingEvent));
          } catch {
            clearInterval(pingInterval);
            controller.close();
          }
        }, 30000); // Ping every 30 seconds

        // Handle client disconnect
        request.signal.addEventListener("abort", () => {
          clearInterval(pingInterval);
          controller.close();
        });
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Cache-Control",
      },
    });
  } catch (error) {
    console.error("SSE connection error:", error);

    Sentry.captureException(error, {
      tags: { operation: "sse_connection_messages" },
    });

    return new Response("Internal Server Error", { status: 500 });
  }
}
