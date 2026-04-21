import { proxySessionBackend } from "@/shared/api/route-proxy";
import type { ContractRecord } from "@/shared/api";

export async function GET() {
  return proxySessionBackend<ContractRecord[]>("/api/v1/agreements");
}

export async function POST(request: Request) {
  return proxySessionBackend<ContractRecord>("/api/v1/agreements", {
    request,
    method: "POST",
    successStatus: 201,
  });
}
