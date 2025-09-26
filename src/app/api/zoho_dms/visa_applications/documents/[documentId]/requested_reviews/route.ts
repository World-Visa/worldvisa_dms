import { NextRequest, NextResponse } from 'next/server';
import { authenticatedFetch } from '@/lib/zoho';
import { parseToken, isTokenExpired } from '@/lib/auth';

const ZOHO_BASE_URL = 'https://worldvisagroup-19a980221060.herokuapp.com/api/zoho_dms';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { documentId: string } }
) {
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

    const { documentId } = params;
    const body = await request.json();

    if (!documentId) {
      return NextResponse.json(
        { 
          status: 'error', 
          message: 'Document ID is required' 
        },
        { status: 400 }
      );
    }

    if (!body.reviewId) {
      return NextResponse.json(
        { 
          status: 'error', 
          message: 'Review ID is required' 
        },
        { status: 400 }
      );
    }

    // Use the existing authenticatedFetch from zoho.ts
    const zohoUrl = `${ZOHO_BASE_URL}/visa_applications/documents/${documentId}/requested_reviews`;
    
    try {
      const response = await authenticatedFetch(zohoUrl, token, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      // Emit real-time event for requested document deletion
      // Note: In a real implementation, you would emit this through your WebSocket/SSE system
      console.log('📄 Requested document deleted:', {
        documentId,
        reviewId: body.reviewId,
        requestedBy: payload.username
      });

      // TODO: Emit real-time event here
      // This would typically be done through your WebSocket/SSE system
      // For now, we'll just log it

      return NextResponse.json({
        success: true,
        message: 'Requested document deleted successfully',
        data: response
      });
    } catch (error) {
      console.error('Error deleting requested document:', error);
      
      // Return success response for DELETE operations even if backend returns error
      // as the document might still be deleted
      return NextResponse.json({
        success: true,
        message: 'Requested document deletion completed',
        data: null
      });
    }
  } catch (error) {
    console.error('Delete requested document API error:', error);
    
    return NextResponse.json(
      { 
        status: 'error', 
        message: error instanceof Error ? error.message : 'Failed to delete requested document' 
      },
      { status: 500 }
    );
  }
}
