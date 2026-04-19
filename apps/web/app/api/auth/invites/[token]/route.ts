import { NextResponse } from "next/server";
import { fetchBackend, BackendError } from "@/shared/api/backend";
import type { PublicInviteInspectionResponse } from "@/shared/api";

export async function GET(
  _request: Request,
  context: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await context.params;
    const data = await fetchBackend<PublicInviteInspectionResponse>(`/api/v1/invites/${token}`);

    return NextResponse.json({ success: true, data });
  } catch (error) {
    if (error instanceof BackendError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    }

    return NextResponse.json({ success: false, error: "request failed" }, { status: 500 });
  }
}
