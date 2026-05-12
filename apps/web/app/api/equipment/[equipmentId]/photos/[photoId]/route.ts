import { proxyEquipmentPhotoJson, proxyEquipmentPhotoStream } from "../../../photo-proxy";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ equipmentId: string; photoId: string }> },
) {
  const { equipmentId, photoId } = await params;
  return proxyEquipmentPhotoStream(`/api/v1/equipment/${equipmentId}/photos/${photoId}`);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ equipmentId: string; photoId: string }> },
) {
  const { equipmentId, photoId } = await params;
  return proxyEquipmentPhotoJson(`/api/v1/equipment/${equipmentId}/photos/${photoId}`, "DELETE");
}
