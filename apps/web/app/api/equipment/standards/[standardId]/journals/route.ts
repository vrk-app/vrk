import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { BackendError, fetchBackend } from "@/shared/api/backend";
import { SESSION_COOKIE_NAME, type JournalRecord } from "@/shared/api";

function unauthorized() {
  return NextResponse.json({ success: false, error: "unauthorized" }, { status: 401 });
}

export async function GET(_request: Request, { params }: { params: Promise<{ standardId: string }> }) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return unauthorized();
  }

  const { standardId } = await params;

  try {
    const data = await fetchBackend<JournalRecord[]>(`/api/v1/standards/${standardId}/journals`, {
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

export async function POST(request: Request, { params }: { params: Promise<{ standardId: string }> }) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return unauthorized();
  }

  const { standardId } = await params;

  try {
    const body = await request.json();
    const data = await fetchBackend<JournalRecord>(`/api/v1/standards/${standardId}/journals`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    if (error instanceof BackendError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    }

    return NextResponse.json({ success: false, error: "request failed" }, { status: 500 });
  }
}
