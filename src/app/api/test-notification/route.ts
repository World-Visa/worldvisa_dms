import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, type = 'info', category = 'general' } = body;
    
    if (!message) {
      return NextResponse.json({
        success: false,
        message: 'Message is required'
      }, { status: 400 });
    }
    
    // Create a test notification
    const testNotification = {
      _id: `test-${Date.now()}`,
      user: 'test-user',
      message,
      type,
      category,
      link: null,
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    
    console.log('Test notification created:', testNotification);
    
    return NextResponse.json({
      success: true,
      data: testNotification,
      message: 'Test notification created successfully'
    });
  } catch (error) {
    console.error('Test notification error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to create test notification'
    }, { status: 500 });
  }
}
