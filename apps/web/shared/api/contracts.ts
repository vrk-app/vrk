import { fetchBackend } from "./backend";

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
    scopeType: "organization" | "subdivision" | "unit";
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
    Authorization: `Bearer ${sessionToken}`,
  };
}

export async function fetchContractRegistry(sessionToken: string) {
  return fetchBackend<ContractRecord[]>("/api/v1/agreements", {
    headers: sessionHeaders(sessionToken),
  });
}

export async function fetchContractorOptions(sessionToken: string) {
  return fetchBackend<ContractorOption[]>("/api/v1/agreements/contractors", {
    headers: sessionHeaders(sessionToken),
  });
}
