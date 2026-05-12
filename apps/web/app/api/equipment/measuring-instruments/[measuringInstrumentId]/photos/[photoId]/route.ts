import { proxyEquipmentPhotoJson, proxyEquipmentPhotoStream } from "../../../../photo-proxy";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ measuringInstrumentId: string; photoId: string }> },
) {
  const { measuringInstrumentId, photoId } = await params;
  return proxyEquipmentPhotoStream(`/api/v1/measuring-instruments/${measuringInstrumentId}/photos/${photoId}`);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ measuringInstrumentId: string; photoId: string }> },
) {
  const { measuringInstrumentId, photoId } = await params;
  return proxyEquipmentPhotoJson(`/api/v1/measuring-instruments/${measuringInstrumentId}/photos/${photoId}`, "DELETE");
}
