# WorldVisa DMS Comment System

A production-grade, real-time comment system for document management with optimistic updates, error handling, and comprehensive monitoring.

## 🚀 Features

- **Real-time Updates**: Server-Sent Events (SSE) with automatic reconnection
- **Optimistic UI**: Instant comment display with rollback on errors
- **Priority Comments**: Kavitha's comments are highlighted and pinned at the top
- **Error Handling**: Comprehensive error boundaries and Sentry integration
- **Performance Monitoring**: Built-in metrics and performance tracking
- **Fallback Polling**: Automatic fallback when real-time connection fails
- **Type Safety**: Full TypeScript support with strict typing

## 📁 File Structure

```
src/
├── types/
│   └── comments.d.ts                    # Comment type definitions
├── app/api/
│   ├── zoho_dms/visa_applications/documents/[documentId]/comments/
│   │   └── route.ts                     # API proxy for Zoho comment endpoints
│   └── realtime/comments/
│       └── route.ts                     # SSE endpoint for real-time updates
├── lib/
│   ├── realtime.ts                      # Real-time connection manager
│   └── commentMonitoring.ts             # Performance monitoring and metrics
├── hooks/
│   ├── useDocumentComments.ts           # TanStack Query hook for fetching comments
│   └── useCommentMutations.ts           # Mutation hook for adding comments
└── components/applications/
    ├── CommentForm.tsx                  # Comment input form with validation
    ├── DocumentComments.tsx             # Comment list with real-time updates
    ├── CommentErrorBoundary.tsx         # Error boundary for comment system
    └── ViewDocumentSheet.tsx            # Updated to integrate comment system
```

## 🔧 API Endpoints

### GET /api/zoho_dms/visa_applications/documents/[documentId]/comments
Fetches all comments for a specific document.

**Headers:**
- `Authorization: Bearer <JWT>`

**Response:**
```json
{
  "status": "success",
  "data": [
    {
      "_id": "comment_id",
      "comment": "Comment text",
      "added_by": "User Name",
      "created_at": "2024-01-15T10:30:00Z",
      "document_id": "document_id",
      "is_important": false
    }
  ]
}
```

### POST /api/zoho_dms/visa_applications/documents/[documentId]/comments
Adds a new comment to a document.

**Headers:**
- `Authorization: Bearer <JWT>`
- `Content-Type: application/json`

**Body:**
```json
{
  "comment": "Comment text",
  "added_by": "User Name"
}
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "_id": "new_comment_id",
    "comment": "Comment text",
    "added_by": "User Name",
    "created_at": "2024-01-15T10:30:00Z",
    "document_id": "document_id",
    "is_important": false
  }
}
```

### GET /api/realtime/comments
Server-Sent Events endpoint for real-time comment updates.

**Query Parameters:**
- `token`: JWT authentication token

**Events:**
- `connected`: Initial connection confirmation
- `ping`: Keep-alive ping (every 30 seconds)
- `comment_added`: New comment added
- `comment_updated`: Comment updated
- `comment_deleted`: Comment deleted

## 🎯 Usage

### Basic Integration

```tsx
import { ViewDocumentSheet } from '@/components/applications/ViewDocumentSheet';

function DocumentPage() {
  return (
    <ViewDocumentSheet
      documentId="doc_123"
      documentName="Passport.pdf"
      uploadedBy="John Doe"
      uploadedAt="2024-01-15"
      status="pending"
    />
  );
}
```

### Using Hooks Directly

```tsx
import { useDocumentComments, useAddComment } from '@/hooks';

function CommentSection({ documentId }: { documentId: string }) {
  const { comments, isLoading, error } = useDocumentComments(documentId);
  const addComment = useAddComment(documentId);

  const handleAddComment = async (text: string) => {
    try {
      await addComment.mutateAsync({
        comment: text,
        added_by: 'Current User'
      });
    } catch (error) {
      console.error('Failed to add comment:', error);
    }
  };

  return (
    <div>
      {isLoading && <div>Loading comments...</div>}
      {error && <div>Error: {error.message}</div>}
      {comments.map(comment => (
        <div key={comment._id}>
          <strong>{comment.added_by}:</strong> {comment.comment}
        </div>
      ))}
    </div>
  );
}
```

## 🔄 Real-time Updates

The system uses Server-Sent Events (SSE) for real-time updates with automatic fallback to polling:

1. **Primary**: SSE connection for instant updates
2. **Fallback**: Polling every 5 seconds when SSE is unavailable
3. **Reconnection**: Exponential backoff with max 5 attempts
4. **Deduplication**: Prevents duplicate comments from real-time events

### Connection States

- 🟢 **Live**: Real-time connection active
- 🟡 **Connecting**: Attempting to establish connection
- 🔴 **Offline**: Connection failed, using polling fallback

## 🎨 Comment Prioritization

Comments from Kavitha are automatically prioritized:

- **Visual Emphasis**: Purple gradient background and border
- **Badge**: "Important" badge displayed
- **Positioning**: Always appear at the top of the comment list
- **Sorting**: Kavitha's comments first, then by creation date (newest first)

## 📊 Monitoring & Analytics

The system includes comprehensive monitoring:

### Metrics Tracked
- Total comments created
- Comments per user
- Average response time
- Error rate
- Real-time connection uptime

### Performance Monitoring
- Slow operation detection (>2s threshold)
- High error rate alerts (>10% threshold)
- Response time tracking
- Connection stability monitoring

### Sentry Integration
- Error tracking and reporting
- Performance monitoring
- User context and breadcrumbs
- Custom tags and metadata

## 🛡️ Error Handling

### Error Boundaries
- Component-level error boundaries
- Graceful fallback UI
- Automatic retry mechanisms

### Validation
- Comment length validation (1-1000 characters)
- Required field validation
- JWT token validation
- Role-based access control

### Network Resilience
- Automatic retry with exponential backoff
- Offline detection and handling
- Connection state management
- Optimistic updates with rollback

## 🔐 Security

- JWT token validation on all endpoints
- Role-based access control (admin/master_admin only)
- Input sanitization and validation
- Rate limiting considerations
- Secure token handling

## 🚀 Performance Optimizations

- **Optimistic Updates**: Instant UI feedback
- **Query Caching**: TanStack Query for efficient data management
- **Deduplication**: Prevents duplicate requests and events
- **Lazy Loading**: Comments loaded on demand
- **Connection Pooling**: Efficient real-time connections
- **Debouncing**: Prevents rapid-fire requests

## 🧪 Testing Considerations

The system is designed for easy testing:

- Mock data support in components
- Error boundary testing
- Real-time connection simulation
- Performance metric validation
- Error scenario testing

## 📈 Future Enhancements

Potential improvements for the comment system:

1. **Rich Text Support**: Markdown or rich text editing
2. **File Attachments**: Support for comment attachments
3. **Comment Threading**: Nested reply system
4. **Mention System**: @user notifications
5. **Comment Reactions**: Like/dislike functionality
6. **Bulk Operations**: Multi-comment actions
7. **Export Features**: Comment history export
8. **Advanced Filtering**: Filter by user, date, importance

## 🔧 Configuration

### Environment Variables
```env
NEXT_PUBLIC_API_URL=http://localhost:3000  # For SSE connections
JWT_SECRET=your-jwt-secret                 # For token validation
```

### Zoho Integration
The system acts as a proxy to Zoho's API:
- Base URL: `https://worldvisagroup-19a980221060.herokuapp.com/api/zoho_dms`
- Authentication: Server-side token handling
- Error handling: Comprehensive error mapping

## 📝 Development Notes

- All components are fully typed with TypeScript
- Follows existing codebase patterns and conventions
- Uses existing UI components and styling
- Integrates with current authentication system
- Maintains backward compatibility
- Production-ready with comprehensive error handling

## 🎉 Conclusion

This comment system provides a robust, scalable, and user-friendly solution for document collaboration in the WorldVisa DMS. It combines modern real-time technologies with proven patterns for optimal performance and reliability.
