'use client';

import React, { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, Users, AlertCircle } from 'lucide-react';

interface LoadingStateProps {
  onRetry?: () => void;
}

export const LoadingState = memo(function LoadingState({ onRetry }: LoadingStateProps) {
  return (
    <Card>
      <CardContent className="p-8">
        <div className="text-center">
          <div className="p-4 bg-blue-100 rounded-full w-fit mx-auto mb-4">
            <RefreshCw className="h-8 w-8 text-blue-600 animate-spin" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Loading Users
          </h3>
          <p className="text-gray-600">
            Please wait while we fetch the user data...
          </p>
        </div>
      </CardContent>
    </Card>
  );
});

interface ErrorStateProps {
  error: Error;
  onRetry?: () => void;
}

export const ErrorState = memo(function ErrorState({ error, onRetry }: ErrorStateProps) {
  return (
    <Card className="border-red-200 bg-red-50/50">
      <CardContent className="p-8">
        <div className="text-center">
          <div className="p-4 bg-red-100 rounded-full w-fit mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-red-800 mb-2">
            Error Loading Users
          </h3>
          <p className="text-red-700 mb-4">
            {error.message || 'Failed to load users. Please try again.'}
          </p>
          {onRetry && (
            <Button
              onClick={onRetry}
              className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
});

interface EmptyStateProps {
  onCreateUser?: () => void;
}

export const EmptyState = memo(function EmptyState({ onCreateUser }: EmptyStateProps) {
  return (
    <Card className="border-blue-200 bg-blue-50/50">
      <CardContent className="p-8">
        <div className="text-center">
          <div className="p-4 bg-blue-100 rounded-full w-fit mx-auto mb-4">
            <Users className="h-8 w-8 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            No Users Found
          </h3>
          <p className="text-blue-700 mb-4">
            There are currently no users in the system. Create your first user to get started.
          </p>
          {onCreateUser && (
            <Button
              onClick={onCreateUser}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Users className="h-4 w-4 mr-2" />
              Create First User
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
});
