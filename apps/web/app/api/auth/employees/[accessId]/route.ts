import { proxySessionBackend } from "@/shared/api/route-proxy";
import type { EmployeeAccessResponse } from "@/shared/api";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ accessId: string }> },
) {
  const { accessId } = await context.params;

  return proxySessionBackend<EmployeeAccessResponse>(`/api/v1/employees/${accessId}`, {
    request,
    method: "PATCH",
  });
}
