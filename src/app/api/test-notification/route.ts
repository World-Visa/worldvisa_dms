import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Create a test notification
    const testNotification = {
      _id: `test_${Date.now()}`,
      user: 'test-user',
      message: body.message || 'Test notification from local API',
      type: body.type || 'info',
      category: body.category || 'general',
      link: body.link || null,
      isRead: false,
      createdAt: new Date().toISOString(),
    };

    console.log('🔔 Local API: Created test notification:', testNotification);

    // TODO: Emit socket event here
    // This is where we would emit the socket event to notify all connected clients
    // For now, we'll just return the notification

    return NextResponse.json({
      status: 'success',
      data: testNotification,
      message: 'Test notification created successfully'
    });

  } catch (error) {
    console.error('🔔 Local API: Error creating test notification:', error);
    return NextResponse.json(
      { status: 'error', message: 'Failed to create test notification' },
      { status: 500 }
    );
  }
}
