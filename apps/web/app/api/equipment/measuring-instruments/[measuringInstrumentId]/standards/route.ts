import { proxySessionBackend } from "@/shared/api/route-proxy";
import type { StandardRecord } from "@/shared/api";

export async function POST(request: Request, { params }: { params: Promise<{ measuringInstrumentId: string }> }) {
  const { measuringInstrumentId } = await params;
  return proxySessionBackend<StandardRecord>(`/api/v1/measuring-instruments/${measuringInstrumentId}/standards`, {
    request,
    method: "POST",
    successStatus: 201,
  });
}
