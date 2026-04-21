import { proxySessionBackend } from "@/shared/api/route-proxy";
import type { JournalRecord } from "@/shared/api";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ measuringInstrumentId: string }> },
) {
  const { measuringInstrumentId } = await params;
  return proxySessionBackend<JournalRecord[]>(`/api/v1/measuring-instruments/${measuringInstrumentId}/journals`);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ measuringInstrumentId: string }> },
) {
  const { measuringInstrumentId } = await params;
  return proxySessionBackend<JournalRecord>(`/api/v1/measuring-instruments/${measuringInstrumentId}/journals`, {
    request,
    method: "POST",
    successStatus: 201,
  });
}
