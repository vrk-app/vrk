import { proxySessionBackend } from "@/shared/api/route-proxy";
import type { StandardRecord } from "@/shared/api";

export async function PATCH(request: Request, { params }: { params: Promise<{ standardId: string }> }) {
  const { standardId } = await params;
  return proxySessionBackend<StandardRecord>(`/api/v1/standards/${standardId}`, {
    request,
    method: "PATCH",
  });
}
