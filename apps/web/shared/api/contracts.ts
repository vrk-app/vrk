import { fetchBackend } from "./backend";
import { SESSION_TOKEN_HEADER_NAME } from "./bootstrap";

export type ContractStatus = "inactive" | "active" | "expired";
export type WorkType = "repair" | "maintenance" | "verification";

export type ContractRecord = {
  id: string;
  customerOrganizationId: string;
  customerOrganizationName: string;
  contractorOrganizationId: string;
  contractorOrganizationName: string;
  contractNumber: string;
  contractStatus: ContractStatus;
  startDate: string;
  endDate: string;
  workType: WorkType;
  equipmentType: string;
  region: string;
  locationScope: {
    scopeType: "organization" | "division" | "unit";
    scopeId?: string;
    label: string;
  };
  source?: string;
  subjectOfAgreement?: string;
  routingEligible: boolean;
};

export type ContractorOption = {
  id: string;
  name: string;
  shortName?: string;
};

export type RoutingResolvePayload = {
  unitId: string;
  workType: WorkType;
  equipmentType: string;
  region: string;
};

export type RoutingResolveResult = {
  unitId: string;
  workType: WorkType;
  equipmentType: string;
  region: string;
  matches: Array<{
    contract: ContractRecord;
    contractor: ContractorOption;
  }>;
};

function sessionHeaders(sessionToken: string) {
  return {
    [SESSION_TOKEN_HEADER_NAME]: sessionToken,
  };
}

export async function fetchContractRegistry(sessionToken: string) {
  const result = await fetchBackend<ContractRecord[]>("/api/v1/agreements", {
    headers: sessionHeaders(sessionToken),
  });

  return result.data;
}

export async function fetchContractorOptions(sessionToken: string) {
  const result = await fetchBackend<ContractorOption[]>("/api/v1/agreements/contractors", {
    headers: sessionHeaders(sessionToken),
  });

  return result.data;
}
