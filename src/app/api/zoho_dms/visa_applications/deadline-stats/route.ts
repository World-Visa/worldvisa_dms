import { NextRequest, NextResponse } from 'next/server';
import { authenticatedFetch } from '@/lib/zoho';
import { parseToken, isTokenExpired } from '@/lib/auth';
import { ZOHO_BASE_URL } from '@/lib/config/api';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { status: 'error', message: 'Authorization token required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    const payload = parseToken(token);
    if (!payload) {
      return NextResponse.json(
        { status: 'error', message: 'Invalid token' },
        { status: 401 }
      );
    }

    if (isTokenExpired(token)) {
      return NextResponse.json(
        { status: 'error', message: 'Token expired' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    if (type !== 'visa' && type !== 'spouse') {
      return NextResponse.json(
        { status: 'error', message: 'Invalid or missing type (use visa or spouse)' },
        { status: 400 }
      );
    }

    const zohoUrl = `${ZOHO_BASE_URL}/visa_applications/deadline-stats?type=${type}`;
    const response = await authenticatedFetch<{ data: unknown }>(zohoUrl, token);

    return NextResponse.json(response);
  } catch (error) {
    console.error('Deadline stats API error:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to fetch deadline stats',
      },
      { status: 500 }
    );
  }
}
