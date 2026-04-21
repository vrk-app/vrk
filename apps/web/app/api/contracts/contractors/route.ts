import { proxySessionBackend } from "@/shared/api/route-proxy";
import type { ContractorOption } from "@/shared/api";

export async function GET() {
  return proxySessionBackend<ContractorOption[]>("/api/v1/agreements/contractors");
}
