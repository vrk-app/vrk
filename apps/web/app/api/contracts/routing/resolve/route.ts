import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { fetchBackend, BackendError } from "@/shared/api/backend";
import { SESSION_COOKIE_NAME, type RoutingResolvePayload, type RoutingResolveResult } from "@/shared/api";

function unauthorized() {
  return NextResponse.json({ success: false, error: "unauthorized" }, { status: 401 });
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return unauthorized();
  }

  try {
    const body = (await request.json()) as RoutingResolvePayload;
    const data = await fetchBackend<RoutingResolveResult>("/api/v1/agreements/routing/resolve", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    if (error instanceof BackendError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    }

    return NextResponse.json({ success: false, error: "request failed" }, { status: 500 });
  }
}
