import { proxySessionBackend, withRequestSearch } from "@/shared/api/route-proxy";
import type { EquipmentRecord } from "@/shared/api";

export async function GET(request: Request) {
  return proxySessionBackend<EquipmentRecord[]>(withRequestSearch("/api/v1/equipment", request));
}

export async function POST(request: Request) {
  return proxySessionBackend<EquipmentRecord>("/api/v1/equipment", {
    request,
    method: "POST",
    successStatus: 201,
  });
}
