import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { fetchBackend, BackendError } from "@/shared/api/backend";
import { SESSION_COOKIE_NAME, type CreateEmployeeInvitePayload, type EmployeeInviteResponse } from "@/shared/api";

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
    const data = await fetchBackend<EmployeeInviteResponse[]>("/api/v1/employee-invites", {
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

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return unauthorized();
  }

  try {
    const payload = (await request.json()) as CreateEmployeeInvitePayload;
    const data = await fetchBackend<EmployeeInviteResponse>("/api/v1/employee-invites", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    if (error instanceof BackendError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    }

    return NextResponse.json({ success: false, error: "request failed" }, { status: 500 });
  }
}
