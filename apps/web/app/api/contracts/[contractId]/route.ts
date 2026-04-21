import { proxySessionBackend } from "@/shared/api/route-proxy";
import type { ContractRecord } from "@/shared/api";

export async function GET(
  _request: Request,
  context: { params: Promise<{ contractId: string }> },
) {
  const { contractId } = await context.params;
  return proxySessionBackend<ContractRecord>(`/api/v1/agreements/${contractId}`);
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ contractId: string }> },
) {
  const { contractId } = await context.params;
  return proxySessionBackend<ContractRecord>(`/api/v1/agreements/${contractId}`, {
    request,
    method: "PUT",
  });
}
