import { proxySessionBackend } from "@/shared/api/route-proxy";

type DeleteResponse = {
  id: string;
};

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ measuringInstrumentId: string; standardId: string }> },
) {
  const { measuringInstrumentId, standardId } = await params;
  return proxySessionBackend<DeleteResponse>(
    `/api/v1/measuring-instruments/${measuringInstrumentId}/standards/${standardId}`,
    {
      method: "DELETE",
    },
  );
}
