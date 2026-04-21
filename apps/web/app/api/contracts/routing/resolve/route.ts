import { proxySessionBackend } from "@/shared/api/route-proxy";
import type { RoutingResolveResult } from "@/shared/api";

export async function POST(request: Request) {
  return proxySessionBackend<RoutingResolveResult>("/api/v1/agreements/routing/resolve", {
    request,
    method: "POST",
  });
}
