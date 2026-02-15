import { NextRequest, NextResponse } from "next/server";
import { clientLogin } from "@/lib/zoho";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.email) {
      return NextResponse.json(
        {
          status: "error",
          message: "Email is required",
        },
        { status: 400 },
      );
    }

    // Call Zoho API
    const response = await clientLogin({
      email: body.email,
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error("Client login error:", error);

    return NextResponse.json(
      {
        status: "error",
        message: error instanceof Error ? error.message : "Login failed",
      },
      { status: 500 },
    );
  }
}
