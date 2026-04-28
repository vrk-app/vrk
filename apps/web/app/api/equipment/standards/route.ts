import { proxySessionBackend, withRequestSearch } from "@/shared/api/route-proxy";
import type { StandardRecord } from "@/shared/api";

export async function GET(request: Request) {
  return proxySessionBackend<StandardRecord[]>(withRequestSearch("/api/v1/standards", request));
}

export async function POST(request: Request) {
  return proxySessionBackend<StandardRecord>("/api/v1/standards", {
    request,
    method: "POST",
    successStatus: 201,
  });
}
