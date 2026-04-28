import { proxySessionBackend, withRequestSearch } from "@/shared/api/route-proxy";
import type { MeasuringInstrumentRecord } from "@/shared/api";

export async function GET(request: Request) {
  return proxySessionBackend<MeasuringInstrumentRecord[]>(
    withRequestSearch("/api/v1/measuring-instruments", request),
  );
}

export async function POST(request: Request) {
  return proxySessionBackend<MeasuringInstrumentRecord>("/api/v1/measuring-instruments", {
    request,
    method: "POST",
    successStatus: 201,
  });
}
