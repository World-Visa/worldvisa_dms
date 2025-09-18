import { NextRequest, NextResponse } from "next/server";
import { authenticatedFetch } from "@/lib/zoho";
import { parseToken, isTokenExpired, getUserRole } from "@/lib/auth";
import {
  AddCommentRequest,
  GetCommentsResponse,
  AddCommentResponse,
  ZohoComment,
} from "@/types/comments";
import * as Sentry from "@sentry/nextjs";

const ZOHO_BASE_URL =
  "https://worldvisagroup-19a980221060.herokuapp.com/api/zoho_dms";


// GET /api/zoho_dms/visa_applications/documents/[documentId]/comment
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  try {
    const { documentId } = await params;

    if (!documentId) {
      return NextResponse.json(
        {
          status: "error",
          message: "Document ID is required",
        },
        { status: 400 }
      );
    }

    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        {
          status: "error",
          message: "Authorization token required",
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
          status: "error",
          message: "Invalid token",
        },
        { status: 401 }
      );
    }

    // Check if token is expired
    if (isTokenExpired(token)) {
      return NextResponse.json(
        {
          status: "error",
          message: "Token expired",
        },
        { status: 401 }
      );
    }

    // Verify user role for comment access (allow both admin and client)
    const role = getUserRole(token);
    const headerRole = request.headers.get("x-user-role");

    // Check role from JWT token or custom header - allow admin, team_leader, master_admin, and client
    const isAuthorized =
      role === "admin" ||
      role === "team_leader" ||
      role === "master_admin" ||
      role === "client" ||
      headerRole === "admin" ||
      headerRole === "team_leader" ||
      headerRole === "master_admin" ||
      headerRole === "client";

    if (!isAuthorized) {
      return NextResponse.json(
        {
          status: "error",
          message: "Access denied - valid user role required",
        },
        { status: 403 }
      );
    }

    // Fetch comments directly from the new Zoho API endpoint
    try {
      // Use the new direct comment endpoint: /visa_applications/documents/{documentId}/comment
      const zohoUrl = `${ZOHO_BASE_URL}/visa_applications/documents/${documentId}/comment`;

      const response = await authenticatedFetch<{
        success: boolean;
        data: ZohoComment[];
      }>(zohoUrl, token);

      // Transform Zoho comment format to our format
      let comments: Array<{
        _id: string;
        comment: string;
        added_by: string;
        created_at: string;
        document_id: string;
        is_important: boolean;
      }> = [];

      if (response.success && response.data && Array.isArray(response.data)) {
        // Filter out comments that don't have any text content and transform
        comments = response.data
          .filter(
            (comment: ZohoComment) =>
              comment.comment && comment.comment.trim().length > 0
          )
          .map((comment: ZohoComment) => ({
            _id: comment._id,
            comment: comment.comment || "", // Handle missing comment text
            added_by: comment.added_by || "Unknown",
            created_at: comment.added_at, // Zoho uses added_at, we use created_at
            document_id: documentId,
            is_important: Boolean(
              comment.added_by &&
                comment.added_by.toLowerCase().includes("moshin")
            ),
          }));

      }

      const responseData: GetCommentsResponse = {
        status: "success",
        data: comments,
        message:
          comments.length === 0
            ? "No comments found for this document"
            : undefined,
      };

      return NextResponse.json(responseData);
    } catch (error) {
      console.error("Zoho API error:", error);

      const responseData: GetCommentsResponse = {
        status: "success",
        data: [],
        message: "Unable to fetch comments from server",
      };

      return NextResponse.json(responseData);
    }
  } catch (error) {
    console.error("Get comments API error:", error);

    // Log to Sentry
    Sentry.captureException(error, {
      tags: {
        operation: "get_document_comments",
        documentId: (await params).documentId,
      },
    });

    return NextResponse.json(
      {
        status: "error",
        message:
          error instanceof Error ? error.message : "Failed to fetch comments",
      },
      { status: 500 }
    );
  }
}

// POST /api/zoho_dms/visa_applications/documents/[documentId]/comments
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  try {
    const { documentId } = await params;

    if (!documentId) {
      return NextResponse.json(
        {
          status: "error",
          message: "Document ID is required",
        },
        { status: 400 }
      );
    }

    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        {
          status: "error",
          message: "Authorization token required",
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
          status: "error",
          message: "Invalid token",
        },
        { status: 401 }
      );
    }

    // Check if token is expired
    if (isTokenExpired(token)) {
      return NextResponse.json(
        {
          status: "error",
          message: "Token expired",
        },
        { status: 401 }
      );
    }

    // Verify user role for comment creation (allow both admin and client)
    const role = getUserRole(token);
    const headerRole = request.headers.get("x-user-role");

    // Check role from JWT token or custom header - allow admin, team_leader, master_admin, and client
    const isAuthorized =
      role === "admin" ||
      role === "team_leader" ||
      role === "master_admin" ||
      role === "client" ||
      headerRole === "admin" ||
      headerRole === "team_leader" ||
      headerRole === "master_admin" ||
      headerRole === "client";

    if (!isAuthorized) {
      return NextResponse.json(
        {
          status: "error",
          message: "Access denied - valid user role required",
        },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { comment, added_by } = body as Omit<
      AddCommentRequest,
      "document_id"
    >;

    // Validate required fields
    if (!comment || !added_by) {
      return NextResponse.json(
        {
          status: "error",
          message: "Comment and added_by are required",
        },
        { status: 400 }
      );
    }

    // Validate comment length
    if (comment.trim().length === 0) {
      return NextResponse.json(
        {
          status: "error",
          message: "Comment cannot be empty",
        },
        { status: 400 }
      );
    }

    if (comment.length > 1000) {
      return NextResponse.json(
        {
          status: "error",
          message: "Comment is too long (max 1000 characters)",
        },
        { status: 400 }
      );
    }

    // Create comment via Zoho API
    // Based on the user's curl example, the correct endpoint is:
    // /api/zoho_dms/visa_applications/documents/{documentId}/comment
    const zohoCommentUrl = `${ZOHO_BASE_URL}/visa_applications/documents/${documentId}/comment`;



    try {
      const zohoResponse = await authenticatedFetch<{
        success: boolean;
        data: {
          _id: string;
          comments: ZohoComment[];
          record_id?: string;
          file_name?: string;
          uploaded_by?: string;
          status?: string;
          uploaded_at?: string;
        };
        message?: string;
      }>(zohoCommentUrl, token, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          comment: comment.trim(),
          added_by: added_by,
        }),
      });

      if (zohoResponse.success && zohoResponse.data) {
        const documentData = zohoResponse.data;
        const comments = documentData.comments || [];

        // Find the latest comment (should be the one we just created)
        const latestComment = comments[comments.length - 1];

        if (latestComment) {
          const createdComment = {
            _id: latestComment._id,
            comment: latestComment.comment || comment.trim(),
            added_by: latestComment.added_by || added_by,
            created_at: latestComment.added_at || new Date().toISOString(),
            document_id: documentId,
            is_important: Boolean(
              latestComment.added_by &&
                latestComment.added_by.toLowerCase().includes("moshin")
            ),
          };

          const response: AddCommentResponse = {
            status: "success",
            data: createdComment,
            message: "Comment added successfully",
          };

          return NextResponse.json(response);
        } else {
          return NextResponse.json(
            {
              status: "error",
              message: "No comment found in response",
            },
            { status: 400 }
          );
        }
      } else {
        return NextResponse.json(
          {
            status: "error",
            message: zohoResponse.message || "Failed to create comment",
          },
          { status: 400 }
        );
      }
    } catch (zohoError) {
      console.error("Zoho API error during comment creation:", zohoError);

      // If Zoho API is not available, we can't actually persist the comment
      // Return a more specific error message
      return NextResponse.json(
        {
          status: "error",
          message:
            "Comment creation service is currently unavailable. Please try again later or contact support.",
        },
        { status: 503 } // Service Unavailable
      );
    }
  } catch (error) {
    console.error("Add comment API error:", error);

    // Log to Sentry
    Sentry.captureException(error, {
      tags: {
        operation: "add_document_comment",
        documentId: (await params).documentId,
      },
      extra: {
        body: await request.json().catch(() => ({})),
      },
    });

    return NextResponse.json(
      {
        status: "error",
        message:
          error instanceof Error ? error.message : "Failed to add comment",
      },
      { status: 500 }
    );
  }
}

// DELETE /api/zoho_dms/visa_applications/documents/[documentId]/comments
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  try {
    const { documentId } = await params;

    if (!documentId) {
      return NextResponse.json(
        {
          status: "error",
          message: "Document ID is required",
        },
        { status: 400 }
      );
    }

    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        {
          status: "error",
          message: "Authorization token required",
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
          status: "error",
          message: "Invalid token",
        },
        { status: 401 }
      );
    }

    // Check if token is expired
    if (isTokenExpired(token)) {
      return NextResponse.json(
        {
          status: "error",
          message: "Token expired",
        },
        { status: 401 }
      );
    }

    // Verify user role for comment deletion
    const role = getUserRole(token);
    const headerRole = request.headers.get("x-user-role");

    // Check role from JWT token or custom header - allow admin, team_leader, master_admin, and client
    const isAuthorized =
      role === "admin" ||
      role === "team_leader" ||
      role === "master_admin" ||
      role === "client" ||
      headerRole === "admin" ||
      headerRole === "team_leader" ||
      headerRole === "master_admin" ||
      headerRole === "client";

    if (!isAuthorized) {
      return NextResponse.json(
        {
          status: "error",
          message: "Access denied - valid user role required",
        },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { commentId, addedBy } = body as { commentId: string; addedBy?: string };

    // Validate required fields
    if (!commentId) {
      return NextResponse.json(
        {
          status: "error",
          message: "Comment ID is required",
        },
        { status: 400 }
      );
    }

    // For client users, verify they can only delete their own comments
    if (role === "client" || headerRole === "client") {
      if (!addedBy) {
        return NextResponse.json(
          {
            status: "error",
            message: "Comment author information is required for client deletion",
          },
          { status: 400 }
        );
      }

      // Get current user info from token payload
      const currentUser = payload.username;
      if (addedBy !== currentUser) {
        return NextResponse.json(
          {
            status: "error",
            message: "You can only delete your own comments",
          },
          { status: 403 }
        );
      }
    }

    // Delete comment via Zoho API
    // Based on the user's curl example: DELETE /visa_applications/documents/{documentId}/comment
    const zohoDeleteUrl = `${ZOHO_BASE_URL}/visa_applications/documents/${documentId}/comment`;

    try {
      const zohoResponse = await authenticatedFetch<{
        success: boolean;
        message?: string;
      }>(zohoDeleteUrl, token, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          commentId: commentId,
        }),
      });

      if (zohoResponse.success) {
        const response = {
          status: "success" as const,
          message: "Comment deleted successfully",
        };

        return NextResponse.json(response);
      } else {
        return NextResponse.json(
          {
            status: "error",
            message: zohoResponse.message || "Failed to delete comment",
          },
          { status: 400 }
        );
      }
    } catch (zohoError) {
      console.error("Zoho API error during comment deletion:", zohoError);

      return NextResponse.json(
        {
          status: "error",
          message:
            "Comment deletion service is currently unavailable. Please try again later or contact support.",
        },
        { status: 503 } // Service Unavailable
      );
    }
  } catch (error) {
    console.error("Delete comment API error:", error);

    // Log to Sentry
    Sentry.captureException(error, {
      tags: {
        operation: "delete_document_comment",
        documentId: (await params).documentId,
      },
      extra: {
        body: await request.json().catch(() => ({})),
      },
    });

    return NextResponse.json(
      {
        status: "error",
        message:
          error instanceof Error ? error.message : "Failed to delete comment",
      },
      { status: 500 }
    );
  }
}
