import { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const token = searchParams.get('token');

  // Verify authentication
  if (!token) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const payload = await verifyToken(token);

    // Check if user has required role (ONLY admin, team_leader, master_admin, supervisor)
    const allowedRoles = ['admin', 'team_leader', 'master_admin', 'supervisor'];
    if (!allowedRoles.includes(payload.role)) {
      return new Response('Forbidden - Clients cannot access messages', { status: 403 });
    }

    // Create SSE stream
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        // Send initial connection event
        const connectEvent = `data: ${JSON.stringify({
          type: 'connected',
          timestamp: new Date().toISOString()
        })}\n\n`;
        controller.enqueue(encoder.encode(connectEvent));

        // Keep-alive ping every 30 seconds
        const pingInterval = setInterval(() => {
          try {
            const ping = `data: ${JSON.stringify({
              type: 'ping',
              timestamp: new Date().toISOString()
            })}\n\n`;
            controller.enqueue(encoder.encode(ping));
          } catch (error) {
            clearInterval(pingInterval);
            controller.close();
          }
        }, 30000);

        // Cleanup on close
        req.signal.addEventListener('abort', () => {
          clearInterval(pingInterval);
          controller.close();
        });
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (error) {
    return new Response('Unauthorized', { status: 401 });
  }
}
