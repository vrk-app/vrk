import { proxySessionBackend } from "@/shared/api/route-proxy";
import type { JournalRecord } from "@/shared/api";

export async function GET(_request: Request, { params }: { params: Promise<{ equipmentId: string }> }) {
  const { equipmentId } = await params;
  return proxySessionBackend<JournalRecord[]>(`/api/v1/equipment/${equipmentId}/journals`);
}

export async function POST(request: Request, { params }: { params: Promise<{ equipmentId: string }> }) {
  const { equipmentId } = await params;
  return proxySessionBackend<JournalRecord>(`/api/v1/equipment/${equipmentId}/journals`, {
    request,
    method: "POST",
    successStatus: 201,
  });
}
