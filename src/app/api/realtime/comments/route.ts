import { NextRequest } from "next/server";
import { parseToken, isTokenExpired, getUserRole } from "@/lib/auth";
import * as Sentry from "@sentry/nextjs";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");
    const role = searchParams.get("role");

    if (!token) {
      return new Response("Unauthorized", { status: 401 });
    }

    // Validate token
    const payload = parseToken(token);
    if (!payload) {
      return new Response("Invalid token", { status: 401 });
    }

    if (isTokenExpired(token)) {
      return new Response("Token expired", { status: 401 });
    }

    // Verify user role (allow both admin and client for real-time updates)
    const jwtRole = getUserRole(token);
    const headerRole = request.headers.get("x-user-role");
    // Check role from JWT token, URL parameter, or custom header - allow admin, team_leader, master_admin, and client
    const isAuthorized =
      jwtRole === "admin" ||
      jwtRole === "team_leader" ||
      jwtRole === "master_admin" ||
      jwtRole === "client" ||
      role === "admin" ||
      role === "team_leader" ||
      role === "master_admin" ||
      role === "client" ||
      headerRole === "admin" ||
      headerRole === "team_leader" ||
      headerRole === "master_admin" ||
      headerRole === "client";

    if (!isAuthorized) {
      return new Response("Forbidden", { status: 403 });
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
      tags: { operation: "sse_connection" },
    });

    return new Response("Internal Server Error", { status: 500 });
  }
}
