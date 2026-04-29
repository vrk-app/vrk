import { proxySessionBackend } from "@/shared/api/route-proxy";
import type { SessionSummaryResponse } from "@/shared/api";

export async function PATCH(request: Request) {
  return proxySessionBackend<SessionSummaryResponse>("/api/v1/company/profile", {
    method: "PATCH",
    request,
  });
}
