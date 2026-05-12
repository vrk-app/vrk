import { useLayoutEffect, type ReactNode } from "react";
import type { Decorator } from "@storybook/react";
import {
  cloneFixture,
  contractRecords,
  contractorOptions,
  employeeAccessRows,
  employeeInvites,
  equipmentRecords,
  journalRecords,
  measuringInstrumentRecords,
  runtimeSession,
  standardRecords,
} from "@/shared/storybook/runtime-fixtures";
import type {
  ApiEnvelope,
  ContractRecord,
  ContractorOption,
  EmployeeAccessResponse,
  EmployeeInviteResponse,
  EquipmentPhotoRecord,
  EquipmentRecord,
  JournalRecord,
  MeasuringInstrumentRecord,
  RegistryStatus,
  ScopeType,
  SessionSummaryResponse,
  StandardRecord,
  WorkType,
} from "@/shared/api";

type RuntimeApiOptions = {
  contracts?: ContractRecord[];
  contractorOptions?: ContractorOption[];
  employees?: EmployeeAccessResponse[];
  equipment?: EquipmentRecord[];
  failurePaths?: string[];
  invites?: EmployeeInviteResponse[];
  journals?: JournalRecord[];
  measuringInstruments?: MeasuringInstrumentRecord[];
  pendingPaths?: string[];
  session?: SessionSummaryResponse;
  standards?: StandardRecord[];
};

type RuntimeApiState = {
  contracts: ContractRecord[];
  contractorOptions: ContractorOption[];
  employees: EmployeeAccessResponse[];
  equipment: EquipmentRecord[];
  failurePaths: string[];
  invites: EmployeeInviteResponse[];
  journals: JournalRecord[];
  measuringInstruments: MeasuringInstrumentRecord[];
  pendingPaths: string[];
  session: SessionSummaryResponse;
  standards: StandardRecord[];
};

type JsonPayload = Record<string, unknown>;

function RuntimeApiBoundary({
  children,
  options,
}: {
  children: ReactNode;
  options: RuntimeApiOptions;
}) {
  useLayoutEffect(() => {
    const originalFetch = globalThis.fetch;
    const state = createRuntimeState(options);

    globalThis.fetch = (input, init) => handleRuntimeFetch(input, init, state);

    return () => {
      globalThis.fetch = originalFetch;
    };
  }, [options]);

  return <>{children}</>;
}

export function withRuntimeApi(options: RuntimeApiOptions = {}): Decorator {
  function RuntimeApiDecorator(Story: Parameters<Decorator>[0]) {
    return <RuntimeApiBoundary options={options}>{Story()}</RuntimeApiBoundary>;
  }

  return RuntimeApiDecorator;
}

function createRuntimeState(options: RuntimeApiOptions): RuntimeApiState {
  return {
    contracts: cloneFixture(options.contracts ?? contractRecords),
    contractorOptions: cloneFixture(options.contractorOptions ?? contractorOptions),
    employees: cloneFixture(options.employees ?? employeeAccessRows),
    equipment: cloneFixture(options.equipment ?? equipmentRecords).map((item) => ({
      ...item,
      journalCount: item.journalCount ?? 0,
      photos: item.photos ?? [],
    })),
    failurePaths: options.failurePaths ?? [],
    invites: cloneFixture(options.invites ?? employeeInvites),
    journals: cloneFixture(options.journals ?? journalRecords),
    measuringInstruments: cloneFixture(options.measuringInstruments ?? measuringInstrumentRecords).map((item) => ({
      ...item,
      photos: item.photos ?? [],
    })),
    pendingPaths: options.pendingPaths ?? [],
    session: cloneFixture(options.session ?? runtimeSession),
    standards: cloneFixture(options.standards ?? standardRecords),
  };
}

function equipmentWithMeasuringInstrumentCounts(state: RuntimeApiState) {
  return state.equipment.map((equipment) => ({
    ...equipment,
    measuringInstrumentCount: state.measuringInstruments.filter(
      (instrument) => !instrument.archivedAt && instrument.equipment?.id === equipment.id,
    ).length,
  }));
}

async function handleRuntimeFetch(
  input: RequestInfo | URL,
  init: RequestInit | undefined,
  state: RuntimeApiState,
): Promise<Response> {
  const url = toUrl(input);
  const pathname = url.pathname;
  const method = (init?.method ?? "GET").toUpperCase();

  if (matchesPath(state.pendingPaths, pathname)) {
    return new Promise<Response>(() => undefined);
  }

  if (matchesPath(state.failurePaths, pathname)) {
    return jsonResponse({ success: false, error: "Не удалось загрузить данные." }, 500);
  }

  const payload = await readPayload(init);

  if (pathname === "/api/platform/organization-shells" && method === "POST") {
    return jsonResponse({
      success: true,
      data: {
        organizationId: "org-new",
        organizationName: stringValue(payload, "organizationName", "Новая организация"),
        organizationRole: stringValue(payload, "organizationRole", "customer"),
        inviteId: "invite-first-admin",
        inviteEmail: stringValue(payload, "firstAdminEmail", "admin@vrk.local"),
        inviteStatus: "sent",
        inviteToken: "first-admin-token",
        inviteExpiresAt: "2026-05-06T09:00:00.000Z",
      },
    });
  }

  if (/^\/api\/auth\/invites\/[^/]+\/accept$/.test(pathname) && method === "POST") {
    return jsonResponse({ success: true, data: state.session });
  }

  const employeeInviteSendMatch = pathname.match(/^\/api\/auth\/employee-invites\/([^/]+)\/send$/);
  if (employeeInviteSendMatch && method === "POST") {
    const invite = updateInvite(state, employeeInviteSendMatch[1], {
      acceptPath: `/register/${employeeInviteSendMatch[1]}`,
      sentAt: new Date().toISOString(),
      status: "sent",
    });
    return jsonResponse({ success: true, data: invite });
  }

  const employeeInviteRevokeMatch = pathname.match(/^\/api\/auth\/employee-invites\/([^/]+)\/revoke$/);
  if (employeeInviteRevokeMatch && method === "POST") {
    const invite = updateInvite(state, employeeInviteRevokeMatch[1], {
      revokedAt: new Date().toISOString(),
      status: "revoked",
    });
    return jsonResponse({ success: true, data: invite });
  }

  if (pathname === "/api/auth/employee-invites" && method === "GET") {
    return jsonResponse({ success: true, data: state.invites });
  }

  if (pathname === "/api/auth/employee-invites" && method === "POST") {
    const invite: EmployeeInviteResponse = {
      id: `invite-${state.invites.length + 1}`,
      fullName: stringValue(payload, "fullName", "Новый сотрудник"),
      email: stringValue(payload, "email", "employee@vrk.local"),
      roleTemplate: stringValue(payload, "roleTemplate", "auditor"),
      scopeType: scopeValue(payload, "scopeType", "organization"),
      scopeId: stringValue(payload, "scopeId", state.session.organization.id),
      scopeLabel: resolveScopeLabel(state.session, scopeValue(payload, "scopeType", "organization"), stringValue(payload, "scopeId", state.session.organization.id)),
      status: "draft",
      expiresAt: stringValue(payload, "expiresAt", "2026-05-06T09:00:00.000Z"),
    };
    state.invites = [invite, ...state.invites];
    return jsonResponse({ success: true, data: invite });
  }

  if (pathname === "/api/auth/employees" && method === "GET") {
    return jsonResponse({ success: true, data: visibleEmployees(state.session, state.employees) });
  }

  const employeeAccessMatch = pathname.match(/^\/api\/auth\/employees\/([^/]+)$/);
  if (employeeAccessMatch && method === "PATCH") {
    const accessId = employeeAccessMatch[1];
    state.employees = state.employees.map((employee) =>
      employee.accessId === accessId
        ? {
            ...employee,
            roleTemplate: stringValue(payload, "roleTemplate", employee.roleTemplate),
            scopeType: scopeValue(payload, "scopeType", employee.scopeType),
            scopeId: stringValue(payload, "scopeId", employee.scopeId),
          }
        : employee,
    );
    state.employees = state.employees.map((employee) =>
      employee.accessId === accessId
        ? {
            ...employee,
            scopeLabel: resolveScopeLabel(state.session, employee.scopeType, employee.scopeId),
          }
        : employee,
    );
    return jsonResponse({
      success: true,
      data: state.employees.find((employee) => employee.accessId === accessId) ?? state.employees[0],
    });
  }

  const employeeDeactivateMatch = pathname.match(/^\/api\/auth\/employees\/([^/]+)\/deactivate$/);
  if (employeeDeactivateMatch && method === "POST") {
    const accessId = employeeDeactivateMatch[1];
    const employee = state.employees.find((item) => item.accessId === accessId) ?? state.employees[0];
    state.employees = state.employees.filter((item) => item.membershipId !== employee.membershipId);
    return jsonResponse({ success: true, data: { ...employee, membershipStatus: "archived" } });
  }

  if (pathname === "/api/company/profile" && method === "PATCH") {
    state.session.organization = {
      ...state.session.organization,
      actingBasis: stringValue(payload, "actingBasis", state.session.organization.actingBasis ?? ""),
      contractEmail: stringValue(payload, "contractEmail", state.session.organization.contractEmail ?? ""),
      contractPhone: stringValue(payload, "contractPhone", state.session.organization.contractPhone ?? ""),
      inn: stringValue(payload, "inn", state.session.organization.inn ?? ""),
      kpp: stringValue(payload, "kpp", state.session.organization.kpp ?? ""),
      leaderFullName: stringValue(payload, "leaderFullName", state.session.organization.leaderFullName ?? ""),
      leaderPosition: stringValue(payload, "leaderPosition", state.session.organization.leaderPosition ?? ""),
      name: stringValue(payload, "name", state.session.organization.name),
      propertyType: stringValue(payload, "propertyType", state.session.organization.propertyType ?? "ООО"),
      registeredAddress: stringValue(payload, "registeredAddress", state.session.organization.registeredAddress ?? ""),
      shortName: stringValue(payload, "shortName", state.session.organization.shortName ?? ""),
    };
    return jsonResponse({ success: true, data: state.session });
  }

  if (pathname === "/api/company/divisions" && method === "POST") {
    state.session.divisions = [
      {
        id: `division-${state.session.divisions.length + 1}`,
        type: "Дивизион",
        name: stringValue(payload, "name", "Новый дивизион"),
        region: stringValue(payload, "region", ""),
        registeredAddress: stringValue(payload, "registeredAddress", ""),
        leaderFullName: stringValue(payload, "leaderFullName", ""),
        leaderPosition: stringValue(payload, "leaderPosition", ""),
        contractPhone: stringValue(payload, "contractPhone", ""),
        contractEmail: stringValue(payload, "contractEmail", ""),
        actingBasis: stringValue(payload, "actingBasis", ""),
        status: "active",
        comment: stringValue(payload, "comment", ""),
      },
      ...state.session.divisions,
    ];
    return jsonResponse({ success: true, data: state.session });
  }

  const divisionMatch = pathname.match(/^\/api\/company\/divisions\/([^/]+)$/);
  if (divisionMatch && method === "PATCH") {
    state.session.divisions = state.session.divisions.map((division) =>
      division.id === divisionMatch[1]
        ? {
            ...division,
            contractEmail: stringValue(payload, "contractEmail", division.contractEmail ?? ""),
            contractPhone: stringValue(payload, "contractPhone", division.contractPhone ?? ""),
            leaderFullName: stringValue(payload, "leaderFullName", division.leaderFullName ?? ""),
            leaderPosition: stringValue(payload, "leaderPosition", division.leaderPosition ?? ""),
            name: stringValue(payload, "name", division.name),
            region: stringValue(payload, "region", division.region ?? ""),
            registeredAddress: stringValue(payload, "registeredAddress", division.registeredAddress ?? ""),
          }
        : division,
    );
    return jsonResponse({ success: true, data: state.session });
  }

  const archiveDivisionMatch = pathname.match(/^\/api\/company\/divisions\/([^/]+)\/archive$/);
  if (archiveDivisionMatch && method === "POST") {
    state.session.divisions = state.session.divisions.filter((division) => division.id !== archiveDivisionMatch[1]);
    state.session.units = state.session.units.filter((unit) => unit.divisionId !== archiveDivisionMatch[1]);
    return jsonResponse({ success: true, data: state.session });
  }

  if (pathname === "/api/company/units" && method === "POST") {
    state.session.units = [
      {
        id: `unit-${state.session.units.length + 1}`,
        type: stringValue(payload, "type", "ВРД"),
        name: stringValue(payload, "name", "Новый юнит"),
        region: stringValue(payload, "region", ""),
        divisionId: stringValue(payload, "divisionId", ""),
        registeredAddress: stringValue(payload, "registeredAddress", ""),
        leaderFullName: stringValue(payload, "leaderFullName", ""),
        leaderPosition: stringValue(payload, "leaderPosition", ""),
        contractPhone: stringValue(payload, "contractPhone", ""),
        contractEmail: stringValue(payload, "contractEmail", ""),
        actingBasis: stringValue(payload, "actingBasis", ""),
        status: "active",
        comment: stringValue(payload, "comment", ""),
      },
      ...state.session.units,
    ];
    return jsonResponse({ success: true, data: state.session });
  }

  const unitMatch = pathname.match(/^\/api\/company\/units\/([^/]+)$/);
  if (unitMatch && method === "PATCH") {
    state.session.units = state.session.units.map((unit) =>
      unit.id === unitMatch[1]
        ? {
            ...unit,
            contractEmail: stringValue(payload, "contractEmail", unit.contractEmail ?? ""),
            contractPhone: stringValue(payload, "contractPhone", unit.contractPhone ?? ""),
            divisionId: stringValue(payload, "divisionId", unit.divisionId ?? ""),
            leaderFullName: stringValue(payload, "leaderFullName", unit.leaderFullName ?? ""),
            leaderPosition: stringValue(payload, "leaderPosition", unit.leaderPosition ?? ""),
            name: stringValue(payload, "name", unit.name),
            region: stringValue(payload, "region", unit.region ?? ""),
            registeredAddress: stringValue(payload, "registeredAddress", unit.registeredAddress ?? ""),
            type: stringValue(payload, "type", unit.type),
          }
        : unit,
    );
    return jsonResponse({ success: true, data: state.session });
  }

  const archiveUnitMatch = pathname.match(/^\/api\/company\/units\/([^/]+)\/archive$/);
  if (archiveUnitMatch && method === "POST") {
    state.session.units = state.session.units.filter((unit) => unit.id !== archiveUnitMatch[1]);
    return jsonResponse({ success: true, data: state.session });
  }

  if (pathname === "/api/contracts" && method === "POST") {
    const contractor = state.contractorOptions.find(
      (option) => option.id === stringValue(payload, "contractorOrganizationId", ""),
    ) ?? state.contractorOptions[0];
    const divisionId = stringValue(payload, "divisionId", "");
    const unitId = stringValue(payload, "unitId", "");
    const scopeType: ScopeType = unitId ? "unit" : divisionId ? "division" : "organization";
    const scopeId = unitId || divisionId || state.session.organization.id;
    const contract: ContractRecord = {
      id: `contract-${state.contracts.length + 1}`,
      customerOrganizationId: state.session.organization.id,
      customerOrganizationName: state.session.organization.name,
      contractorOrganizationId: contractor.id,
      contractorOrganizationName: contractor.name,
      contractNumber: stringValue(payload, "contractNumber", "Новый договор"),
      contractStatus: contractStatusValue(payload, "contractStatus"),
      startDate: stringValue(payload, "startDate", "2026-05-01"),
      endDate: stringValue(payload, "endDate", "2026-12-31"),
      workType: workTypeValue(payload, "workType"),
      equipmentType: stringValue(payload, "equipmentType", "оборудование"),
      region: stringValue(payload, "region", "Санкт-Петербург"),
      locationScope: {
        scopeType,
        scopeId,
        label: stringValue(payload, "locationScopeLabel", resolveScopeLabel(state.session, scopeType, scopeId)),
      },
      subjectOfAgreement: stringValue(payload, "subjectOfAgreement", ""),
      routingEligible: contractStatusValue(payload, "contractStatus") === "active",
    };
    state.contracts = [contract, ...state.contracts];
    return jsonResponse({ success: true, data: contract });
  }

  const contractMatch = pathname.match(/^\/api\/contracts\/([^/]+)$/);
  if (contractMatch && method === "PUT") {
    const nextStatus = contractStatusValue(payload, "contractStatus");
    state.contracts = state.contracts.map((contract) =>
      contract.id === contractMatch[1]
        ? { ...contract, contractStatus: nextStatus, routingEligible: nextStatus === "active" }
        : contract,
    );
    return jsonResponse({ success: true, data: state.contracts.find((contract) => contract.id === contractMatch[1]) });
  }

  if (pathname === "/api/contracts/routing/resolve" && method === "POST") {
    const workType = workTypeValue(payload, "workType");
    const matches = state.contracts
      .filter((contract) => contract.contractStatus === "active" && contract.workType === workType)
      .map((contract) => ({
        contract,
        contractor: state.contractorOptions.find((option) => option.id === contract.contractorOrganizationId) ?? state.contractorOptions[0],
      }));
    return jsonResponse({
      success: true,
      data: {
        unitId: stringValue(payload, "unitId", ""),
        workType,
        equipmentType: stringValue(payload, "equipmentType", ""),
        region: stringValue(payload, "region", ""),
        matches,
      },
    });
  }

  if (pathname === "/api/equipment" && method === "GET") {
    return pagedResponse(equipmentWithMeasuringInstrumentCounts(state), url.searchParams.get("includeArchived") === "true");
  }

  if (pathname === "/api/equipment/measuring-instruments" && method === "GET") {
    return pagedResponse(state.measuringInstruments, url.searchParams.get("includeArchived") === "true");
  }

  if (pathname === "/api/equipment" && method === "POST") {
    const unit = state.session.units.find((item) => item.id === stringValue(payload, "unitId", "")) ?? state.session.units[0];
    const equipment: EquipmentRecord = {
      id: `equipment-${state.equipment.length + 1}`,
      organizationId: state.session.organization.id,
      unit: {
        id: unit?.id ?? "unit",
        name: unit?.name ?? "Юнит",
        divisionId: unit?.divisionId,
        divisionName: state.session.divisions.find((division) => division.id === unit?.divisionId)?.name,
      },
      manufacturer: stringValue(payload, "manufacturer", "Производитель"),
      classification: stringValue(payload, "classification", "Оборудование"),
      model: stringValue(payload, "model", "Модель"),
      fullName: stringValue(payload, "fullName", "Новая карточка оборудования"),
      factoryNumber: stringValue(payload, "factoryNumber", "SN-001"),
      inventoryNumber: stringValue(payload, "inventoryNumber", ""),
      manufactureYear: numberValue(payload, "manufactureYear", 2026),
      status: registryStatusValue(payload, "status"),
      comment: stringValue(payload, "comment", ""),
      documentUrl: stringValue(payload, "documentUrl", ""),
      photos: [],
      journalCount: 0,
      measuringInstrumentCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    state.equipment = [equipment, ...state.equipment];
    return jsonResponse({ success: true, data: equipment });
  }

  const equipmentMatch = pathname.match(/^\/api\/equipment\/([^/]+)$/);
  if (equipmentMatch && method === "PATCH") {
    const unit = state.session.units.find((item) => item.id === stringValue(payload, "unitId", "")) ?? state.session.units[0];
    state.equipment = state.equipment.map((item) =>
      item.id === equipmentMatch[1]
        ? {
            ...item,
            unit: {
              id: unit?.id ?? item.unit.id,
              name: unit?.name ?? item.unit.name,
              divisionId: unit?.divisionId,
              divisionName: state.session.divisions.find((division) => division.id === unit?.divisionId)?.name,
            },
            manufacturer: stringValue(payload, "manufacturer", item.manufacturer),
            classification: stringValue(payload, "classification", item.classification),
            model: stringValue(payload, "model", item.model),
            fullName: stringValue(payload, "fullName", item.fullName),
            factoryNumber: stringValue(payload, "factoryNumber", item.factoryNumber),
            inventoryNumber: stringValue(payload, "inventoryNumber", item.inventoryNumber ?? ""),
            manufactureYear: numberValue(payload, "manufactureYear", item.manufactureYear),
            status: registryStatusValue(payload, "status"),
            comment: stringValue(payload, "comment", item.comment ?? ""),
            documentUrl: stringValue(payload, "documentUrl", item.documentUrl ?? ""),
            updatedAt: new Date().toISOString(),
          }
        : item,
    );
    return jsonResponse({ success: true, data: state.equipment.find((item) => item.id === equipmentMatch[1]) });
  }

  if (pathname === "/api/equipment/measuring-instruments" && method === "POST") {
    const unit = state.session.units.find((item) => item.id === stringValue(payload, "unitId", "")) ?? state.session.units[0];
    const standardIds = Array.isArray(payload.standardIds)
      ? payload.standardIds.filter((id): id is string => typeof id === "string")
      : [];
    const instrument: MeasuringInstrumentRecord = {
      id: `mi-${state.measuringInstruments.length + 1}`,
      organizationId: state.session.organization.id,
      unit: {
        id: unit?.id ?? "unit",
        name: unit?.name ?? "Юнит",
        divisionId: unit?.divisionId,
        divisionName: state.session.divisions.find((division) => division.id === unit?.divisionId)?.name,
      },
      name: stringValue(payload, "name", "Новое средство измерения"),
      instrumentType: stringValue(payload, "instrumentType", "Средство измерения"),
      model: stringValue(payload, "model", "Модель"),
      registrationNumber: stringValue(payload, "registrationNumber", "SI-NEW"),
      serialNumber: stringValue(payload, "serialNumber", "SN-NEW"),
      status: "active",
      placementKind: stringValue(payload, "placementKind", "standalone") === "built_in" ? "built_in" : "standalone",
      photos: [],
      standards: state.standards
        .filter((standard) => standardIds.includes(standard.id))
        .map((standard) => ({
          id: standard.id,
          standardType: standard.standardType,
          model: standard.model,
          identifier: standard.identifier,
          serialNumber: standard.serialNumber,
          status: standard.status,
          scopeLabel: standard.ownershipScope.label,
        })),
      journalCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    state.measuringInstruments = [instrument, ...state.measuringInstruments];
    return jsonResponse({ success: true, data: instrument });
  }

  const measuringInstrumentMatch = pathname.match(/^\/api\/equipment\/measuring-instruments\/([^/]+)$/);
  if (measuringInstrumentMatch && method === "PATCH") {
    const unit = state.session.units.find((item) => item.id === stringValue(payload, "unitId", "")) ?? state.session.units[0];
    const placementKind = stringValue(payload, "placementKind", "standalone") === "built_in" ? "built_in" : "standalone";
    const equipment =
      placementKind === "built_in"
        ? state.equipment.find((item) => item.id === stringValue(payload, "equipmentId", ""))
        : undefined;
    const standardIds = Array.isArray(payload.standardIds)
      ? payload.standardIds.filter((id): id is string => typeof id === "string")
      : [];
    state.measuringInstruments = state.measuringInstruments.map((item) =>
      item.id === measuringInstrumentMatch[1]
        ? {
            ...item,
            unit: {
              id: unit?.id ?? item.unit.id,
              name: unit?.name ?? item.unit.name,
              divisionId: unit?.divisionId,
              divisionName: state.session.divisions.find((division) => division.id === unit?.divisionId)?.name,
            },
            equipment: equipment ? { id: equipment.id, fullName: equipment.fullName } : undefined,
            name: stringValue(payload, "name", item.name),
            instrumentType: stringValue(payload, "instrumentType", item.instrumentType),
            model: stringValue(payload, "model", item.model),
            registrationNumber: stringValue(payload, "registrationNumber", item.registrationNumber),
            serialNumber: stringValue(payload, "serialNumber", item.serialNumber),
            placementKind,
            standards: state.standards
              .filter((standard) => standardIds.includes(standard.id))
              .map((standard) => ({
                id: standard.id,
                standardType: standard.standardType,
                model: standard.model,
                identifier: standard.identifier,
                serialNumber: standard.serialNumber,
                status: standard.status,
                scopeLabel: standard.ownershipScope.label,
              })),
            comment: stringValue(payload, "comment", item.comment ?? ""),
            documentUrl: stringValue(payload, "documentUrl", item.documentUrl ?? ""),
            updatedAt: new Date().toISOString(),
          }
        : item,
    );
    return jsonResponse({
      success: true,
      data: state.measuringInstruments.find((item) => item.id === measuringInstrumentMatch[1]),
    });
  }

  const equipmentPhotoCollectionMatch = pathname.match(/^\/api\/equipment\/([^/]+)\/photos$/);
  if (equipmentPhotoCollectionMatch && method === "POST") {
    const equipmentId = equipmentPhotoCollectionMatch[1];
    const photo = createEquipmentPhoto(init, `/api/equipment/${equipmentId}/photos`);
    state.equipment = state.equipment.map((item) =>
      item.id === equipmentId
        ? {
            ...item,
            photos: [...(item.photos ?? []), photo],
            updatedAt: new Date().toISOString(),
          }
        : item,
    );
    return jsonResponse({ success: true, data: photo }, 201);
  }

  const equipmentPhotoItemMatch = pathname.match(/^\/api\/equipment\/([^/]+)\/photos\/([^/]+)$/);
  if (equipmentPhotoItemMatch && method === "GET") {
    return pngResponse();
  }
  if (equipmentPhotoItemMatch && method === "DELETE") {
    const [, equipmentId, photoId] = equipmentPhotoItemMatch;
    const photo = state.equipment.find((item) => item.id === equipmentId)?.photos?.find((item) => item.id === photoId);
    state.equipment = state.equipment.map((item) =>
      item.id === equipmentId
        ? {
            ...item,
            photos: (item.photos ?? []).filter((candidate) => candidate.id !== photoId),
            updatedAt: new Date().toISOString(),
          }
        : item,
    );
    return jsonResponse({ success: true, data: photo ?? deletedPhoto(photoId) });
  }

  const measuringInstrumentPhotoCollectionMatch = pathname.match(
    /^\/api\/equipment\/measuring-instruments\/([^/]+)\/photos$/,
  );
  if (measuringInstrumentPhotoCollectionMatch && method === "POST") {
    const measuringInstrumentId = measuringInstrumentPhotoCollectionMatch[1];
    const photo = createEquipmentPhoto(init, `/api/equipment/measuring-instruments/${measuringInstrumentId}/photos`);
    state.measuringInstruments = state.measuringInstruments.map((item) =>
      item.id === measuringInstrumentId
        ? {
            ...item,
            photos: [...(item.photos ?? []), photo],
            updatedAt: new Date().toISOString(),
          }
        : item,
    );
    return jsonResponse({ success: true, data: photo }, 201);
  }

  const measuringInstrumentPhotoItemMatch = pathname.match(
    /^\/api\/equipment\/measuring-instruments\/([^/]+)\/photos\/([^/]+)$/,
  );
  if (measuringInstrumentPhotoItemMatch && method === "GET") {
    return pngResponse();
  }
  if (measuringInstrumentPhotoItemMatch && method === "DELETE") {
    const [, measuringInstrumentId, photoId] = measuringInstrumentPhotoItemMatch;
    const photo = state.measuringInstruments
      .find((item) => item.id === measuringInstrumentId)
      ?.photos?.find((item) => item.id === photoId);
    state.measuringInstruments = state.measuringInstruments.map((item) =>
      item.id === measuringInstrumentId
        ? {
            ...item,
            photos: (item.photos ?? []).filter((candidate) => candidate.id !== photoId),
            updatedAt: new Date().toISOString(),
          }
        : item,
    );
    return jsonResponse({ success: true, data: photo ?? deletedPhoto(photoId) });
  }

  const measuringInstrumentStandardMatch = pathname.match(/^\/api\/equipment\/measuring-instruments\/([^/]+)\/standards$/);
  if (measuringInstrumentStandardMatch && method === "POST") {
    const divisionId = stringValue(payload, "divisionId", "");
    const unitId = stringValue(payload, "unitId", "");
    const diagnosticEquipmentId = measuringInstrumentStandardMatch[1];
    const diagnosticEquipment = state.measuringInstruments.find((item) => item.id === diagnosticEquipmentId);
    const scopeType = unitId ? "unit" : divisionId ? "division" : "organization";
    const scopeId = unitId || divisionId;
    const standard: StandardRecord = {
      id: `standard-${state.standards.length + 1}`,
      organizationId: state.session.organization.id,
      diagnosticEquipment: diagnosticEquipment
        ? {
            id: diagnosticEquipment.id,
            name: diagnosticEquipment.name,
          }
        : undefined,
      ownershipScope: {
        scopeType,
        ...(scopeId ? { scopeId } : {}),
        label: stringValue(payload, "ownerLabel", resolveScopeLabel(state.session, scopeType, scopeId)),
      },
      standardType: stringValue(payload, "standardType", "Эталон"),
      model: stringValue(payload, "model", "Модель"),
      identifier: stringValue(payload, "identifier", "STD-NEW"),
      serialNumber: stringValue(payload, "serialNumber", ""),
      metrologicalCharacteristics: stringValue(payload, "metrologicalCharacteristics", ""),
      status: "active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    state.standards = [standard, ...state.standards];
    if (diagnosticEquipment) {
      const linkedStandard = {
        id: standard.id,
        standardType: standard.standardType,
        model: standard.model,
        identifier: standard.identifier,
        serialNumber: standard.serialNumber,
        status: standard.status,
        scopeLabel: standard.ownershipScope.label,
      };
      state.measuringInstruments = state.measuringInstruments.map((item) =>
        item.id === diagnosticEquipment.id
          ? {
              ...item,
              standards: [linkedStandard, ...item.standards],
            }
          : item,
      );
    }
    return jsonResponse({ success: true, data: standard });
  }

  const measuringInstrumentStandardDeleteMatch = pathname.match(
    /^\/api\/equipment\/measuring-instruments\/([^/]+)\/standards\/([^/]+)$/,
  );
  if (measuringInstrumentStandardDeleteMatch && method === "DELETE") {
    const diagnosticEquipmentId = measuringInstrumentStandardDeleteMatch[1];
    const standardId = measuringInstrumentStandardDeleteMatch[2];
    state.standards = state.standards.filter((standard) => standard.id !== standardId);
    state.measuringInstruments = state.measuringInstruments.map((item) =>
      item.id === diagnosticEquipmentId
        ? {
            ...item,
            standards: item.standards.filter((standard) => standard.id !== standardId),
            updatedAt: new Date().toISOString(),
          }
        : item,
    );
    return jsonResponse({ success: true, data: { id: standardId } });
  }

  const archiveEquipmentMatch = pathname.match(/^\/api\/equipment\/([^/]+)\/archive$/);
  if (archiveEquipmentMatch && method === "POST") {
    const item = archiveById(state.equipment, archiveEquipmentMatch[1]);
    return jsonResponse({ success: true, data: item });
  }

  const equipmentJournalMatch = pathname.match(/^\/api\/equipment\/([^/]+)\/journals$/);
  if (equipmentJournalMatch && method === "GET") {
    return jsonResponse({ success: true, data: state.journals });
  }

  if (equipmentJournalMatch && method === "POST") {
    const journal = createJournal(payload);
    state.journals = [journal, ...state.journals];
    state.equipment = state.equipment.map((item) =>
      item.id === equipmentJournalMatch[1] ? applyJournalSummary(item, journal) : item,
    );
    return jsonResponse({ success: true, data: journal });
  }

  const archiveMiMatch = pathname.match(/^\/api\/equipment\/measuring-instruments\/([^/]+)\/archive$/);
  if (archiveMiMatch && method === "POST") {
    const item = archiveById(state.measuringInstruments, archiveMiMatch[1]);
    return jsonResponse({ success: true, data: item });
  }

  const miJournalMatch = pathname.match(/^\/api\/equipment\/measuring-instruments\/([^/]+)\/journals$/);
  if (miJournalMatch && method === "GET") {
    return jsonResponse({ success: true, data: state.journals });
  }

  if (miJournalMatch && method === "POST") {
    const journal = createJournal(payload);
    state.journals = [journal, ...state.journals];
    state.measuringInstruments = state.measuringInstruments.map((item) =>
      item.id === miJournalMatch[1] ? applyJournalSummary(item, journal) : item,
    );
    return jsonResponse({ success: true, data: journal });
  }

  return jsonResponse({ success: false, error: "Storybook mock route is not configured." }, 404);
}

function toUrl(input: RequestInfo | URL) {
  const base = typeof window === "undefined" ? "http://storybook.local" : window.location.origin;

  if (typeof input === "string" || input instanceof URL) {
    return new URL(input, base);
  }

  return new URL(input.url, base);
}

async function readPayload(init: RequestInit | undefined): Promise<JsonPayload> {
  if (typeof init?.body !== "string" || init.body.length === 0) {
    return {};
  }

  try {
    return JSON.parse(init.body) as JsonPayload;
  } catch {
    return {};
  }
}

function jsonResponse<T>(body: ApiEnvelope<T>, status = 200) {
  return new Response(JSON.stringify(body), {
    headers: { "Content-Type": "application/json" },
    status,
  });
}

function pngResponse() {
  const bytes = Uint8Array.from(atob("iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFElEQVR42mP8z8Dwn4GBgYGJAQoAHxcCAs3H4usAAAAASUVORK5CYII="), (char) =>
    char.charCodeAt(0),
  );
  return new Response(bytes, {
    headers: {
      "Content-Type": "image/png",
      "Content-Length": String(bytes.byteLength),
    },
  });
}

function pagedResponse<T extends { archivedAt?: string }>(items: T[], includeArchived: boolean) {
  const data = includeArchived ? items : items.filter((item) => !item.archivedAt);
  return jsonResponse({
    success: true,
    data,
    meta: {
      limit: 100,
      offset: 0,
      total: data.length,
    },
  });
}

function createEquipmentPhoto(init: RequestInit | undefined, urlBase: string): EquipmentPhotoRecord {
  const file = photoFile(init);
  const id = `photo-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return {
    id,
    fileName: file?.name ?? "equipment-photo.png",
    contentType:
      file?.type === "image/jpeg" || file?.type === "image/webp" || file?.type === "image/png"
        ? file.type
        : "image/png",
    sizeBytes: file?.size ?? 92,
    sortOrder: 0,
    url: file ? URL.createObjectURL(file) : `${urlBase}/${id}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function photoFile(init: RequestInit | undefined) {
  if (typeof FormData === "undefined" || !(init?.body instanceof FormData)) {
    return null;
  }
  const value = init.body.get("photo");
  return value instanceof File ? value : null;
}

function deletedPhoto(photoId: string): EquipmentPhotoRecord {
  const timestamp = new Date().toISOString();
  return {
    id: photoId,
    fileName: "deleted-photo.png",
    contentType: "image/png",
    sizeBytes: 1,
    sortOrder: 0,
    url: "",
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

function matchesPath(paths: string[], pathname: string) {
  return paths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

function updateInvite(
  state: RuntimeApiState,
  inviteId: string,
  patch: Partial<EmployeeInviteResponse>,
) {
  state.invites = state.invites.map((invite) => (invite.id === inviteId ? { ...invite, ...patch } : invite));
  return state.invites.find((invite) => invite.id === inviteId) ?? state.invites[0];
}

function visibleEmployees(session: SessionSummaryResponse, employees: EmployeeAccessResponse[]) {
  if (session.workspace.scopeType === "organization") {
    return employees;
  }

  if (session.workspace.scopeType === "division") {
    const childUnitIds = new Set(session.units.map((unit) => unit.id));
    return employees.filter(
      (employee) =>
        (employee.scopeType === "division" && employee.scopeId === session.workspace.scopeId) ||
        (employee.scopeType === "unit" && childUnitIds.has(employee.scopeId)),
    );
  }

  return employees.filter(
    (employee) => employee.scopeType === "unit" && employee.scopeId === session.workspace.scopeId,
  );
}

function archiveById<T extends { archivedAt?: string; id: string; updatedAt: string }>(items: T[], id: string) {
  const archivedAt = new Date().toISOString();
  const index = items.findIndex((item) => item.id === id);
  if (index === -1) {
    return items[0];
  }

  items[index] = {
    ...items[index],
    archivedAt,
    updatedAt: archivedAt,
  };
  return items[index];
}

function createJournal(payload: JsonPayload): JournalRecord {
  return {
    id: `journal-${Date.now()}`,
    operationType: operationValue(payload, "operationType"),
    operationDate: stringValue(payload, "operationDate", "2026-04-29"),
    documentNumber: stringValue(payload, "documentNumber", "ЖР-NEW"),
    validUntil: stringValue(payload, "validUntil", ""),
    executorOrganization: stringValue(payload, "executorOrganization", "Исполнитель"),
    attachmentUrl: stringValue(payload, "attachmentUrl", ""),
    comment: stringValue(payload, "comment", ""),
    createdAt: new Date().toISOString(),
  };
}

function applyJournalSummary<
  T extends {
    journalCount: number;
    latestJournal?: JournalRecord;
    nextDueDate?: string;
    status: RegistryStatus;
    updatedAt: string;
  },
>(
  item: T,
  journal: JournalRecord,
): T {
  const status: RegistryStatus =
    journal.operationType === "decommission" ? "retired" : journal.operationType === "suspension" ? "inactive" : "active";

  return {
    ...item,
    journalCount: item.journalCount + 1,
    latestJournal: journal,
    nextDueDate: journal.validUntil || item.nextDueDate,
    status,
    updatedAt: new Date().toISOString(),
  };
}

function resolveScopeLabel(session: SessionSummaryResponse, scopeType: ScopeType, scopeId: string) {
  if (scopeType === "division") {
    return session.divisions.find((division) => division.id === scopeId)?.name ?? "Дивизион";
  }
  if (scopeType === "unit") {
    return session.units.find((unit) => unit.id === scopeId)?.name ?? "Юнит";
  }
  return session.organization.name;
}

function stringValue(payload: JsonPayload, key: string, fallback: string) {
  const value = payload[key];
  return typeof value === "string" && value.length > 0 ? value : fallback;
}

function numberValue(payload: JsonPayload, key: string, fallback: number) {
  const value = payload[key];
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function scopeValue(payload: JsonPayload, key: string, fallback: ScopeType): ScopeType {
  const value = payload[key];
  return value === "division" || value === "unit" || value === "organization" ? value : fallback;
}

function contractStatusValue(payload: JsonPayload, key: string) {
  const value = payload[key];
  return value === "active" || value === "expired" || value === "inactive" ? value : "inactive";
}

function workTypeValue(payload: JsonPayload, key: string): WorkType {
  const value = payload[key];
  return value === "maintenance" || value === "verification" || value === "repair" ? value : "repair";
}

function registryStatusValue(payload: JsonPayload, key: string): RegistryStatus {
  const value = payload[key];
  return value === "inactive" || value === "retired" || value === "active" ? value : "active";
}

function operationValue(payload: JsonPayload, key: string): JournalRecord["operationType"] {
  const value = payload[key];
  if (
    value === "calibration" ||
    value === "decommission" ||
    value === "maintenance" ||
    value === "suspension" ||
    value === "verification"
  ) {
    return value;
  }

  return "verification";
}
