import { proxySessionBackend } from "@/shared/api/route-proxy";
import type { JournalRecord } from "@/shared/api";

export async function GET(_request: Request, { params }: { params: Promise<{ standardId: string }> }) {
  const { standardId } = await params;
  return proxySessionBackend<JournalRecord[]>(`/api/v1/standards/${standardId}/journals`);
}

export async function POST(request: Request, { params }: { params: Promise<{ standardId: string }> }) {
  const { standardId } = await params;
  return proxySessionBackend<JournalRecord>(`/api/v1/standards/${standardId}/journals`, {
    request,
    method: "POST",
    successStatus: 201,
  });
}
