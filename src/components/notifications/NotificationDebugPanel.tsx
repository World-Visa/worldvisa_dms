/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNotificationConnection } from '@/hooks/useNotifications';
import { notificationSocket } from '@/lib/notificationSocket';

export function NotificationDebugPanel() {
  const [message, setMessage] = useState('Test notification message');
  const [type, setType] = useState<'info' | 'success' | 'warning' | 'error'>('info');
  const [category, setCategory] = useState<'general' | 'messages' | 'documents' | 'applications' | 'system'>('general');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string>('');
  
  const { isConnected, isConnecting, error, metrics } = useNotificationConnection();

  const testSocketConnection = async () => {
    setIsLoading(true);
    setResult('');
    
    try {
      const response = await fetch('/api/test-socket');
      const data = await response.json();
      setResult(JSON.stringify(data, null, 2));
    } catch (error) {
      setResult(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const createTestNotification = async () => {
    setIsLoading(true);
    setResult('');
    
    try {
      const response = await fetch('/api/test-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message, type, category }),
      });
      
      const data = await response.json();
      setResult(JSON.stringify(data, null, 2));
    } catch (error) {
      setResult(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testSocketReconnect = () => {
    notificationSocket.disconnect();
    setTimeout(() => {
      notificationSocket.connect();
    }, 1000);
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Notification System Debug Panel</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Connection Status */}
        <div className="space-y-2">
          <h3 className="font-semibold">Connection Status</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Connected:</span> 
              <span className={`ml-2 ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
                {isConnected ? 'Yes' : 'No'}
              </span>
            </div>
            <div>
              <span className="font-medium">Connecting:</span> 
              <span className={`ml-2 ${isConnecting ? 'text-yellow-600' : 'text-gray-600'}`}>
                {isConnecting ? 'Yes' : 'No'}
              </span>
            </div>
            <div>
              <span className="font-medium">Error:</span> 
              <span className={`ml-2 ${error ? 'text-red-600' : 'text-gray-600'}`}>
                {error || 'None'}
              </span>
            </div>
            <div>
              <span className="font-medium">Connection Attempts:</span> 
              <span className="ml-2">{metrics.connectionAttempts}</span>
            </div>
          </div>
        </div>

        {/* Socket Tests */}
        <div className="space-y-2">
          <h3 className="font-semibold">Socket Tests</h3>
          <div className="flex gap-2">
            <Button onClick={testSocketConnection} disabled={isLoading}>
              Test Socket Server
            </Button>
            <Button onClick={testSocketReconnect} variant="outline">
              Reconnect Socket
            </Button>
          </div>
        </div>

        {/* Notification Test */}
        <div className="space-y-2">
          <h3 className="font-semibold">Create Test Notification</h3>
          <div className="space-y-3">
            <div>
              <Label htmlFor="message">Message</Label>
              <Input
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Enter notification message"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="type">Type</Label>
                <Select value={type} onValueChange={(value: any) => setType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="success">Success</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Select value={category} onValueChange={(value: any) => setCategory(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="messages">Messages</SelectItem>
                    <SelectItem value="documents">Documents</SelectItem>
                    <SelectItem value="applications">Applications</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={createTestNotification} disabled={isLoading}>
              Create Test Notification
            </Button>
          </div>
        </div>

        {/* Results */}
        {result && (
          <div className="space-y-2">
            <h3 className="font-semibold">Result</h3>
            <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-40">
              {result}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
