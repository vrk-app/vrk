import { proxySessionBackend } from "@/shared/api/route-proxy";
import type { EmployeeInviteResponse } from "@/shared/api";

export async function GET() {
  return proxySessionBackend<EmployeeInviteResponse[]>("/api/v1/employee-invites");
}

export async function POST(request: Request) {
  return proxySessionBackend<EmployeeInviteResponse>("/api/v1/employee-invites", {
    request,
    method: "POST",
    successStatus: 201,
  });
}
