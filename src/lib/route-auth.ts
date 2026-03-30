import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

type AuthSuccess = { token: string };
type AuthFailure = NextResponse;


export async function requireAuth(): Promise<AuthSuccess | AuthFailure> {
  const { userId, getToken } = await auth();

  if (!userId) {
    return NextResponse.json(
      { status: "error", message: "Unauthorized" },
      { status: 401 },
    );
  }

  const token = await getToken();
  if (!token) {
    return NextResponse.json(
      { status: "error", message: "Unauthorized" },
      { status: 401 },
    );
  }

  return { token };
}
