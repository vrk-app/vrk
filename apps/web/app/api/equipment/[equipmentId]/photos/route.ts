import { proxyEquipmentPhotoJson } from "../../photo-proxy";

export async function POST(request: Request, { params }: { params: Promise<{ equipmentId: string }> }) {
  const { equipmentId } = await params;
  return proxyEquipmentPhotoJson(`/api/v1/equipment/${equipmentId}/photos`, "POST", request);
}
