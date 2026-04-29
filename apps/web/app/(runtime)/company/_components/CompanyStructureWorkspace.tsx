"use client";

import { useMemo, useState, useTransition } from "react";
import { Archive, Building2, GitBranch, MapPinned, Plus, Save, UsersRound } from "lucide-react";
import { EmployeeAccessWorkspace } from "@/features/Stage03Access";
import {
  parseApiResponse,
  sessionHasCapability,
  type CompanyProfilePayload,
  type SessionSummaryResponse,
  type StructureNodePayload,
} from "@/shared/api";
import { Badge, Button, Card, InlineAlert, InputField, SelectField, Tabs, TextareaField, useToast } from "@/shared/ui";

type Props = {
  initialSession: SessionSummaryResponse;
};

type TabKey = "profile" | "divisions" | "units" | "employees";

type Division = SessionSummaryResponse["divisions"][number];
type Unit = SessionSummaryResponse["units"][number];

type StructureForm = {
  type: string;
  name: string;
  code: string;
  region: string;
  address: string;
  leaderFullName: string;
  leaderPosition: string;
  contractPhone: string;
  contractEmail: string;
  actingBasis: string;
  comment: string;
  divisionId: string;
};

const organizationPropertyTypeOptions = [
  { label: "ООО", value: "ООО" },
  { label: "АО", value: "АО" },
  { label: "ПАО", value: "ПАО" },
] as const;

const unitTypeOptions = [
  { label: "ВРД", value: "ВРД" },
  { label: "ВРЗ", value: "ВРЗ" },
  { label: "ВУ", value: "ВУ" },
  { label: "ВРП", value: "ВРП" },
] as const;

const tabItems = [
  { key: "profile", label: "Профиль", icon: Building2 },
  { key: "divisions", label: "Подразделения", icon: GitBranch },
  { key: "units", label: "Юниты", icon: MapPinned },
  { key: "employees", label: "Сотрудники", icon: UsersRound },
] as const;

const directOrganizationParent = "__organization__";

function emptyStructureForm(parentDivisionId = directOrganizationParent): StructureForm {
  return {
    type: "ВРД",
    name: "",
    code: "",
    region: "",
    address: "",
    leaderFullName: "",
    leaderPosition: "",
    contractPhone: "",
    contractEmail: "",
    actingBasis: "",
    comment: "",
    divisionId: parentDivisionId,
  };
}

function profileFromSession(session: SessionSummaryResponse): CompanyProfilePayload {
  return {
    propertyType: normalizeOrganizationPropertyType(session.organization.propertyType ?? session.organization.type),
    name: session.organization.name,
    shortName: session.organization.shortName ?? "",
    inn: session.organization.inn ?? "",
    kpp: session.organization.kpp ?? "",
    registeredAddress:
      session.organization.registeredAddress ?? session.organization.legalAddress ?? session.organization.address ?? "",
    leaderFullName: session.organization.leaderFullName ?? session.organization.managerName ?? "",
    leaderPosition: session.organization.leaderPosition ?? "",
    contractPhone: session.organization.contractPhone ?? session.organization.contactPhone ?? "",
    contractEmail: session.organization.contractEmail ?? session.organization.contactEmail ?? "",
    actingBasis: session.organization.actingBasis ?? "",
  };
}

function formFromDivision(item: Division): StructureForm {
  return {
    ...emptyStructureForm(),
    type: item.type,
    name: item.name,
    code: item.code ?? "",
    region: item.region ?? "",
    address: item.registeredAddress ?? item.address ?? "",
    leaderFullName: item.leaderFullName ?? item.managerName ?? "",
    leaderPosition: item.leaderPosition ?? "",
    contractPhone: item.contractPhone ?? "",
    contractEmail: item.contractEmail ?? "",
    actingBasis: item.actingBasis ?? "",
    comment: item.comment ?? "",
  };
}

function formFromUnit(item: Unit): StructureForm {
  return {
    ...emptyStructureForm(item.divisionId ?? directOrganizationParent),
    type: item.type,
    name: item.name,
    code: item.code ?? "",
    region: item.region ?? "",
    address: item.registeredAddress ?? item.address ?? "",
    leaderFullName: item.leaderFullName ?? item.managerName ?? "",
    leaderPosition: item.leaderPosition ?? "",
    contractPhone: item.contractPhone ?? "",
    contractEmail: item.contractEmail ?? "",
    actingBasis: item.actingBasis ?? "",
    comment: item.comment ?? "",
  };
}

function compactProfilePayload(value: CompanyProfilePayload): CompanyProfilePayload {
  return {
    propertyType: value.propertyType,
    type: value.propertyType,
    name: value.name.trim(),
    shortName: value.shortName?.trim() || undefined,
    inn: value.inn?.trim() || undefined,
    kpp: value.kpp?.trim() || undefined,
    registeredAddress: value.registeredAddress?.trim() || undefined,
    leaderFullName: value.leaderFullName?.trim() || undefined,
    leaderPosition: value.leaderPosition?.trim() || undefined,
    contractPhone: value.contractPhone?.trim() || undefined,
    contractEmail: value.contractEmail?.trim() || undefined,
    actingBasis: value.actingBasis?.trim() || undefined,
  };
}

function compactStructurePayload(value: StructureForm, includeDivision: boolean, includeType: boolean): StructureNodePayload {
  return {
    ...(includeType ? { type: value.type } : {}),
    name: value.name.trim(),
    code: value.code.trim() || undefined,
    region: value.region.trim() || undefined,
    address: value.address.trim() || undefined,
    registeredAddress: value.address.trim() || undefined,
    leaderFullName: value.leaderFullName.trim() || undefined,
    managerName: value.leaderFullName.trim() || undefined,
    leaderPosition: value.leaderPosition.trim() || undefined,
    contractPhone: value.contractPhone.trim() || undefined,
    contractEmail: value.contractEmail.trim() || undefined,
    actingBasis: value.actingBasis.trim() || undefined,
    comment: value.comment.trim() || undefined,
    divisionId:
      includeDivision && value.divisionId && value.divisionId !== directOrganizationParent
        ? value.divisionId
        : undefined,
  };
}

function formatNodeMeta(item: Division | Unit) {
  const parts = [item.code, item.region, item.contractEmail].filter(Boolean);
  return parts.length ? parts.join(" / ") : "Дополнительные поля не заполнены";
}

function normalizeOrganizationPropertyType(value?: string) {
  switch ((value ?? "").trim().toUpperCase()) {
    case "ОАО":
      return "ПАО";
    case "ЗАО":
      return "АО";
    case "LLC":
      return "ООО";
    case "АО":
    case "ПАО":
    case "ООО":
      return (value ?? "").trim().toUpperCase();
    default:
      return "ООО";
  }
}

function canManageCompany(session: SessionSummaryResponse) {
  return session.organization.roleTitle === "customer" && sessionHasCapability(session, "manage_structure");
}

export function CompanyStructureWorkspace({ initialSession }: Props) {
  const { showToast } = useToast();
  const [session, setSession] = useState(initialSession);
  const [activeTab, setActiveTab] = useState<TabKey>("profile");
  const [profile, setProfile] = useState<CompanyProfilePayload>(() => profileFromSession(initialSession));
  const [divisionForm, setDivisionForm] = useState<StructureForm>(() => emptyStructureForm());
  const [unitForm, setUnitForm] = useState<StructureForm>(() => emptyStructureForm());
  const [editingDivisionId, setEditingDivisionId] = useState<string | null>(null);
  const [editingUnitId, setEditingUnitId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const canManage = canManageCompany(session);
  const directUnits = session.units.filter((unit) => !unit.divisionId);
  const hasStructure = session.divisions.length > 0 || session.units.length > 0;
  const visibleTabItems = useMemo(
    () => tabItems.filter((item) => item.key !== "employees" || session.workspace.canViewEmployees),
    [session.workspace.canViewEmployees],
  );
  const divisionOptions = useMemo(
    () => [
      { label: "Напрямую под организацией", value: directOrganizationParent },
      ...session.divisions.map((item) => ({ label: item.name, value: item.id })),
    ],
    [session.divisions],
  );

  async function mutateSession(path: string, init: RequestInit, fallbackMessage: string) {
    const response = await fetch(path, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...init.headers,
      },
    });
    const nextSession = await parseApiResponse<SessionSummaryResponse>(response, fallbackMessage);
    setSession(nextSession);
    setProfile(profileFromSession(nextSession));
    return nextSession;
  }

  function submitProfile() {
    startTransition(() => {
      void mutateSession(
        "/api/company/profile",
        {
          method: "PATCH",
          body: JSON.stringify(compactProfilePayload(profile)),
        },
        "Не удалось сохранить профиль организации.",
      )
        .then(() =>
          showToast({
            dedupeKey: "company-profile-success",
            title: "Профиль организации сохранен.",
            tone: "success",
          }),
        )
        .catch((error) =>
          showToast({
            dedupeKey: "company-profile-error",
            description: error instanceof Error ? error.message : undefined,
            title: "Не удалось сохранить профиль.",
            tone: "error",
          }),
        );
    });
  }

  function submitDivision() {
    startTransition(() => {
      const path = editingDivisionId
        ? `/api/company/divisions/${editingDivisionId}`
        : "/api/company/divisions";
      void mutateSession(
        path,
        {
          method: editingDivisionId ? "PATCH" : "POST",
          body: JSON.stringify(compactStructurePayload(divisionForm, false, false)),
        },
        "Не удалось сохранить подразделение.",
      )
        .then(() => {
          setDivisionForm(emptyStructureForm());
          setEditingDivisionId(null);
          showToast({
            dedupeKey: "company-division-success",
            title: "Подразделение сохранено.",
            tone: "success",
          });
        })
        .catch((error) =>
          showToast({
            dedupeKey: "company-division-error",
            description: error instanceof Error ? error.message : undefined,
            title: "Не удалось сохранить подразделение.",
            tone: "error",
          }),
        );
    });
  }

  function submitUnit() {
    startTransition(() => {
      const path = editingUnitId ? `/api/company/units/${editingUnitId}` : "/api/company/units";
      void mutateSession(
        path,
        {
          method: editingUnitId ? "PATCH" : "POST",
          body: JSON.stringify(compactStructurePayload(unitForm, true, true)),
        },
        "Не удалось сохранить юнит.",
      )
        .then(() => {
          setUnitForm(emptyStructureForm());
          setEditingUnitId(null);
          showToast({
            dedupeKey: "company-unit-success",
            title: "Юнит сохранен.",
            tone: "success",
          });
        })
        .catch((error) =>
          showToast({
            dedupeKey: "company-unit-error",
            description: error instanceof Error ? error.message : undefined,
            title: "Не удалось сохранить юнит.",
            tone: "error",
          }),
        );
    });
  }

  function archiveNode(path: string, label: string) {
    if (!window.confirm(`${label} будет скрыт из активной структуры. Продолжить архивирование?`)) {
      return;
    }

    startTransition(() => {
      void mutateSession(path, { method: "POST" }, `Не удалось архивировать ${label}.`)
        .then(() =>
          showToast({
            dedupeKey: `company-archive-success:${path}`,
            title: `${label} архивирован.`,
            tone: "success",
          }),
        )
        .catch((error) =>
          showToast({
            dedupeKey: `company-archive-error:${path}`,
            description: error instanceof Error ? error.message : undefined,
            title: `Не удалось архивировать ${label}.`,
            tone: "error",
          }),
        );
    });
  }

  return (
    <div className="grid gap-4">
      {!hasStructure && canManage ? (
        <InlineAlert
          description="Можно начать с прямого юнита или сначала добавить подразделение."
          title="Структура пока пустая"
          tone="info"
        />
      ) : null}

      {!canManage ? (
        <InlineAlert
          description="Вы видите только доступную область. Создание, редактирование и архивирование скрыты для этого уровня доступа."
          title="Режим просмотра"
          tone="warning"
        />
      ) : null}

      <Tabs<TabKey>
        activeKey={activeTab}
        ariaLabel="Разделы управления организацией"
        items={visibleTabItems}
        onChange={setActiveTab}
      />

      {activeTab === "profile" ? (
        <div className="grid gap-4 xl:grid-cols-[1fr_0.86fr]">
          <Card className="gap-5" padding="lg">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-2">
                <Badge tone="info">Профиль организации</Badge>
                <h2 className="text-xl font-semibold text-foreground">Реквизиты и ответственные</h2>
              </div>
              <Badge tone={session.organization.launchState === "active" ? "success" : "warning"}>
                {session.organization.launchState === "active" ? "Активна" : "Подготовка"}
              </Badge>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <SelectField
                autoComplete="off"
                disabled={!canManage}
                label="Тип"
                name="organizationType"
                onValueChange={(value) => setProfile((current) => ({ ...current, propertyType: value }))}
                options={organizationPropertyTypeOptions}
                value={profile.propertyType}
              />
              <InputField
                autoComplete="organization"
                disabled={!canManage}
                label="Наименование"
                name="organizationName"
                onChange={(event) => setProfile((current) => ({ ...current, name: event.target.value }))}
                value={profile.name}
              />
              <InputField
                autoComplete="off"
                disabled={!canManage}
                label="Краткое наименование"
                name="organizationShortName"
                onChange={(event) => setProfile((current) => ({ ...current, shortName: event.target.value }))}
                value={profile.shortName ?? ""}
              />
              <InputField
                autoComplete="off"
                disabled={!canManage}
                label="ИНН"
                name="organizationInn"
                onChange={(event) => setProfile((current) => ({ ...current, inn: event.target.value }))}
                spellCheck={false}
                value={profile.inn ?? ""}
              />
              <InputField
                autoComplete="off"
                disabled={!canManage}
                label="КПП"
                name="organizationKpp"
                onChange={(event) => setProfile((current) => ({ ...current, kpp: event.target.value }))}
                spellCheck={false}
                value={profile.kpp ?? ""}
              />
              <InputField
                autoComplete="tel"
                disabled={!canManage}
                label="Контактный телефон"
                name="organizationContractPhone"
                onChange={(event) => setProfile((current) => ({ ...current, contractPhone: event.target.value }))}
                type="tel"
                value={profile.contractPhone ?? ""}
              />
              <InputField
                autoComplete="email"
                disabled={!canManage}
                label="Контактный email"
                name="organizationContractEmail"
                onChange={(event) => setProfile((current) => ({ ...current, contractEmail: event.target.value }))}
                spellCheck={false}
                type="email"
                value={profile.contractEmail ?? ""}
              />
              <InputField
                autoComplete="name"
                disabled={!canManage}
                label="Руководитель"
                name="organizationLeaderFullName"
                onChange={(event) => setProfile((current) => ({ ...current, leaderFullName: event.target.value }))}
                value={profile.leaderFullName ?? ""}
              />
              <InputField
                autoComplete="organization-title"
                disabled={!canManage}
                label="Должность руководителя"
                name="organizationLeaderPosition"
                onChange={(event) => setProfile((current) => ({ ...current, leaderPosition: event.target.value }))}
                value={profile.leaderPosition ?? ""}
              />
              <InputField
                autoComplete="off"
                disabled={!canManage}
                label="Основание полномочий"
                name="organizationActingBasis"
                onChange={(event) => setProfile((current) => ({ ...current, actingBasis: event.target.value }))}
                value={profile.actingBasis ?? ""}
              />
            </div>

            <TextareaField
              autoComplete="street-address"
              disabled={!canManage}
              label="Юридический адрес"
              name="organizationRegisteredAddress"
              onChange={(event) => setProfile((current) => ({ ...current, registeredAddress: event.target.value }))}
              value={profile.registeredAddress ?? ""}
            />

            {canManage ? (
              <Button leftIcon={<Save className="size-4" />} loading={isPending} onClick={submitProfile}>
                Сохранить профиль
              </Button>
            ) : null}
          </Card>

          <Card className="gap-4" data-testid="scope-graph" padding="lg">
            <div className="space-y-2">
              <Badge tone="interactive">Текущий доступ</Badge>
              <h2 className="text-lg font-semibold text-foreground">{session.workspace.scopeName}</h2>
              <p className="text-sm leading-6 text-muted-foreground">{session.workspace.landingSubtitle}</p>
            </div>
            <div className="grid gap-3 text-sm">
              <div className="rounded-[var(--radius-lg)] border border-border bg-muted/50 px-4 py-3">
                <div className="text-muted-foreground">Пользователь</div>
                <div className="mt-1 font-semibold text-foreground">{session.account.fullName}</div>
                <div className="text-muted-foreground">{session.account.email}</div>
              </div>
              <div className="rounded-[var(--radius-lg)] border border-border bg-muted/50 px-4 py-3">
                <div className="text-muted-foreground">Область</div>
                <div className="mt-1 font-semibold text-foreground">{session.workspace.scopeType}</div>
              </div>
            </div>
          </Card>
        </div>
      ) : null}

      {activeTab === "divisions" ? (
        <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
          {canManage ? (
            <StructureFormCard
              form={divisionForm}
              isEditing={Boolean(editingDivisionId)}
              isPending={isPending}
              onCancel={() => {
                setDivisionForm(emptyStructureForm());
                setEditingDivisionId(null);
              }}
              onChange={setDivisionForm}
              onSubmit={submitDivision}
              namePrefix="division"
              submitLabel={editingDivisionId ? "Сохранить подразделение" : "Создать подразделение"}
              showType={false}
              title={editingDivisionId ? "Редактировать подразделение" : "Новое подразделение"}
            />
          ) : null}

          <Card className="gap-4" data-testid="scope-graph" padding="lg">
            <div className="space-y-2">
              <Badge tone="interactive">Подразделения</Badge>
              <h2 className="text-lg font-semibold text-foreground">Активные подразделения</h2>
            </div>
            {session.divisions.length ? (
              <div className="grid gap-3">
                {session.divisions.map((division) => (
                  <NodeRow
                    canManage={canManage}
                    key={division.id}
                    meta={formatNodeMeta(division)}
                    name={division.name}
                    onArchive={() =>
                      archiveNode(`/api/company/divisions/${division.id}/archive`, "Подразделение")
                    }
                    onEdit={() => {
                      setActiveTab("divisions");
                      setEditingDivisionId(division.id);
                      setDivisionForm(formFromDivision(division));
                    }}
                  />
                ))}
              </div>
            ) : (
              <EmptyBlock text="В текущей области нет активных подразделений." />
            )}
          </Card>
        </div>
      ) : null}

      {activeTab === "units" ? (
        <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
          {canManage ? (
            <StructureFormCard
              form={unitForm}
              includeDivision
              isEditing={Boolean(editingUnitId)}
              isPending={isPending}
              onCancel={() => {
                setUnitForm(emptyStructureForm());
                setEditingUnitId(null);
              }}
              onChange={setUnitForm}
              onSubmit={submitUnit}
              namePrefix="unit"
              divisionOptions={divisionOptions}
              submitLabel={editingUnitId ? "Сохранить юнит" : "Создать юнит"}
              title={editingUnitId ? "Редактировать юнит" : "Новый юнит"}
            />
          ) : null}

          <Card className="gap-4" data-testid="scope-graph" padding="lg">
            <div className="space-y-2">
              <Badge tone="interactive">Юниты</Badge>
              <h2 className="text-lg font-semibold text-foreground">Активные юниты</h2>
            </div>
            <div className="grid gap-4">
              {session.divisions.map((division) => {
                const childUnits = session.units.filter((unit) => unit.divisionId === division.id);
                return (
                  <div className="grid gap-3" key={division.id}>
                    <div className="text-sm font-semibold text-foreground">{division.name}</div>
                    {childUnits.length ? (
                      childUnits.map((unit) => (
                        <NodeRow
                          canManage={canManage}
                          key={unit.id}
                          meta={formatNodeMeta(unit)}
                          name={unit.name}
                          onArchive={() => archiveNode(`/api/company/units/${unit.id}/archive`, "Юнит")}
                          onEdit={() => {
                            setActiveTab("units");
                            setEditingUnitId(unit.id);
                            setUnitForm(formFromUnit(unit));
                          }}
                          type={unit.type}
                        />
                      ))
                    ) : (
                      <EmptyBlock text="В подразделении нет активных юнитов." />
                    )}
                  </div>
                );
              })}

              <div className="grid gap-3">
                <div className="text-sm font-semibold text-foreground">Прямое подчинение организации</div>
                {directUnits.length ? (
                  directUnits.map((unit) => (
                    <NodeRow
                      canManage={canManage}
                      key={unit.id}
                      meta={formatNodeMeta(unit)}
                      name={unit.name}
                      onArchive={() => archiveNode(`/api/company/units/${unit.id}/archive`, "Юнит")}
                      onEdit={() => {
                        setActiveTab("units");
                        setEditingUnitId(unit.id);
                        setUnitForm(formFromUnit(unit));
                      }}
                      type={unit.type}
                    />
                  ))
                ) : (
                  <EmptyBlock text="Прямых юнитов пока нет." />
                )}
              </div>
            </div>
          </Card>
        </div>
      ) : null}

      {activeTab === "employees" && session.workspace.canViewEmployees ? <EmployeeAccessWorkspace session={session} /> : null}
    </div>
  );
}

type StructureFormCardProps = {
  form: StructureForm;
  includeDivision?: boolean;
  isEditing: boolean;
  isPending: boolean;
  onCancel: () => void;
  onChange: (value: StructureForm) => void;
  onSubmit: () => void;
  namePrefix: string;
  divisionOptions?: Array<{ label: string; value: string }>;
  submitLabel: string;
  showType?: boolean;
  title: string;
};

function StructureFormCard({
  form,
  includeDivision = false,
  isEditing,
  isPending,
  onCancel,
  onChange,
  onSubmit,
  namePrefix,
  divisionOptions = [],
  submitLabel,
  showType = true,
  title,
}: StructureFormCardProps) {
  const update = (patch: Partial<StructureForm>) => onChange({ ...form, ...patch });

  return (
    <Card className="gap-5" padding="lg">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-2">
          <Badge tone="info">{isEditing ? "Редактирование" : "Создание"}</Badge>
          <h2 className="text-xl font-semibold text-foreground">{title}</h2>
        </div>
        {isEditing ? (
          <Button onClick={onCancel} type="button" variant="ghost">
            Отменить
          </Button>
        ) : null}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {showType ? (
          <SelectField
            autoComplete="off"
            label="Тип"
            name={`${namePrefix}Type`}
            onValueChange={(value) => update({ type: value })}
            options={unitTypeOptions}
            value={form.type}
          />
        ) : null}
        <InputField
          autoComplete="organization"
          label="Наименование"
          name={`${namePrefix}Name`}
          onChange={(event) => update({ name: event.target.value })}
          value={form.name}
        />
        <InputField
          autoComplete="off"
          label="Код"
          name={`${namePrefix}Code`}
          onChange={(event) => update({ code: event.target.value })}
          spellCheck={false}
          value={form.code}
        />
        <InputField
          autoComplete="address-level1"
          label="Регион"
          name={`${namePrefix}Region`}
          onChange={(event) => update({ region: event.target.value })}
          value={form.region}
        />
        <InputField
          autoComplete="name"
          label="Руководитель"
          name={`${namePrefix}LeaderFullName`}
          onChange={(event) => update({ leaderFullName: event.target.value })}
          value={form.leaderFullName}
        />
        <InputField
          autoComplete="organization-title"
          label="Должность"
          name={`${namePrefix}LeaderPosition`}
          onChange={(event) => update({ leaderPosition: event.target.value })}
          value={form.leaderPosition}
        />
        <InputField
          autoComplete="tel"
          label="Телефон"
          name={`${namePrefix}ContractPhone`}
          onChange={(event) => update({ contractPhone: event.target.value })}
          type="tel"
          value={form.contractPhone}
        />
        <InputField
          autoComplete="email"
          label="Email"
          name={`${namePrefix}ContractEmail`}
          onChange={(event) => update({ contractEmail: event.target.value })}
          spellCheck={false}
          type="email"
          value={form.contractEmail}
        />
        {includeDivision ? (
          <SelectField
            autoComplete="off"
            label="Родитель"
            name={`${namePrefix}Parent`}
            onValueChange={(value) => update({ divisionId: value })}
            options={divisionOptions}
            value={form.divisionId}
          />
        ) : null}
        <InputField
          autoComplete="off"
          label="Основание"
          name={`${namePrefix}ActingBasis`}
          onChange={(event) => update({ actingBasis: event.target.value })}
          value={form.actingBasis}
        />
      </div>

      <TextareaField
        autoComplete="street-address"
        label="Адрес"
        name={`${namePrefix}Address`}
        onChange={(event) => update({ address: event.target.value })}
        value={form.address}
      />
      <TextareaField
        autoComplete="off"
        label="Комментарий"
        name={`${namePrefix}Comment`}
        onChange={(event) => update({ comment: event.target.value })}
        value={form.comment}
      />

      <Button leftIcon={<Plus className="size-4" />} loading={isPending} onClick={onSubmit}>
        {submitLabel}
      </Button>
    </Card>
  );
}

type NodeRowProps = {
  canManage: boolean;
  meta: string;
  name: string;
  onArchive: () => void;
  onEdit: () => void;
  type?: string;
};

function NodeRow({ canManage, meta, name, onArchive, onEdit, type }: NodeRowProps) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-card px-4 py-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-foreground">{name}</p>
            {type ? (
              <Badge size="sm" tone="neutral">
                {type}
              </Badge>
            ) : null}
          </div>
          <p className="text-sm leading-6 text-muted-foreground">{meta}</p>
        </div>
        {canManage ? (
          <div className="flex flex-wrap gap-2">
            <Button onClick={onEdit} size="sm" type="button" variant="secondary">
              Редактировать
            </Button>
            <Button leftIcon={<Archive className="size-4" />} onClick={onArchive} size="sm" type="button" variant="ghost">
              Архивировать
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function EmptyBlock({ text }: { text: string }) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-dashed border-border px-4 py-5 text-sm text-muted-foreground">
      {text}
    </div>
  );
}
