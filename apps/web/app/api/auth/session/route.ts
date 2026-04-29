import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { fetchBackend } from "@/shared/api/backend";
import { SESSION_COOKIE_NAME, type SessionSummaryResponse } from "@/shared/api";
import { backendErrorResponse } from "@/shared/api/route-proxy";

const persistentCookieMaxAge = 60 * 60 * 24;

const baseCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email?: unknown;
      password?: unknown;
      rememberSession?: unknown;
    };
    const rememberSession = body.rememberSession !== false;
    const result = await fetchBackend<SessionSummaryResponse>("/api/v1/sessions", {
      method: "POST",
      body: JSON.stringify({
        email: String(body.email ?? ""),
        password: String(body.password ?? ""),
      }),
    });
    const data = result.data;

    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, data.sessionToken, {
      ...baseCookieOptions,
      ...(rememberSession ? { maxAge: persistentCookieMaxAge } : {}),
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return backendErrorResponse(error);
  }
}
