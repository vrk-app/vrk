import { proxyPlatformAdminBackend } from "@/shared/api/route-proxy";
import type { OrganizationShellResponse } from "@/shared/api";

export async function POST(request: Request) {
  return proxyPlatformAdminBackend<OrganizationShellResponse>("/api/v1/platform/organization-shells", {
    request,
    method: "POST",
    successStatus: 201,
  });
}
