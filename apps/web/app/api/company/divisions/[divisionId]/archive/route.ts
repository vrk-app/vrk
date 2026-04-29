import { proxySessionBackend } from "@/shared/api/route-proxy";
import type { SessionSummaryResponse } from "@/shared/api";

type RouteContext = {
  params: Promise<{ divisionId: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
  const { divisionId } = await context.params;

  return proxySessionBackend<SessionSummaryResponse>(`/api/v1/company/divisions/${divisionId}/archive`, {
    method: "POST",
  });
}
