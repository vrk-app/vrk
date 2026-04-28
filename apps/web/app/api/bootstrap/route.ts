import { proxySessionBackend } from "@/shared/api/route-proxy";
import type { SessionSummaryResponse } from "@/shared/api";

export async function POST(request: Request) {
  return proxySessionBackend<SessionSummaryResponse>("/api/v1/launch-wizard", {
    request,
    method: "POST",
  });
}
