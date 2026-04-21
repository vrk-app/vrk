import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { fetchBackend } from "@/shared/api/backend";
import { SESSION_COOKIE_NAME, type SessionSummaryResponse } from "@/shared/api";
import { backendErrorResponse } from "@/shared/api/route-proxy";

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24,
};

export async function POST(
  request: Request,
  context: { params: Promise<{ token: string }> },
) {
  try {
    const body = await request.json();
    const { token } = await context.params;
    const result = await fetchBackend<SessionSummaryResponse>(`/api/v1/invites/${token}/accept`, {
      method: "POST",
      body: JSON.stringify(body),
    });
    const data = result.data;

    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, data.sessionToken, cookieOptions);

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return backendErrorResponse(error);
  }
}
