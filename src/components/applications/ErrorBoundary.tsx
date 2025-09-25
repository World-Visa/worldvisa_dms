'use client';

import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error?: Error; resetError: () => void }>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return <FallbackComponent error={this.state.error} resetError={this.resetError} />;
    }

    return this.props.children;
  }
}

function DefaultErrorFallback({ error, resetError }: { error?: Error; resetError: () => void }) {
  return (
    <div className="flex items-center justify-center min-h-[200px] p-6">
      <Alert variant="destructive" className="max-w-md">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription className="mt-2">
          <div className="space-y-3">
            <p className="font-medium">Something went wrong</p>
            <p className="text-sm">
              {error?.message || 'An unexpected error occurred while loading the component.'}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={resetError}
              className="mt-2"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
}

// Hook for error handling in functional components
export function useErrorHandler() {
  return {
    handleError: (error: Error, context?: string) => {
      console.error(`Error in ${context || 'component'}:`, error);
      
      // You can integrate with error reporting services here
      // Example: Sentry.captureException(error, { tags: { context } });
    },
    
    handleAsyncError: (error: unknown, context?: string) => {
      const errorMessage = error instanceof Error ? error : new Error(String(error));
      console.error(`Async error in ${context || 'component'}:`, errorMessage);
      
      // You can integrate with error reporting services here
      // Example: Sentry.captureException(errorMessage, { tags: { context } });
    }
  };
}
