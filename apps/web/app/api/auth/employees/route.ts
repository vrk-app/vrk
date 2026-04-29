import { proxySessionBackend } from "@/shared/api/route-proxy";
import type { EmployeeAccessResponse } from "@/shared/api";

export async function GET() {
  return proxySessionBackend<EmployeeAccessResponse[]>("/api/v1/employees");
}
