import { proxySessionBackend } from "@/shared/api/route-proxy";
import type { EmployeeInviteResponse } from "@/shared/api";

export async function POST(
  _request: Request,
  context: { params: Promise<{ inviteId: string }> },
) {
  const { inviteId } = await context.params;

  return proxySessionBackend<EmployeeInviteResponse>(`/api/v1/employee-invites/${inviteId}/revoke`, {
    method: "POST",
  });
}
