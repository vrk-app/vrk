import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getInternalApiBaseUrl } from "@/shared/api/backend";
import { SESSION_COOKIE_NAME, type SessionSummaryResponse } from "@/shared/api";
import { backendErrorResponse, proxySessionBackend } from "@/shared/api/route-proxy";

export async function GET() {
  return proxySessionBackend<SessionSummaryResponse>("/api/v1/sessions/current");
}

export async function DELETE() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    cookieStore.delete(SESSION_COOKIE_NAME);
    return new NextResponse(null, { status: 204 });
  }

  try {
    const response = await fetch(`${getInternalApiBaseUrl()}/api/v1/sessions/current`, {
      method: "DELETE",
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok && response.status !== 401) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      return NextResponse.json(
        { success: false, error: payload?.error ?? "request failed" },
        { status: response.status },
      );
    }
  } catch (error) {
    return backendErrorResponse(error);
  }

  cookieStore.delete(SESSION_COOKIE_NAME);
  return new NextResponse(null, { status: 204 });
}
