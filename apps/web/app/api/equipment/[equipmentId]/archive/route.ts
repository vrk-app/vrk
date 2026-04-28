import { proxySessionBackend } from "@/shared/api/route-proxy";
import type { EquipmentRecord } from "@/shared/api";

export async function POST(_request: Request, { params }: { params: Promise<{ equipmentId: string }> }) {
  const { equipmentId } = await params;
  return proxySessionBackend<EquipmentRecord>(`/api/v1/equipment/${equipmentId}/archive`, {
    method: "POST",
  });
}
