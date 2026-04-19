import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { fetchBackend, BackendError } from "@/shared/api/backend";
import { SESSION_COOKIE_NAME, type SessionSummaryResponse } from "@/shared/api";

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24,
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = await fetchBackend<SessionSummaryResponse>("/api/v1/sessions", {
      method: "POST",
      body: JSON.stringify(body),
    });

    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, data.sessionToken, cookieOptions);

    return NextResponse.json({ success: true, data });
  } catch (error) {
    if (error instanceof BackendError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    }

    return NextResponse.json({ success: false, error: "request failed" }, { status: 500 });
  }
}
