import { NextRequest, NextResponse } from "next/server";
import { adminLogin } from "@/lib/zoho";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.username || !body.password) {
      return NextResponse.json(
        {
          status: "error",
          message: "Username and password are required",
        },
        { status: 400 },
      );
    }

    // Call Zoho API
    const response = await adminLogin({
      username: body.username,
      password: body.password,
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error("Admin login error:", error);

    return NextResponse.json(
      {
        status: "error",
        message: error instanceof Error ? error.message : "Login failed",
      },
      { status: 500 },
    );
  }
}
