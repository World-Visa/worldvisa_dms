'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { createNotification } from '@/lib/api/notifications';

export function NotificationTestButton() {
  const [isLoading, setIsLoading] = useState(false);

  const sendTestNotification = async () => {
    setIsLoading(true);
    try {
      await createNotification({
        message: 'Test notification from client',
        type: 'info',
        category: 'general',
        link: '/test'
      });
      console.log('Test notification sent successfully');
    } catch (error) {
      console.error('Failed to send test notification:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={sendTestNotification}
      disabled={isLoading}
      className="fixed bottom-4 left-4 z-50 bg-blue-500 hover:bg-blue-600"
      size="sm"
    >
      {isLoading ? 'Sending...' : 'Send Test Notification'}
    </Button>
  );
}
