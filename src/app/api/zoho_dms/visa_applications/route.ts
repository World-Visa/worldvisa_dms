import { NextRequest, NextResponse } from 'next/server';
import { authenticatedFetch } from '@/lib/zoho';
import { parseToken, isTokenExpired } from '@/lib/auth';

const ZOHO_BASE_URL = 'https://worldvisagroup-19a980221060.herokuapp.com/api/zoho_dms';

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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || '1';
    const limit = searchParams.get('limit') || '20';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build query string for Zoho API
    const queryParams = new URLSearchParams({
      page,
      limit,
    });

    if (startDate) queryParams.append('startDate', startDate);
    if (endDate) queryParams.append('endDate', endDate);

    // Use the existing authenticatedFetch from zoho.ts
    const zohoUrl = `${ZOHO_BASE_URL}/visa_applications?${queryParams.toString()}`;
    const response = await authenticatedFetch(zohoUrl, token);

    return NextResponse.json(response);
  } catch (error) {
    console.error('Visa applications API error:', error);
    
    return NextResponse.json(
      { 
        status: 'error', 
        message: error instanceof Error ? error.message : 'Failed to fetch applications' 
      },
      { status: 500 }
    );
  }
}
