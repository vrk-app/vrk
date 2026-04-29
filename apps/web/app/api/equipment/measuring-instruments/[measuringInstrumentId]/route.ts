import { proxySessionBackend } from "@/shared/api/route-proxy";
import type { MeasuringInstrumentRecord } from "@/shared/api";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ measuringInstrumentId: string }> },
) {
  const { measuringInstrumentId } = await params;
  return proxySessionBackend<MeasuringInstrumentRecord>(`/api/v1/measuring-instruments/${measuringInstrumentId}`, {
    request,
    method: "PATCH",
  });
}
