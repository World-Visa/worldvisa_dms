import { NextRequest, NextResponse } from 'next/server';
import { authenticatedFetch } from '@/lib/zoho';
import { parseToken, isTokenExpired } from '@/lib/auth';
import { ZOHO_BASE_URL } from '@/lib/config/api';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { 
          status: 'error', 
          message: 'Authorization token required' 
        },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    
    // Parse and validate token
    const payload = parseToken(token);    
    if (!payload) {
      return NextResponse.json(
        { 
          status: 'error', 
          message: 'Invalid token' 
        },
        { status: 401 }
      );
    }

    // Check if token is expired
    if (isTokenExpired(token)) {
      return NextResponse.json(
        { 
          status: 'error', 
          message: 'Token expired' 
        },
        { status: 401 }
      );
    }

    // Get query parameters for search
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');
    const phone = searchParams.get('phone');
    const email = searchParams.get('email');

    // Validate that at least one search parameter is provided
    if (!name && !phone && !email) {
      return NextResponse.json(
        { 
          status: 'error', 
          message: 'At least one search parameter (name, phone, or email) is required' 
        },
        { status: 400 }
      );
    }

    // Build query string for Zoho search API
    const queryParams = new URLSearchParams();
    
    if (name) queryParams.append('name', name);
    if (phone) queryParams.append('phone', phone);
    if (email) queryParams.append('email', email);

    // Use the search endpoint from Zoho API
    const zohoUrl = `${ZOHO_BASE_URL}/visa_applications/search?${queryParams.toString()}`;
    
    const response = await authenticatedFetch(zohoUrl, token);

    return NextResponse.json(response);
  } catch (error) {
    console.error('Visa applications search API error:', error);
    
    return NextResponse.json(
      { 
        status: 'error', 
        message: error instanceof Error ? error.message : 'Failed to search applications' 
      },
      { status: 500 }
    );
  }
}
