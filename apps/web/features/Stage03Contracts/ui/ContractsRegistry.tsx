"use client";

import { useState, useTransition } from "react";
import { Building2, ClipboardCheck, Route, ShieldAlert, UserRoundCheck } from "lucide-react";
import { Badge, Button, Card, InputField, SelectField } from "@/shared/ui";
import { sessionHasCapability } from "@/shared/api";
import type {
  ApiEnvelope,
  ContractRecord,
  ContractStatus,
  ContractorOption,
  RoutingResolveResult,
  SessionSummaryResponse,
  WorkType,
} from "@/shared/api";

const workTypeLabels: Record<WorkType, string> = {
  repair: "Ремонт",
  maintenance: "ТО",
  verification: "Поверка",
};

const contractStatusLabels: Record<ContractStatus, string> = {
  inactive: "Не активен",
  active: "Активен",
  expired: "Истек",
};

const contractStatusOptions = [
  { label: contractStatusLabels.inactive, value: "inactive" },
  { label: contractStatusLabels.active, value: "active" },
  { label: contractStatusLabels.expired, value: "expired" },
] as const;

const scopeTypeOptions = [
  { label: "Вся организация", value: "organization" },
  { label: "Подразделение", value: "division" },
  { label: "Юнит", value: "unit" },
] as const;

const statusTones: Record<ContractStatus, "neutral" | "success" | "warning"> = {
  inactive: "neutral",
  active: "success",
  expired: "warning",
};

const contractDateFormatter = new Intl.DateTimeFormat("ru-RU", {
  dateStyle: "medium",
  timeZone: "UTC",
});

type Props = {
  session: SessionSummaryResponse;
  initialContracts: ContractRecord[];
  contractorOptions: ContractorOption[];
};

function resolveScopeLabel(session: SessionSummaryResponse, scopeType: "organization" | "division" | "unit", scopeId: string) {
  if (scopeType === "organization") {
    return session.organization.name;
  }
  if (scopeType === "division") {
    return session.divisions.find((item) => item.id === scopeId)?.name ?? session.organization.name;
  }
  return session.units.find((item) => item.id === scopeId)?.name ?? session.organization.name;
}

function formatScopeType(scopeType: ContractRecord["locationScope"]["scopeType"]) {
  switch (scopeType) {
    case "organization":
      return "Организация";
    case "division":
      return "Подразделение";
    default:
      return "Юнит";
  }
}

function formatContractDate(date: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const [year, month, day] = date.split("-");
    return contractDateFormatter.format(new Date(Date.UTC(Number(year), Number(month) - 1, Number(day))));
  }

  const parsedDate = new Date(date);
  return Number.isNaN(parsedDate.getTime()) ? date : contractDateFormatter.format(parsedDate);
}

export function ContractsRegistry({ contractorOptions, initialContracts, session }: Props) {
  const isCustomerContour = session.organization.roleTitle === "customer";
  const canManageContracts = isCustomerContour && sessionHasCapability(session, "manage_contracts");
  const [contracts, setContracts] = useState(initialContracts);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [routingPreview, setRoutingPreview] = useState<RoutingResolveResult | null>(null);
  const [routingError, setRoutingError] = useState<string | null>(null);
  const [contractNumber, setContractNumber] = useState("");
  const [contractStatus, setContractStatus] = useState<ContractStatus>("inactive");
  const [contractorOrganizationId, setContractorOrganizationId] = useState(contractorOptions[0]?.id ?? "");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [workType, setWorkType] = useState<WorkType>("repair");
  const [equipmentType, setEquipmentType] = useState("");
  const [region, setRegion] = useState("");
  const [subjectOfAgreement, setSubjectOfAgreement] = useState("");
  const [scopeType, setScopeType] = useState<"organization" | "division" | "unit">("organization");
  const [scopeId, setScopeId] = useState("");
  const [routingUnitId, setRoutingUnitId] = useState(session.units[0]?.id ?? "");
  const [routingWorkType, setRoutingWorkType] = useState<WorkType>("repair");
  const [routingEquipmentType, setRoutingEquipmentType] = useState("");
  const [routingRegion, setRoutingRegion] = useState("");
  const isScopeSelectionMissing = scopeType !== "organization" && scopeId === "";

  const handleCreate = async () => {
    const locationScopeLabel = resolveScopeLabel(session, scopeType, scopeId);
    const payload = {
      contractorOrganizationId,
      contractNumber,
      contractStatus,
      startDate,
      endDate,
      workType,
      equipmentType,
      region,
      ...(scopeType === "division" ? { divisionId: scopeId } : {}),
      ...(scopeType === "unit" ? { unitId: scopeId } : {}),
      locationScopeLabel,
      ...(subjectOfAgreement ? { subjectOfAgreement } : {}),
    };

    const response = await fetch("/api/contracts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = (await response.json()) as ApiEnvelope<ContractRecord>;
    if (!response.ok || !body.success || !body.data) {
      throw new Error(body.error ?? "Не удалось создать договор.");
    }

    setContracts((current) => [body.data!, ...current]);
    setContractNumber("");
    setContractStatus("inactive");
    setStartDate("");
    setEndDate("");
    setEquipmentType("");
    setRegion("");
    setSubjectOfAgreement("");
    setScopeType("organization");
    setScopeId("");
  };

  const updateContractStatus = async (contractId: string, nextStatus: ContractStatus) => {
    const response = await fetch(`/api/contracts/${contractId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contractStatus: nextStatus }),
    });
    const body = (await response.json()) as ApiEnvelope<ContractRecord>;
    if (!response.ok || !body.success || !body.data) {
      throw new Error(body.error ?? "Не удалось обновить статус договора.");
    }

    setContracts((current) => current.map((item) => (item.id === contractId ? body.data! : item)));
  };

  const handleRoutingPreview = async () => {
    const response = await fetch("/api/contracts/routing/resolve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        unitId: routingUnitId,
        workType: routingWorkType,
        equipmentType: routingEquipmentType,
        region: routingRegion,
      }),
    });
    const body = (await response.json()) as ApiEnvelope<RoutingResolveResult>;
    if (!response.ok || !body.success || !body.data) {
      throw new Error(body.error ?? "Не удалось построить routing preview.");
    }

    setRoutingPreview(body.data);
  };

  return (
    <div className="grid gap-6">
      {error ? (
        <div
          aria-live="polite"
          className="rounded-[var(--radius-lg)] border border-destructive/20 bg-destructive-soft px-4 py-3 text-sm text-destructive"
        >
          {error}
        </div>
      ) : null}

      {!isCustomerContour ? (
        <Card className="gap-4" padding="lg">
          <div className="space-y-2">
            <Badge tone="info">Договоры подрядчика</Badge>
            <h2 className="text-xl font-semibold text-foreground">Доступные договоры</h2>
            <p className="text-sm leading-6 text-muted-foreground">
              Показаны договоры заказчиков, назначенные вашей организации.
            </p>
          </div>
          {contracts.length ? (
            <div className="grid gap-3">
              {contracts.map((contract) => (
                <Card className="gap-3" key={contract.id} padding="md">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="font-semibold text-foreground">{contract.contractNumber}</p>
                      <p className="text-sm text-muted-foreground">{contract.customerOrganizationName}</p>
                    </div>
                    <Badge tone={statusTones[contract.contractStatus]}>
                      {contractStatusLabels[contract.contractStatus]}
                    </Badge>
                  </div>
                  <div className="grid gap-3 text-sm text-muted-foreground md:grid-cols-2">
                    <div>Вид работ: {workTypeLabels[contract.workType]}</div>
                    <div>Тип оборудования: {contract.equipmentType}</div>
                    <div>Регион: {contract.region}</div>
                    <div>Область: {contract.locationScope.label}</div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="rounded-[var(--radius-lg)] border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
              Для вашей организации пока нет доступных договоров.
            </div>
          )}
        </Card>
      ) : null}

      {isCustomerContour && !canManageContracts ? (
        <Card className="gap-4" padding="lg">
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-[var(--radius-lg)] bg-warning-soft text-warning-strong">
              <ShieldAlert aria-hidden="true" className="size-5" />
              </div>
              <div>
              <h2 className="text-xl font-semibold text-foreground">Контур договоров ограничен</h2>
              <p className="text-sm leading-6 text-muted-foreground">
                Управлять реестром договоров может только администратор заказчика на уровне всей организации.
              </p>
            </div>
          </div>
        </Card>
      ) : null}

      {canManageContracts ? (
        <>
          <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
            <Card className="gap-5" padding="lg">
              <div className="space-y-2">
                <Badge tone="interactive">Реестр заказчика</Badge>
                <h2 className="text-xl font-semibold text-foreground">Создать договор и привязать подрядчика</h2>
                <p className="text-sm leading-6 text-muted-foreground">
                  Укажите подрядчика, область действия, сроки, вид работ, тип оборудования и регион.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <InputField
                  label="Номер договора"
                  name="contractNumber"
                  onChange={(event) => setContractNumber(event.target.value)}
                  value={contractNumber}
                />
                <SelectField
                  label="Подрядчик"
                  name="contractorOrganizationId"
                  onChange={(event) => setContractorOrganizationId(event.target.value)}
                  options={contractorOptions.map((option) => ({
                    label: option.shortName ? `${option.name} (${option.shortName})` : option.name,
                    value: option.id,
                  }))}
                  placeholder="Выберите подрядчика"
                  value={contractorOrganizationId}
                />
                <SelectField
                  label="Статус"
                  name="contractStatus"
                  onChange={(event) => setContractStatus(event.target.value as ContractStatus)}
                  options={contractStatusOptions}
                  value={contractStatus}
                />
                <SelectField
                  label="Вид работ"
                  name="workType"
                  onChange={(event) => setWorkType(event.target.value as WorkType)}
                  options={Object.entries(workTypeLabels).map(([value, label]) => ({ label, value }))}
                  value={workType}
                />
                <InputField
                  label="Дата начала"
                  name="startDate"
                  onChange={(event) => setStartDate(event.target.value)}
                  type="date"
                  value={startDate}
                />
                <InputField
                  label="Дата окончания"
                  name="endDate"
                  onChange={(event) => setEndDate(event.target.value)}
                  type="date"
                  value={endDate}
                />
                <InputField
                  label="Тип оборудования"
                  name="equipmentType"
                  onChange={(event) => setEquipmentType(event.target.value)}
                  value={equipmentType}
                />
                <InputField
                  label="Регион"
                  name="region"
                  onChange={(event) => setRegion(event.target.value)}
                  value={region}
                />
                <InputField
                  label="Предмет договора"
                  name="subject"
                  onChange={(event) => setSubjectOfAgreement(event.target.value)}
                  value={subjectOfAgreement}
                />
                <SelectField
                  label="Область действия заказчика"
                  name="scopeType"
                  onChange={(event) => {
                    const value = event.target.value as "organization" | "division" | "unit";
                    setScopeType(value);
                    setScopeId("");
                  }}
                  options={scopeTypeOptions}
                  value={scopeType}
                />
              </div>

              {scopeType !== "organization" ? (
                <SelectField
                  label="Точка привязки"
                  name="scopeId"
                  onChange={(event) => setScopeId(event.target.value)}
                  options={(scopeType === "division" ? session.divisions : session.units).map((option) => ({
                    label: option.name,
                    value: option.id,
                  }))}
                  placeholder="Выберите объект"
                  value={scopeId}
                />
              ) : null}

              <div className="flex flex-wrap gap-3">
                <Button
                  disabled={isPending || isScopeSelectionMissing}
                  leftIcon={<ClipboardCheck className="size-4" />}
                  loading={isPending}
                  onClick={() => {
                    startTransition(() => {
                      setError(null);
                      void handleCreate().catch((createError: Error) => setError(createError.message));
                    });
                  }}
                >
                  Сохранить договор
                </Button>
                <Badge tone="info">Раздел «Договоры»</Badge>
              </div>
            </Card>

            <Card className="gap-5" padding="lg">
              <div className="space-y-2">
                <Badge tone="violet">Проверка маршрутизации</Badge>
                <h2 className="text-xl font-semibold text-foreground">Проверить подходящий договор</h2>
                <p className="text-sm leading-6 text-muted-foreground">
                  Проверка показывает, какой подрядчик подходит под выбранный юнит, вид работ, тип оборудования и регион.
                </p>
              </div>

              <div className="grid gap-4">
                <SelectField
                  label="Юнит"
                  name="routingUnitId"
                  onChange={(event) => setRoutingUnitId(event.target.value)}
                  options={session.units.map((unit) => ({ label: unit.name, value: unit.id }))}
                  placeholder="Выберите юнит"
                  value={routingUnitId}
                />
                <SelectField
                  label="Вид работ"
                  name="routingWorkType"
                  onChange={(event) => setRoutingWorkType(event.target.value as WorkType)}
                  options={Object.entries(workTypeLabels).map(([value, label]) => ({ label, value }))}
                  value={routingWorkType}
                />
                <InputField
                  label="Тип оборудования"
                  name="routingEquipmentType"
                  onChange={(event) => setRoutingEquipmentType(event.target.value)}
                  value={routingEquipmentType}
                />
                <InputField
                  label="Регион"
                  name="routingRegion"
                  onChange={(event) => setRoutingRegion(event.target.value)}
                  value={routingRegion}
                />
                <Button
                  leftIcon={<Route className="size-4" />}
                  loading={isPending}
                  onClick={() => {
                    startTransition(() => {
                      setRoutingError(null);
                      void handleRoutingPreview().catch((previewError: Error) => {
                        setRoutingPreview(null);
                        setRoutingError(previewError.message);
                      });
                    });
                  }}
                  variant="secondary"
                >
                  Проверить договор
                </Button>
              </div>

              {routingError ? (
                <div
                  aria-live="polite"
                  className="rounded-[var(--radius-lg)] border border-destructive/20 bg-destructive-soft px-4 py-3 text-sm text-destructive"
                >
                  {routingError}
                </div>
              ) : null}

              {routingPreview ? (
                <div className="grid gap-3">
                  {routingPreview.matches.length ? (
                    routingPreview.matches.map((match) => (
                      <div className="rounded-[var(--radius-lg)] border border-border bg-card px-4 py-3" key={match.contract.id}>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="font-semibold text-foreground">{match.contract.contractNumber}</p>
                          <Badge tone="success">Подходит</Badge>
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground">
                          Подрядчик: {match.contractor.name}. Область: {match.contract.locationScope.label}.
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-[var(--radius-lg)] border border-dashed border-border px-4 py-4 text-sm text-muted-foreground">
                      Подходящие договоры не найдены: система не выбрала подрядчика без договорного основания.
                    </div>
                  )}
                </div>
              ) : null}
            </Card>
          </div>

          <Card className="gap-4" padding="lg">
            <div className="space-y-2">
              <Badge tone="info">Договоры заказчика</Badge>
              <h2 className="text-xl font-semibold text-foreground">Реестр договоров</h2>
              <p className="text-sm leading-6 text-muted-foreground">
                Список договоров заказчика с привязкой подрядчика и статусом маршрута.
              </p>
            </div>

            {contracts.length ? (
              <div className="grid gap-3">
                {contracts.map((contract) => (
                  <Card className="gap-4" key={contract.id} padding="md">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-1">
                        <p className="font-semibold text-foreground">{contract.contractNumber}</p>
                        <p className="text-sm text-muted-foreground">{contract.contractorOrganizationName}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone={statusTones[contract.contractStatus]}>
                          {contractStatusLabels[contract.contractStatus]}
                        </Badge>
                        <Badge tone={contract.routingEligible ? "success" : "warning"}>
                          {contract.routingEligible ? "Подходит" : "Не подходит"}
                        </Badge>
                      </div>
                    </div>

                    <div className="grid gap-3 text-sm text-muted-foreground md:grid-cols-3">
                      <div>
                        Период: {formatContractDate(contract.startDate)} → {formatContractDate(contract.endDate)}
                      </div>
                      <div>Вид работ: {workTypeLabels[contract.workType]}</div>
                      <div>Тип оборудования: {contract.equipmentType}</div>
                      <div>Регион: {contract.region}</div>
                      <div>Область: {contract.locationScope.label}</div>
                      <div>Уровень: {formatScopeType(contract.locationScope.scopeType)}</div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {contract.contractStatus !== "active" ? (
                        <Button
                          loading={isPending}
                          onClick={() => {
                            startTransition(() => {
                              setError(null);
                              void updateContractStatus(contract.id, "active").catch((updateError: Error) =>
                                setError(updateError.message),
                              );
                            });
                          }}
                          size="sm"
                          variant="secondary"
                        >
                          Активировать
                        </Button>
                      ) : null}
                      {contract.contractStatus === "active" ? (
                        <Button
                          loading={isPending}
                          onClick={() => {
                            startTransition(() => {
                              setError(null);
                              void updateContractStatus(contract.id, "inactive").catch((updateError: Error) =>
                                setError(updateError.message),
                              );
                            });
                          }}
                          size="sm"
                          variant="secondary"
                        >
                          Деактивировать
                        </Button>
                      ) : null}
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="rounded-[var(--radius-lg)] border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
                Договоров пока нет. Создайте первый договор и привяжите подрядчика.
              </div>
            )}
          </Card>
        </>
      ) : null}

      <Card className="gap-4" padding="md" tone="muted">
        <div className="flex items-start gap-3">
          <div className="flex size-10 items-center justify-center rounded-[var(--radius-lg)] bg-accent-soft text-accent-strong">
            {isCustomerContour ? (
              <Building2 aria-hidden="true" className="size-4" />
            ) : (
              <UserRoundCheck aria-hidden="true" className="size-4" />
            )}
          </div>
          <div className="space-y-1 text-sm leading-6 text-muted-foreground">
            <p className="font-medium text-foreground">Исполнитель заявки</p>
            <p>
              Активный договор определяет, какой подрядчик подходит под выбранные условия.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
