import { NextRequest, NextResponse } from 'next/server';
import { authenticatedFetch } from '@/lib/zoho';
import { parseToken, isTokenExpired } from '@/lib/auth';
import { ZOHO_BASE_URL } from '@/lib/config/api';

export async function GET(
  request: NextRequest,
  { params }: { params: { documentId: string; reviewId: string } }
) {
  try {
    // Try to get token from Authorization header first, then from cookies
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : request.cookies.get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { status: 'error', message: 'Authentication token not found' },
        { status: 401 }
      );
    }

    const parsedToken = parseToken(token);
    if (!parsedToken || isTokenExpired(parsedToken)) {
      return NextResponse.json(
        { status: 'error', message: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const { documentId, reviewId } = params;

    const zohoUrl = `${ZOHO_BASE_URL}/visa_applications/documents/${documentId}/requested_reviews/${reviewId}/messages`;
    
    const response = await authenticatedFetch(zohoUrl, token);

    return NextResponse.json(response);
  } catch (error) {
    console.error('Requested document messages API error:', error);
    return NextResponse.json(
      { 
        status: 'error', 
        message: error instanceof Error ? error.message : 'Failed to fetch messages' 
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { documentId: string; reviewId: string } }
) {
  try {
    // Try to get token from Authorization header first, then from cookies
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : request.cookies.get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { status: 'error', message: 'Authentication token not found' },
        { status: 401 }
      );
    }

    const parsedToken = parseToken(token);
    if (!parsedToken || isTokenExpired(parsedToken)) {
      return NextResponse.json(
        { status: 'error', message: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const { documentId, reviewId } = params;
    const body = await request.json();

    const zohoUrl = `${ZOHO_BASE_URL}/visa_applications/documents/${documentId}/requested_reviews/${reviewId}/messages`;
    
    const response = await authenticatedFetch(zohoUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }, token);

    return NextResponse.json(response);
  } catch (error) {
    console.error('Send requested document message API error:', error);
    return NextResponse.json(
      { 
        status: 'error', 
        message: error instanceof Error ? error.message : 'Failed to send message' 
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { documentId: string; reviewId: string } }
) {
  try {
    // Try to get token from Authorization header first, then from cookies
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : request.cookies.get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { status: 'error', message: 'Authentication token not found' },
        { status: 401 }
      );
    }

    const parsedToken = parseToken(token);
    if (!parsedToken || isTokenExpired(parsedToken)) {
      return NextResponse.json(
        { status: 'error', message: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const { documentId, reviewId } = params;
    const body = await request.json();

    const zohoUrl = `${ZOHO_BASE_URL}/visa_applications/documents/${documentId}/requested_reviews/${reviewId}/messages`;
    
    const response = await authenticatedFetch(zohoUrl, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    }, token);

    return NextResponse.json(response);
  } catch (error) {
    console.error('Delete requested document message API error:', error);
    return NextResponse.json(
      { 
        status: 'error', 
        message: error instanceof Error ? error.message : 'Failed to delete message' 
      },
      { status: 500 }
    );
  }
}
