import { NextResponse } from "next/server";
import { fetchBackend, BackendError } from "@/shared/api/backend";
import type { OrganizationShellPayload, OrganizationShellResponse } from "@/shared/api";

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as OrganizationShellPayload;
    const data = await fetchBackend<OrganizationShellResponse>("/api/v1/platform/organization-shells", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    if (error instanceof BackendError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    }

    return NextResponse.json({ success: false, error: "request failed" }, { status: 500 });
  }
}
