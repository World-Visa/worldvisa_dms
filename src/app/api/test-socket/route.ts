import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Test if we can reach the socket server
    const socketUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://worldvisagroup-19a980221060.herokuapp.com';
    const testUrl = `${socketUrl}/socket.io/`;
    
    console.log('Testing socket server at:', testUrl);
    
    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });
    
    return NextResponse.json({
      success: true,
      socketUrl,
      status: response.status,
      statusText: response.statusText,
      message: response.status === 200 ? 'Socket server is reachable' : 'Socket server may not be available'
    });
  } catch (error) {
    console.error('Socket test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Socket server is not reachable'
    }, { status: 500 });
  }
}
