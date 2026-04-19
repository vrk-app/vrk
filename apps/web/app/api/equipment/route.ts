import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { BackendError, fetchBackend } from "@/shared/api/backend";
import { SESSION_COOKIE_NAME, type EquipmentRecord } from "@/shared/api";

function unauthorized() {
  return NextResponse.json({ success: false, error: "unauthorized" }, { status: 401 });
}

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return unauthorized();
  }

  const { searchParams } = new URL(request.url);
  const includeArchived = searchParams.get("includeArchived");
  const path = includeArchived ? `/api/v1/equipment?includeArchived=${includeArchived}` : "/api/v1/equipment";

  try {
    const data = await fetchBackend<EquipmentRecord[]>(path, {
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
    const body = await request.json();
    const data = await fetchBackend<EquipmentRecord>("/api/v1/equipment", {
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
