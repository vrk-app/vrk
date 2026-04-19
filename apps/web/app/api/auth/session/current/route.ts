import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { fetchBackend, BackendError, getInternalApiBaseUrl } from "@/shared/api/backend";
import { SESSION_COOKIE_NAME, type SessionSummaryResponse } from "@/shared/api";

function unauthorized() {
  return NextResponse.json({ success: false, error: "unauthorized" }, { status: 401 });
}

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return unauthorized();
  }

  try {
    const data = await fetchBackend<SessionSummaryResponse>("/api/v1/sessions/current", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    if (error instanceof BackendError) {
      if (error.status === 401) {
        cookieStore.delete(SESSION_COOKIE_NAME);
      }
      return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    }

    return NextResponse.json({ success: false, error: "request failed" }, { status: 500 });
  }
}

export async function DELETE() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
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
      if (error instanceof BackendError && error.status !== 401) {
        return NextResponse.json({ success: false, error: error.message }, { status: error.status });
      }
    }
  }

  cookieStore.delete(SESSION_COOKIE_NAME);
  return new NextResponse(null, { status: 204 });
}
