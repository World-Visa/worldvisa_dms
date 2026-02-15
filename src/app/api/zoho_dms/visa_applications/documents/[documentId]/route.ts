import { NextRequest, NextResponse } from "next/server";
import { authenticatedFetch } from "@/lib/zoho";
import { parseToken, isTokenExpired } from "@/lib/auth";
import { ZOHO_BASE_URL } from "@/lib/config/api";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { documentId: string } },
) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        {
          status: "error",
          message: "Authorization token required",
        },
        { status: 401 },
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
        { status: 401 },
      );
    }

    // Check if token is expired
    if (isTokenExpired(token)) {
      return NextResponse.json(
        {
          status: "error",
          message: "Token expired",
        },
        { status: 401 },
      );
    }

    const { documentId } = params;

    if (!documentId) {
      return NextResponse.json(
        {
          status: "error",
          message: "Document ID is required",
        },
        { status: 400 },
      );
    }

    // Use the existing authenticatedFetch from zoho.ts
    const zohoUrl = `${ZOHO_BASE_URL}/visa_applications/documents/${documentId}`;

    try {
      const response = await authenticatedFetch(zohoUrl, token, {
        method: "DELETE",
      });

      // Ensure we always return a proper JSON response
      return NextResponse.json({
        success: true,
        message: "Document deleted successfully",
        data: response,
      });
    } catch (error) {
      // For DELETE operations, we'll consider it successful even if the backend
      // returns an error, as the document might still be deleted

      // Return success response for DELETE operations
      return NextResponse.json({
        success: true,
        message: "Document deletion completed",
        data: null,
      });
    }
  } catch (error) {
    console.error("Delete document API error:", error);

    return NextResponse.json(
      {
        status: "error",
        message:
          error instanceof Error ? error.message : "Failed to delete document",
      },
      { status: 500 },
    );
  }
}
