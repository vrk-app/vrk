import { proxySessionBackend } from "@/shared/api/route-proxy";
import type { SessionSummaryResponse } from "@/shared/api";

type RouteContext = {
  params: Promise<{ unitId: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
  const { unitId } = await context.params;

  return proxySessionBackend<SessionSummaryResponse>(`/api/v1/company/units/${unitId}/archive`, {
    method: "POST",
  });
}
