import { proxyEquipmentPhotoJson } from "../../../photo-proxy";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ measuringInstrumentId: string }> },
) {
  const { measuringInstrumentId } = await params;
  return proxyEquipmentPhotoJson(`/api/v1/measuring-instruments/${measuringInstrumentId}/photos`, "POST", request);
}
