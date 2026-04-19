import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { BackendError, fetchBackend } from "@/shared/api/backend";
import { SESSION_COOKIE_NAME, type EquipmentRecord } from "@/shared/api";

function unauthorized() {
  return NextResponse.json({ success: false, error: "unauthorized" }, { status: 401 });
}

export async function POST(_request: Request, { params }: { params: Promise<{ equipmentId: string }> }) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return unauthorized();
  }

  const { equipmentId } = await params;

  try {
    const data = await fetchBackend<EquipmentRecord>(`/api/v1/equipment/${equipmentId}/archive`, {
      method: "POST",
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
