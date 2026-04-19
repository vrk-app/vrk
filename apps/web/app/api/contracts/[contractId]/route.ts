import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { fetchBackend, BackendError } from "@/shared/api/backend";
import { SESSION_COOKIE_NAME, type ContractRecord } from "@/shared/api";

function unauthorized() {
  return NextResponse.json({ success: false, error: "unauthorized" }, { status: 401 });
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ contractId: string }> },
) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return unauthorized();
  }

  try {
    const { contractId } = await context.params;
    const data = await fetchBackend<ContractRecord>(`/api/v1/agreements/${contractId}`, {
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

export async function PUT(
  request: Request,
  context: { params: Promise<{ contractId: string }> },
) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return unauthorized();
  }

  try {
    const { contractId } = await context.params;
    const body = await request.json();
    const data = await fetchBackend<ContractRecord>(`/api/v1/agreements/${contractId}`, {
      method: "PUT",
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
