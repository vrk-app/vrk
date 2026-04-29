import { proxySessionBackend } from "@/shared/api/route-proxy";
import type { EquipmentRecord } from "@/shared/api";

export async function PATCH(request: Request, { params }: { params: Promise<{ equipmentId: string }> }) {
  const { equipmentId } = await params;
  return proxySessionBackend<EquipmentRecord>(`/api/v1/equipment/${equipmentId}`, {
    request,
    method: "PATCH",
  });
}
