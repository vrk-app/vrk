import { proxySessionBackend } from "@/shared/api/route-proxy";
import type { MeasuringInstrumentRecord } from "@/shared/api";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ measuringInstrumentId: string }> },
) {
  const { measuringInstrumentId } = await params;
  return proxySessionBackend<MeasuringInstrumentRecord>(
    `/api/v1/measuring-instruments/${measuringInstrumentId}/archive`,
    {
      method: "POST",
    },
  );
}
