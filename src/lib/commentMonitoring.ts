import * as Sentry from '@sentry/nextjs';

export interface CommentMetrics {
  totalComments: number;
  commentsByUser: Record<string, number>;
  averageResponseTime: number;
  errorRate: number;
  realtimeConnectionUptime: number;
}

export class CommentMonitor {
  private static instance: CommentMonitor;
  private metrics: CommentMetrics = {
    totalComments: 0,
    commentsByUser: {},
    averageResponseTime: 0,
    errorRate: 0,
    realtimeConnectionUptime: 0
  };
  private responseTimes: number[] = [];
  private errors: number = 0;
  private totalRequests: number = 0;
  private connectionStartTime: number = 0;
  private isConnected: boolean = false;

  static getInstance(): CommentMonitor {
    if (!CommentMonitor.instance) {
      CommentMonitor.instance = new CommentMonitor();
    }
    return CommentMonitor.instance;
  }

  // Track comment creation
  trackCommentCreated(user: string, responseTime: number) {
    this.totalRequests++;
    this.responseTimes.push(responseTime);
    this.metrics.totalComments++;
    
    if (!this.metrics.commentsByUser[user]) {
      this.metrics.commentsByUser[user] = 0;
    }
    this.metrics.commentsByUser[user]++;

    // Update average response time
    this.metrics.averageResponseTime = 
      this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length;

    // Log to Sentry for monitoring
    Sentry.addBreadcrumb({
      message: 'Comment created',
      category: 'comment',
      data: {
        user,
        responseTime,
        totalComments: this.metrics.totalComments
      },
      level: 'info'
    });
  }

  // Track comment errors
  trackCommentError(error: Error, context: Record<string, unknown> = {}) {
    this.errors++;
    this.totalRequests++;
    this.metrics.errorRate = (this.errors / this.totalRequests) * 100;

    Sentry.captureException(error, {
      tags: {
        component: 'comment_system',
        operation: 'comment_creation'
      },
      extra: {
        ...context,
        errorRate: this.metrics.errorRate,
        totalErrors: this.errors
      }
    });
  }

  // Track real-time connection events
  trackRealtimeConnection(isConnected: boolean) {
    const now = Date.now();
    
    if (isConnected && !this.isConnected) {
      // Connection established
      this.connectionStartTime = now;
      this.isConnected = true;
      
      Sentry.addBreadcrumb({
        message: 'Realtime connection established',
        category: 'realtime',
        level: 'info'
      });
    } else if (!isConnected && this.isConnected) {
      // Connection lost
      if (this.connectionStartTime > 0) {
        const uptime = now - this.connectionStartTime;
        this.metrics.realtimeConnectionUptime = uptime;
        
        Sentry.addBreadcrumb({
          message: 'Realtime connection lost',
          category: 'realtime',
          data: {
            uptimeMs: uptime,
            uptimeMinutes: Math.round(uptime / 60000)
          },
          level: 'warning'
        });
      }
      this.isConnected = false;
    }
  }

  // Track comment fetch performance
  trackCommentFetch(documentId: string, responseTime: number, commentCount: number) {
    this.responseTimes.push(responseTime);
    this.metrics.averageResponseTime = 
      this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length;

    Sentry.addBreadcrumb({
      message: 'Comments fetched',
      category: 'comment',
      data: {
        documentId,
        responseTime,
        commentCount,
        averageResponseTime: this.metrics.averageResponseTime
      },
      level: 'info'
    });
  }

  // Get current metrics
  getMetrics(): CommentMetrics {
    return { ...this.metrics };
  }

  // Reset metrics (useful for testing)
  resetMetrics() {
    this.metrics = {
      totalComments: 0,
      commentsByUser: {},
      averageResponseTime: 0,
      errorRate: 0,
      realtimeConnectionUptime: 0
    };
    this.responseTimes = [];
    this.errors = 0;
    this.totalRequests = 0;
    this.connectionStartTime = 0;
    this.isConnected = false;
  }

  // Report performance issues
  reportPerformanceIssue(operation: string, responseTime: number, threshold: number = 2000) {
    if (responseTime > threshold) {
      Sentry.captureMessage(`Slow comment operation: ${operation}`, {
        level: 'warning',
        tags: {
          component: 'comment_system',
          operation
        },
        extra: {
          responseTime,
          threshold,
          averageResponseTime: this.metrics.averageResponseTime
        }
      });
    }
  }

  // Report high error rate
  reportHighErrorRate() {
    if (this.metrics.errorRate > 10) { // More than 10% error rate
      Sentry.captureMessage('High comment system error rate detected', {
        level: 'error',
        tags: {
          component: 'comment_system'
        },
        extra: {
          errorRate: this.metrics.errorRate,
          totalErrors: this.errors,
          totalRequests: this.totalRequests
        }
      });
    }
  }
}

// Export singleton instance
export const commentMonitor = CommentMonitor.getInstance();
