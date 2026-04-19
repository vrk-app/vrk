"use client";

import { useState, useTransition } from "react";
import { Building2, ClipboardCheck, Route, ShieldAlert, UserRoundCheck } from "lucide-react";
import { Badge, Button, Card, InputField } from "@/shared/ui";
import type {
  ApiEnvelope,
  ContractRecord,
  ContractStatus,
  ContractorOption,
  RoutingResolveResult,
  SessionSummaryResponse,
  WorkType,
} from "@/shared/api";

const selectClassName =
  "h-10 w-full rounded-[var(--radius-md)] border border-input bg-card px-3.5 text-sm text-foreground shadow-xs transition-colors duration-150 hover:border-border-strong focus-visible:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/15";

const workTypeLabels: Record<WorkType, string> = {
  repair: "Ремонт",
  maintenance: "ТО",
  verification: "Поверка",
};

const statusTones: Record<ContractStatus, "neutral" | "success" | "warning"> = {
  inactive: "neutral",
  active: "success",
  expired: "warning",
};

const contractDateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeZone: "UTC",
});

type Props = {
  session: SessionSummaryResponse;
  initialContracts: ContractRecord[];
  contractorOptions: ContractorOption[];
};

function resolveScopeLabel(session: SessionSummaryResponse, scopeType: "organization" | "subdivision" | "unit", scopeId: string) {
  if (scopeType === "organization") {
    return session.organization.name;
  }
  if (scopeType === "subdivision") {
    return session.subdivisions.find((item) => item.id === scopeId)?.name ?? session.organization.name;
  }
  return session.units.find((item) => item.id === scopeId)?.name ?? session.organization.name;
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
  const canManageContracts =
    isCustomerContour &&
    session.grant?.roleTemplate === "organization_admin" &&
    session.workspace.scopeType === "organization";
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
  const [scopeType, setScopeType] = useState<"organization" | "subdivision" | "unit">("organization");
  const [scopeId, setScopeId] = useState("");
  const [routingUnitId, setRoutingUnitId] = useState(session.units[0]?.id ?? "");
  const [routingWorkType, setRoutingWorkType] = useState<WorkType>("repair");
  const [routingEquipmentType, setRoutingEquipmentType] = useState("");
  const [routingRegion, setRoutingRegion] = useState("");

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
      ...(scopeType === "subdivision" ? { subdivisionId: scopeId } : {}),
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
            <Badge tone="info">Contractor contour</Badge>
            <h2 className="text-xl font-semibold text-foreground">Доступные договорные контуры</h2>
            <p className="text-sm leading-6 text-muted-foreground">
              После входа подрядчик видит только customer contracts, привязанные к своей contractor organization,
              без раскрытия customer org graph.
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
                    <Badge tone={statusTones[contract.contractStatus]}>{contract.contractStatus}</Badge>
                  </div>
                  <div className="grid gap-3 text-sm text-muted-foreground md:grid-cols-2">
                    <div>Вид работ: {workTypeLabels[contract.workType]}</div>
                    <div>Тип оборудования: {contract.equipmentType}</div>
                    <div>Регион: {contract.region}</div>
                    <div>Scope: {contract.locationScope.label}</div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="rounded-[var(--radius-lg)] border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
              Для contractor organization пока нет customer contracts. После привязки customer admin здесь появится
              только релевантный рабочий контур.
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
                В этом slice управлять contracts registry может только customer organization admin на уровне
                `organization`.
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
                <Badge tone="interactive">Customer registry</Badge>
                <h2 className="text-xl font-semibold text-foreground">Создать договор и привязать подрядчика</h2>
                <p className="text-sm leading-6 text-muted-foreground">
                  Форма фиксирует минимальный Stage 03 contract context для будущей request routing baseline:
                  contractor, scope, dates, work type, equipment type и region.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <InputField
                  label="Номер договора"
                  name="contractNumber"
                  onChange={(event) => setContractNumber(event.target.value)}
                  value={contractNumber}
                />
                <label className="flex flex-col gap-2.5">
                  <span className="text-sm font-medium text-foreground">Подрядчик</span>
                  <select
                    className={selectClassName}
                    name="contractorOrganizationId"
                    onChange={(event) => setContractorOrganizationId(event.target.value)}
                    value={contractorOrganizationId}
                  >
                    <option value="">Выберите contractor organization</option>
                    {contractorOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.shortName ? `${option.name} (${option.shortName})` : option.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-2.5">
                  <span className="text-sm font-medium text-foreground">Статус</span>
                  <select
                    className={selectClassName}
                    name="contractStatus"
                    onChange={(event) => setContractStatus(event.target.value as ContractStatus)}
                    value={contractStatus}
                  >
                    <option value="inactive">inactive</option>
                    <option value="active">active</option>
                    <option value="expired">expired</option>
                  </select>
                </label>
                <label className="flex flex-col gap-2.5">
                  <span className="text-sm font-medium text-foreground">Вид работ</span>
                  <select
                    className={selectClassName}
                    name="workType"
                    onChange={(event) => setWorkType(event.target.value as WorkType)}
                    value={workType}
                  >
                    {Object.entries(workTypeLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
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
                <label className="flex flex-col gap-2.5">
                  <span className="text-sm font-medium text-foreground">Scope уровня заказчика</span>
                  <select
                    className={selectClassName}
                    name="scopeType"
                    onChange={(event) => {
                      const value = event.target.value as "organization" | "subdivision" | "unit";
                      setScopeType(value);
                      setScopeId("");
                    }}
                    value={scopeType}
                  >
                    <option value="organization">Вся организация</option>
                    <option value="subdivision">Подразделение</option>
                    <option value="unit">Юнит</option>
                  </select>
                </label>
              </div>

              {scopeType !== "organization" ? (
                <label className="flex flex-col gap-2.5">
                  <span className="text-sm font-medium text-foreground">Точка привязки</span>
                  <select
                    className={selectClassName}
                    name="scopeId"
                    onChange={(event) => setScopeId(event.target.value)}
                    value={scopeId}
                  >
                    <option value="">Выберите scope</option>
                    {(scopeType === "subdivision" ? session.subdivisions : session.units).map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.name}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}

              <div className="flex flex-wrap gap-3">
                <Button
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
                <Badge tone="info">/contracts public contour</Badge>
              </div>
            </Card>

            <Card className="gap-5" padding="lg">
              <div className="space-y-2">
                <Badge tone="violet">Routing baseline</Badge>
                <h2 className="text-xl font-semibold text-foreground">Preview будущей маршрутизации</h2>
                <p className="text-sm leading-6 text-muted-foreground">
                  Этот preview доказывает, что contractor определяется из eligible contract context, а не вручную.
                </p>
              </div>

              <div className="grid gap-4">
                <label className="flex flex-col gap-2.5">
                  <span className="text-sm font-medium text-foreground">Юнит</span>
                  <select
                    className={selectClassName}
                    name="routingUnitId"
                    onChange={(event) => setRoutingUnitId(event.target.value)}
                    value={routingUnitId}
                  >
                    <option value="">Выберите юнит</option>
                    {session.units.map((unit) => (
                      <option key={unit.id} value={unit.id}>
                        {unit.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-2.5">
                  <span className="text-sm font-medium text-foreground">Вид работ</span>
                  <select
                    className={selectClassName}
                    name="routingWorkType"
                    onChange={(event) => setRoutingWorkType(event.target.value as WorkType)}
                    value={routingWorkType}
                  >
                    {Object.entries(workTypeLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
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
                  Проверить eligibility
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
                          <Badge tone="success">eligible</Badge>
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground">
                          Подрядчик: {match.contractor.name}. Scope: {match.contract.locationScope.label}.
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-[var(--radius-lg)] border border-dashed border-border px-4 py-4 text-sm text-muted-foreground">
                      Eligible contracts не найдены: routing baseline корректно не выбрал contractor.
                    </div>
                  )}
                </div>
              ) : null}
            </Card>
          </div>

          <Card className="gap-4" padding="lg">
            <div className="space-y-2">
              <Badge tone="info">Customer contracts</Badge>
              <h2 className="text-xl font-semibold text-foreground">Реестр договоров</h2>
              <p className="text-sm leading-6 text-muted-foreground">
                Ниже отображается только customer-owned contracts registry. Contractor-side contour открывается отдельно
                после contractor login и не расширяет customer workspace.
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
                        <Badge tone={statusTones[contract.contractStatus]}>{contract.contractStatus}</Badge>
                        <Badge tone={contract.routingEligible ? "success" : "warning"}>
                          {contract.routingEligible ? "eligible" : "not eligible"}
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
                      <div>Scope: {contract.locationScope.label}</div>
                      <div>Контур: {contract.locationScope.scopeType}</div>
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
                          Перевести в inactive
                        </Button>
                      ) : null}
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="rounded-[var(--radius-lg)] border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
                Договоров пока нет. После создания здесь появится реестр с routing eligibility и contractor binding.
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
            <p className="font-medium text-foreground">Adapter boundary</p>
            <p>
              Публичный contour и login restore живут на `/contracts`, но data boundary остается адаптером к backend
              `/agreements`. Это slice-003 truth, а не Stage 04 request flow.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
