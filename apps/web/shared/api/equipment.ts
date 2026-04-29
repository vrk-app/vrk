import { fetchBackend } from "./backend";

export type RegistryStatus = "active" | "inactive" | "retired";
export type MeasuringInstrumentPlacement = "standalone" | "built_in";

export type JournalRecord = {
  id: string;
  operationType: "verification" | "calibration" | "maintenance" | "suspension" | "decommission";
  operationDate: string;
  documentNumber: string;
  validUntil?: string;
  executorOrganization: string;
  attachmentUrl?: string;
  comment?: string;
  createdAt: string;
};

export type EquipmentRecord = {
  id: string;
  organizationId: string;
  unit: {
    id: string;
    name: string;
    divisionId?: string;
    divisionName?: string;
  };
  manufacturer: string;
  classification: string;
  model: string;
  fullName: string;
  factoryNumber: string;
  inventoryNumber?: string;
  manufactureYear: number;
  status: RegistryStatus;
  comment?: string;
  documentUrl?: string;
  measuringInstrumentCount: number;
  archivedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type LinkedStandardRecord = {
  id: string;
  standardType: string;
  model: string;
  identifier: string;
  serialNumber?: string;
  status: RegistryStatus;
  scopeLabel: string;
};

export type MeasuringInstrumentRecord = {
  id: string;
  organizationId: string;
  unit: {
    id: string;
    name: string;
    divisionId?: string;
    divisionName?: string;
  };
  equipment?: {
    id: string;
    fullName: string;
  };
  name: string;
  instrumentType: string;
  model: string;
  registrationNumber: string;
  serialNumber: string;
  status: RegistryStatus;
  placementKind: MeasuringInstrumentPlacement;
  comment?: string;
  documentUrl?: string;
  standards: LinkedStandardRecord[];
  journalCount: number;
  nextDueDate?: string;
  latestJournal?: JournalRecord;
  archivedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type StandardRecord = {
  id: string;
  organizationId: string;
  ownershipScope: {
    scopeType: "organization" | "division" | "unit";
    scopeId?: string;
    label: string;
  };
  standardType: string;
  model: string;
  identifier: string;
  serialNumber?: string;
  metrologicalCharacteristics: string;
  status: RegistryStatus;
  comment?: string;
  documentUrl?: string;
  linkedMeasuringInstruments: number;
  journalCount: number;
  nextDueDate?: string;
  latestJournal?: JournalRecord;
  archivedAt?: string;
  createdAt: string;
  updatedAt: string;
};

function sessionHeaders(sessionToken: string) {
  return {
    Authorization: `Bearer ${sessionToken}`,
  };
}

export async function fetchEquipmentRegistry(sessionToken: string, includeArchived = false) {
  const search = includeArchived ? "?includeArchived=true" : "";
  const result = await fetchBackend<EquipmentRecord[]>(`/api/v1/equipment${search}`, {
    headers: sessionHeaders(sessionToken),
  });

  return result.data;
}

export async function fetchMeasuringInstrumentRegistry(sessionToken: string, includeArchived = false) {
  const search = includeArchived ? "?includeArchived=true" : "";
  const result = await fetchBackend<MeasuringInstrumentRecord[]>(`/api/v1/measuring-instruments${search}`, {
    headers: sessionHeaders(sessionToken),
  });

  return result.data;
}

export async function fetchStandardRegistry(sessionToken: string, includeArchived = false) {
  const search = includeArchived ? "?includeArchived=true" : "";
  const result = await fetchBackend<StandardRecord[]>(`/api/v1/standards${search}`, {
    headers: sessionHeaders(sessionToken),
  });

  return result.data;
}

export async function fetchMeasuringInstrumentJournals(sessionToken: string, measuringInstrumentId: string) {
  const result = await fetchBackend<JournalRecord[]>(`/api/v1/measuring-instruments/${measuringInstrumentId}/journals`, {
    headers: sessionHeaders(sessionToken),
  });

  return result.data;
}

export async function fetchStandardJournals(sessionToken: string, standardId: string) {
  const result = await fetchBackend<JournalRecord[]>(`/api/v1/standards/${standardId}/journals`, {
    headers: sessionHeaders(sessionToken),
  });

  return result.data;
}
