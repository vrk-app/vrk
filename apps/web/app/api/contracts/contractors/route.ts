import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { fetchBackend, BackendError } from "@/shared/api/backend";
import { SESSION_COOKIE_NAME, type ContractorOption } from "@/shared/api";

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
    const data = await fetchBackend<ContractorOption[]>("/api/v1/agreements/contractors", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    if (error instanceof BackendError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    }

    return NextResponse.json({ success: false, error: "request failed" }, { status: 500 });
  }
}
