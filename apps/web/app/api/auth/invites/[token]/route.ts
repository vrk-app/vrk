import { proxyPublicBackend } from "@/shared/api/route-proxy";
import type { PublicInviteInspectionResponse } from "@/shared/api";

export async function GET(
  _request: Request,
  context: { params: Promise<{ token: string }> },
) {
  const { token } = await context.params;
  return proxyPublicBackend<PublicInviteInspectionResponse>(`/api/v1/invites/${token}`);
}
