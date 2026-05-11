"use client";

import { useEffect, useMemo, useRef, useState, useTransition, type ChangeEvent } from "react";
import {
  Archive,
  Building2,
  GitBranch,
  Image as ImageIcon,
  MapPinned,
  Pencil,
  Save,
  Trash2,
  UploadCloud,
  UsersRound,
} from "lucide-react";
import { EmployeeAccessWorkspace } from "@/features/Stage03Access";
import {
  parseApiResponse,
  sessionHasCapability,
  type CompanyProfilePayload,
  type SessionSummaryResponse,
  type StructureNodePayload,
} from "@/shared/api";
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  Dialog,
  FormListScrollArea,
  FormListSplitLayout,
  InlineAlert,
  InputField,
  IslandCard,
  SelectField,
  Tabs,
  TextareaField,
  useToast,
} from "@/shared/ui";

type Props = {
  initialSession: SessionSummaryResponse;
};

type TabKey = "profile" | "divisions" | "units" | "employees";

type Division = SessionSummaryResponse["divisions"][number];
type Unit = SessionSummaryResponse["units"][number];

type StructureForm = {
  type: string;
  name: string;
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

type ProfileErrors = Partial<
  Record<"inn" | "kpp" | "ogrn" | "settlementAccount" | "correspondentAccount" | "bik", string>
>;

type StructureEditDialogState =
  | {
      kind: "division";
      recordId: string;
      recordLabel: string;
      form: StructureForm;
    }
  | {
      kind: "unit";
      recordId: string;
      recordLabel: string;
      form: StructureForm;
    };

type ArchiveConfirmation = {
  label: string;
  path: string;
};

const organizationPropertyTypeOptions = [
  { label: "ООО", value: "ООО" },
  { label: "ПАО", value: "ПАО" },
  { label: "НАО", value: "НАО" },
  { label: "ИП", value: "ИП" },
] as const;

const unitTypeOptions = [
  { label: "ВРД", value: "ВРД" },
  { label: "ВРЗ", value: "ВРЗ" },
  { label: "ВУ", value: "ВУ" },
  { label: "ВРП", value: "ВРП" },
] as const;

const tabItems = [
  { key: "profile", label: "Профиль", icon: Building2 },
  { key: "divisions", label: "Дивизионы", icon: GitBranch },
  { key: "units", label: "Юниты", icon: MapPinned },
  { key: "employees", label: "Сотрудники", icon: UsersRound },
] as const;

const directOrganizationParent = "__organization__";

function emptyStructureForm(parentDivisionId = directOrganizationParent): StructureForm {
  return {
    type: "ВРД",
    name: "",
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
    postalAddress: session.organization.postalAddress ?? "",
    registeredAddress:
      session.organization.registeredAddress ?? session.organization.legalAddress ?? session.organization.address ?? "",
    ogrn: session.organization.ogrn ?? "",
    settlementAccount: session.organization.settlementAccount ?? "",
    bankName: session.organization.bankName ?? "",
    correspondentAccount: session.organization.correspondentAccount ?? "",
    bik: session.organization.bik ?? "",
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
    kpp: value.propertyType === "ИП" ? undefined : value.kpp?.trim() || undefined,
    postalAddress: value.postalAddress?.trim() || undefined,
    registeredAddress: value.registeredAddress?.trim() || undefined,
    ogrn: value.ogrn?.trim() || undefined,
    settlementAccount: value.settlementAccount?.trim() || undefined,
    bankName: value.bankName?.trim() || undefined,
    correspondentAccount: value.correspondentAccount?.trim() || undefined,
    bik: value.bik?.trim() || undefined,
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
  const parts = [item.region, item.contractEmail].filter(Boolean);
  return parts.length ? parts.join(" / ") : "Дополнительные поля не заполнены";
}

function normalizeOrganizationPropertyType(value?: string) {
  switch ((value ?? "").trim().toUpperCase()) {
    case "ОАО":
      return "ПАО";
    case "ЗАО":
    case "АО":
      return "НАО";
    case "LLC":
      return "ООО";
    case "ИП":
    case "НАО":
    case "ПАО":
    case "ООО":
      return (value ?? "").trim().toUpperCase();
    default:
      return "ООО";
  }
}

function digitsOnly(value: string, maxLength: number) {
  return value.replace(/\D/g, "").slice(0, maxLength);
}

function digitLengthError(value: string | undefined, exactLength: number, label: string) {
  if (!value) {
    return undefined;
  }
  return value.length === exactLength ? undefined : `${label}: ${exactLength} цифр.`;
}

function validateProfile(profile: CompanyProfilePayload): ProfileErrors {
  const isIp = profile.propertyType === "ИП";
  return {
    inn: digitLengthError(profile.inn, isIp ? 12 : 10, "ИНН"),
    kpp: isIp ? undefined : digitLengthError(profile.kpp, 9, "КПП"),
    ogrn: digitLengthError(profile.ogrn, isIp ? 15 : 13, isIp ? "ОГРНИП" : "ОГРН"),
    settlementAccount: digitLengthError(profile.settlementAccount, 20, "Расчетный счет"),
    correspondentAccount: digitLengthError(profile.correspondentAccount, 20, "Корреспондентский счет"),
    bik: digitLengthError(profile.bik, 9, "БИК"),
  };
}

function hasProfileErrors(errors: ProfileErrors) {
  return Object.values(errors).some(Boolean);
}

function canManageCompany(session: SessionSummaryResponse) {
  return session.organization.roleTitle === "customer" && sessionHasCapability(session, "manage_structure");
}

function canManageOrganizationProfile(session: SessionSummaryResponse) {
  return (
    session.organization.roleTitle === "customer" &&
    session.grant?.roleTemplate === "organization_admin" &&
    session.workspace.scopeType === "organization"
  );
}

function isDivisionAdmin(session: SessionSummaryResponse) {
  return session.organization.roleTitle === "customer" && session.grant?.roleTemplate === "division_admin";
}

function isUnitAdmin(session: SessionSummaryResponse) {
  return session.organization.roleTitle === "customer" && session.grant?.roleTemplate === "unit_admin";
}

function isStructureFormReady(form: StructureForm, requiresType: boolean) {
  return Boolean(form.name.trim()) && (!requiresType || Boolean(form.type.trim()));
}

export function CompanyStructureWorkspace({ initialSession }: Props) {
  const { showToast } = useToast();
  const [session, setSession] = useState(initialSession);
  const [activeTab, setActiveTab] = useState<TabKey>("profile");
  const [profile, setProfile] = useState<CompanyProfilePayload>(() => profileFromSession(initialSession));
  const [divisionForm, setDivisionForm] = useState<StructureForm>(() => emptyStructureForm());
  const [unitForm, setUnitForm] = useState<StructureForm>(() => emptyStructureForm());
  const [structureEditDialog, setStructureEditDialog] = useState<StructureEditDialogState | null>(null);
  const [archiveConfirmation, setArchiveConfirmation] = useState<ArchiveConfirmation | null>(null);
  const [isPending, startTransition] = useTransition();
  const logoInputRef = useRef<HTMLInputElement | null>(null);

  const canManageProfile = canManageOrganizationProfile(session);
  const canCreateDivision = canManageProfile;
  const canManageDivisions = canManageProfile || isDivisionAdmin(session);
  const canCreateUnit = canManageProfile || isDivisionAdmin(session);
  const canManageUnits = canManageProfile || isDivisionAdmin(session) || isUnitAdmin(session);
  const canChangeUnitParent = canManageProfile || isDivisionAdmin(session);
  const hasAnyStructureAction =
    canManageProfile || canCreateDivision || canManageDivisions || canCreateUnit || canManageUnits;
  const directUnits = session.units.filter((unit) => !unit.divisionId);
  const hasStructure = session.divisions.length > 0 || session.units.length > 0;
  const profileErrors = useMemo(() => validateProfile(profile), [profile]);
  const isIp = profile.propertyType === "ИП";
  const visibleTabItems = useMemo(
    () => tabItems.filter((item) => item.key !== "employees" || session.workspace.canViewEmployees),
    [session.workspace.canViewEmployees],
  );
  const divisionOptions = useMemo(
    () => [
      ...(canManageProfile ? [{ label: "Напрямую под организацией", value: directOrganizationParent }] : []),
      ...session.divisions.map((item) => ({ label: item.name, value: item.id })),
    ],
    [canManageProfile, session.divisions],
  );

  useEffect(() => {
    if (!canCreateUnit || divisionOptions.some((item) => item.value === unitForm.divisionId)) {
      return;
    }
    setUnitForm((current) => ({
      ...current,
      divisionId: divisionOptions[0]?.value ?? directOrganizationParent,
    }));
  }, [canCreateUnit, divisionOptions, unitForm.divisionId]);

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

  function updateProfilePropertyType(value: string) {
    setProfile((current) => ({
      ...current,
      propertyType: value,
      kpp: value === "ИП" ? "" : current.kpp,
      ogrn: current.ogrn ? digitsOnly(current.ogrn, value === "ИП" ? 15 : 13) : current.ogrn,
      inn: current.inn ? digitsOnly(current.inn, value === "ИП" ? 12 : 10) : current.inn,
    }));
  }

  function submitProfile() {
    const errors = validateProfile(profile);
    if (hasProfileErrors(errors)) {
      showToast({
        dedupeKey: "company-profile-validation",
        title: "Проверьте цифровые реквизиты.",
        tone: "error",
      });
      return;
    }

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

  function uploadLogo(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }

    const formData = new FormData();
    formData.append("logo", file);

    startTransition(() => {
      void fetch("/api/company/logo", {
        method: "POST",
        body: formData,
      })
        .then((response) => parseApiResponse<SessionSummaryResponse>(response, "Не удалось загрузить логотип."))
        .then((nextSession) => {
          setSession(nextSession);
          setProfile(profileFromSession(nextSession));
          showToast({
            dedupeKey: "company-logo-success",
            title: "Логотип обновлен.",
            tone: "success",
          });
        })
        .catch((error) =>
          showToast({
            dedupeKey: "company-logo-error",
            description: error instanceof Error ? error.message : undefined,
            title: "Не удалось загрузить логотип.",
            tone: "error",
          }),
        );
    });
  }

  function deleteLogo() {
    startTransition(() => {
      void mutateSession("/api/company/logo", { method: "DELETE" }, "Не удалось удалить логотип.")
        .then(() =>
          showToast({
            dedupeKey: "company-logo-delete-success",
            title: "Логотип удален.",
            tone: "success",
          }),
        )
        .catch((error) =>
          showToast({
            dedupeKey: "company-logo-delete-error",
            description: error instanceof Error ? error.message : undefined,
            title: "Не удалось удалить логотип.",
            tone: "error",
          }),
        );
    });
  }

  function submitDivision() {
    startTransition(() => {
      void mutateSession(
        "/api/company/divisions",
        {
          method: "POST",
          body: JSON.stringify(compactStructurePayload(divisionForm, false, false)),
        },
        "Не удалось сохранить дивизион.",
      )
        .then(() => {
          setDivisionForm(emptyStructureForm());
          showToast({
            dedupeKey: "company-division-success",
            title: "Дивизион сохранен.",
            tone: "success",
          });
        })
        .catch((error) =>
          showToast({
            dedupeKey: "company-division-error",
            description: error instanceof Error ? error.message : undefined,
            title: "Не удалось сохранить дивизион.",
            tone: "error",
          }),
        );
    });
  }

  function submitUnit() {
    startTransition(() => {
      void mutateSession(
        "/api/company/units",
        {
          method: "POST",
          body: JSON.stringify(compactStructurePayload(unitForm, true, true)),
        },
        "Не удалось сохранить юнит.",
      )
        .then(() => {
          setUnitForm(emptyStructureForm());
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

  function openDivisionEditor(division: Division) {
    setActiveTab("divisions");
    setStructureEditDialog({
      kind: "division",
      recordId: division.id,
      recordLabel: division.name,
      form: formFromDivision(division),
    });
  }

  function openUnitEditor(unit: Unit) {
    setActiveTab("units");
    setStructureEditDialog({
      kind: "unit",
      recordId: unit.id,
      recordLabel: unit.name,
      form: formFromUnit(unit),
    });
  }

  function submitStructureEdit() {
    if (!structureEditDialog) {
      return;
    }

    const isUnit = structureEditDialog.kind === "unit";
    const path = isUnit
      ? `/api/company/units/${structureEditDialog.recordId}`
      : `/api/company/divisions/${structureEditDialog.recordId}`;

    startTransition(() => {
      void mutateSession(
        path,
        {
          method: "PATCH",
          body: JSON.stringify(compactStructurePayload(structureEditDialog.form, isUnit, isUnit)),
        },
        isUnit ? "Не удалось сохранить юнит." : "Не удалось сохранить дивизион.",
      )
        .then(() => {
          setStructureEditDialog(null);
          showToast({
            dedupeKey: isUnit ? "company-unit-success" : "company-division-success",
            title: isUnit ? "Юнит сохранен." : "Дивизион сохранен.",
            tone: "success",
          });
        })
        .catch((error) =>
          showToast({
            dedupeKey: isUnit ? "company-unit-error" : "company-division-error",
            description: error instanceof Error ? error.message : undefined,
            title: isUnit ? "Не удалось сохранить юнит." : "Не удалось сохранить дивизион.",
            tone: "error",
          }),
        );
    });
  }

  function archiveNode(path: string, label: string) {
    setArchiveConfirmation({ label, path });
  }

  function confirmArchiveNode() {
    if (!archiveConfirmation) {
      return;
    }

    const confirmation = archiveConfirmation;
    setArchiveConfirmation(null);
    startTransition(() => {
      void mutateSession(confirmation.path, { method: "POST" }, `Не удалось архивировать ${confirmation.label}.`)
        .then(() =>
          showToast({
            dedupeKey: `company-archive-success:${confirmation.path}`,
            title: `${confirmation.label} архивирован.`,
            tone: "success",
          }),
        )
        .catch((error) =>
          showToast({
            dedupeKey: `company-archive-error:${confirmation.path}`,
            description: error instanceof Error ? error.message : undefined,
            title: `Не удалось архивировать ${confirmation.label}.`,
            tone: "error",
          }),
        );
    });
  }

  const divisionList = (
    <div className={canCreateDivision ? "h-full min-h-0" : undefined} data-testid="scope-graph">
      <IslandCard
        bodyClassName={canCreateDivision ? "min-h-0 flex-1" : undefined}
        className={canCreateDivision ? "h-full min-h-0 overflow-hidden" : undefined}
        headingLevel={2}
        icon={<Building2 aria-hidden="true" className="size-4" />}
        metric={session.divisions.length}
        title="Активные дивизионы"
      >
        {session.divisions.length ? (
          <FormListScrollArea className="grid gap-3">
            {session.divisions.map((division) => (
              <NodeRow
                canManage={canManageDivisions}
                editLabel={`Редактировать дивизион ${division.name}`}
                key={division.id}
                meta={formatNodeMeta(division)}
                name={division.name}
                onArchive={() => archiveNode(`/api/company/divisions/${division.id}/archive`, "Дивизион")}
                onEdit={() => openDivisionEditor(division)}
              />
            ))}
          </FormListScrollArea>
        ) : (
          <EmptyBlock text="В текущей области нет активных дивизионов." />
        )}
      </IslandCard>
    </div>
  );

  const unitList = (
    <div className={canCreateUnit ? "h-full min-h-0" : undefined} data-testid="scope-graph">
      <IslandCard
        bodyClassName={canCreateUnit ? "min-h-0 flex-1" : undefined}
        className={canCreateUnit ? "h-full min-h-0 overflow-hidden" : undefined}
        headingLevel={2}
        icon={<MapPinned aria-hidden="true" className="size-4" />}
        metric={session.units.length}
        title="Активные юниты"
      >
        <FormListScrollArea className="grid gap-4">
          {session.divisions.map((division) => {
            const childUnits = session.units.filter((unit) => unit.divisionId === division.id);
            return (
              <div className="grid gap-3" key={division.id}>
                <div className="text-sm font-semibold text-foreground">{division.name}</div>
                {childUnits.length ? (
                  childUnits.map((unit) => (
                    <NodeRow
                      canManage={canManageUnits}
                      editLabel={`Редактировать юнит ${unit.name}`}
                      key={unit.id}
                      meta={formatNodeMeta(unit)}
                      name={unit.name}
                      onArchive={() => archiveNode(`/api/company/units/${unit.id}/archive`, "Юнит")}
                      onEdit={() => openUnitEditor(unit)}
                      type={unit.type}
                    />
                  ))
                ) : (
                  <EmptyBlock text="В дивизионе нет активных юнитов." />
                )}
              </div>
            );
          })}

          <div className="grid gap-3">
            <div className="text-sm font-semibold text-foreground">Прямое подчинение организации</div>
            {directUnits.length ? (
              directUnits.map((unit) => (
                <NodeRow
                  canManage={canManageUnits}
                  editLabel={`Редактировать юнит ${unit.name}`}
                  key={unit.id}
                  meta={formatNodeMeta(unit)}
                  name={unit.name}
                  onArchive={() => archiveNode(`/api/company/units/${unit.id}/archive`, "Юнит")}
                  onEdit={() => openUnitEditor(unit)}
                  type={unit.type}
                />
              ))
            ) : (
              <EmptyBlock text="Прямых юнитов пока нет." />
            )}
          </div>
        </FormListScrollArea>
      </IslandCard>
    </div>
  );

  return (
    <>
      <StructureEditDialog
        canChangeUnitParent={canChangeUnitParent}
        dialog={structureEditDialog}
        divisionOptions={divisionOptions}
        isPending={isPending}
        onCancel={() => setStructureEditDialog(null)}
        onChange={setStructureEditDialog}
        onSubmit={submitStructureEdit}
      />
      <ConfirmDialog
        confirmLabel="Архивировать"
        description={
          archiveConfirmation
            ? `${archiveConfirmation.label} будет скрыт из активной структуры и останется доступен в истории.`
            : ""
        }
        icon={<Archive aria-hidden="true" className="size-5" />}
        loading={isPending}
        onCancel={() => setArchiveConfirmation(null)}
        onConfirm={confirmArchiveNode}
        open={Boolean(archiveConfirmation)}
        title="Архивировать запись?"
        tone="danger"
      />

      <div
        aria-hidden={structureEditDialog || archiveConfirmation ? true : undefined}
        className="grid gap-4"
        inert={structureEditDialog || archiveConfirmation ? true : undefined}
      >
        {!hasStructure && canManageCompany(session) ? (
          <InlineAlert
            description="Можно начать с прямого юнита или сначала добавить дивизион."
            title="Структура пока пустая"
            tone="info"
          />
        ) : null}

        {!hasAnyStructureAction ? (
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
          <div className="grid gap-4 xl:grid-cols-[1fr_0.58fr]">
            <IslandCard
              headingLevel={2}
              icon={<Building2 aria-hidden="true" className="size-4" />}
              title="Профиль организации"
            >
              <div className="grid gap-4 md:grid-cols-2">
                <SelectField
                  autoComplete="off"
                  disabled={!canManageProfile}
                  label="Тип"
                  name="organizationType"
                  onValueChange={updateProfilePropertyType}
                  options={organizationPropertyTypeOptions}
                  value={profile.propertyType}
                />
                <InputField
                  autoComplete="organization"
                  disabled={!canManageProfile}
                  label="Наименование"
                  name="organizationName"
                  onChange={(event) => setProfile((current) => ({ ...current, name: event.target.value }))}
                  value={profile.name}
                />
                <InputField
                  autoComplete="off"
                  disabled={!canManageProfile}
                  label="Краткое наименование"
                  name="organizationShortName"
                  onChange={(event) => setProfile((current) => ({ ...current, shortName: event.target.value }))}
                  value={profile.shortName ?? ""}
                />
                <InputField
                  autoComplete="off"
                  disabled={!canManageProfile}
                  error={profileErrors.inn}
                  hint={isIp ? "12 цифр для ИП." : "10 цифр для ООО, ПАО и НАО."}
                  label="ИНН"
                  name="organizationInn"
                  inputMode="numeric"
                  onChange={(event) =>
                    setProfile((current) => ({ ...current, inn: digitsOnly(event.target.value, isIp ? 12 : 10) }))
                  }
                  spellCheck={false}
                  value={profile.inn ?? ""}
                />
                <InputField
                  autoComplete="off"
                  disabled={!canManageProfile || isIp}
                  error={profileErrors.kpp}
                  hint={isIp ? "Для ИП КПП не применяется." : "9 цифр."}
                  label="КПП"
                  name="organizationKpp"
                  inputMode="numeric"
                  onChange={(event) => setProfile((current) => ({ ...current, kpp: digitsOnly(event.target.value, 9) }))}
                  spellCheck={false}
                  value={isIp ? "" : (profile.kpp ?? "")}
                />
                <InputField
                  autoComplete="off"
                  disabled={!canManageProfile}
                  error={profileErrors.ogrn}
                  hint={isIp ? "15 цифр." : "13 цифр."}
                  inputMode="numeric"
                  label={isIp ? "ОГРНИП" : "ОГРН"}
                  name="organizationOgrn"
                  onChange={(event) =>
                    setProfile((current) => ({ ...current, ogrn: digitsOnly(event.target.value, isIp ? 15 : 13) }))
                  }
                  spellCheck={false}
                  value={profile.ogrn ?? ""}
                />
                <InputField
                  autoComplete="tel"
                  disabled={!canManageProfile}
                  label="Контактный телефон"
                  name="organizationContractPhone"
                  onChange={(event) => setProfile((current) => ({ ...current, contractPhone: event.target.value }))}
                  type="tel"
                  value={profile.contractPhone ?? ""}
                />
                <InputField
                  autoComplete="email"
                  disabled={!canManageProfile}
                  label="Контактный email"
                  name="organizationContractEmail"
                  onChange={(event) => setProfile((current) => ({ ...current, contractEmail: event.target.value }))}
                  spellCheck={false}
                  type="email"
                  value={profile.contractEmail ?? ""}
                />
                <InputField
                  autoComplete="name"
                  disabled={!canManageProfile}
                  label="Руководитель"
                  name="organizationLeaderFullName"
                  onChange={(event) => setProfile((current) => ({ ...current, leaderFullName: event.target.value }))}
                  value={profile.leaderFullName ?? ""}
                />
                <InputField
                  autoComplete="organization-title"
                  disabled={!canManageProfile}
                  label="Должность руководителя"
                  name="organizationLeaderPosition"
                  onChange={(event) => setProfile((current) => ({ ...current, leaderPosition: event.target.value }))}
                  value={profile.leaderPosition ?? ""}
                />
                <InputField
                  autoComplete="off"
                  disabled={!canManageProfile}
                  label="Основание полномочий"
                  name="organizationActingBasis"
                  onChange={(event) => setProfile((current) => ({ ...current, actingBasis: event.target.value }))}
                  value={profile.actingBasis ?? ""}
                />
                <InputField
                  autoComplete="off"
                  disabled={!canManageProfile}
                  error={profileErrors.settlementAccount}
                  inputMode="numeric"
                  label="Расчетный счет"
                  name="organizationSettlementAccount"
                  onChange={(event) =>
                    setProfile((current) => ({ ...current, settlementAccount: digitsOnly(event.target.value, 20) }))
                  }
                  spellCheck={false}
                  value={profile.settlementAccount ?? ""}
                />
                <InputField
                  autoComplete="off"
                  disabled={!canManageProfile}
                  error={profileErrors.correspondentAccount}
                  inputMode="numeric"
                  label="Корреспондентский счет"
                  name="organizationCorrespondentAccount"
                  onChange={(event) =>
                    setProfile((current) => ({ ...current, correspondentAccount: digitsOnly(event.target.value, 20) }))
                  }
                  spellCheck={false}
                  value={profile.correspondentAccount ?? ""}
                />
                <InputField
                  autoComplete="off"
                  disabled={!canManageProfile}
                  error={profileErrors.bik}
                  inputMode="numeric"
                  label="БИК"
                  name="organizationBik"
                  onChange={(event) => setProfile((current) => ({ ...current, bik: digitsOnly(event.target.value, 9) }))}
                  spellCheck={false}
                  value={profile.bik ?? ""}
                />
                <InputField
                  autoComplete="off"
                  disabled={!canManageProfile}
                  label="Банк"
                  name="organizationBankName"
                  onChange={(event) => setProfile((current) => ({ ...current, bankName: event.target.value }))}
                  value={profile.bankName ?? ""}
                />
              </div>

              <TextareaField
                autoComplete="street-address"
                disabled={!canManageProfile}
                label="Юридический адрес"
                name="organizationRegisteredAddress"
                onChange={(event) => setProfile((current) => ({ ...current, registeredAddress: event.target.value }))}
                value={profile.registeredAddress ?? ""}
              />
              <TextareaField
                autoComplete="street-address"
                disabled={!canManageProfile}
                label="Почтовый адрес"
                name="organizationPostalAddress"
                onChange={(event) => setProfile((current) => ({ ...current, postalAddress: event.target.value }))}
                value={profile.postalAddress ?? ""}
              />

              <div className="flex flex-wrap items-center gap-4 rounded-[var(--radius-lg)] border border-border bg-muted/40 p-4">
                <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-[var(--radius-md)] border border-border bg-card">
                  {session.organization.logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      alt={`Логотип ${session.organization.name}`}
                      className="size-full object-contain"
                      height={64}
                      src={`${session.organization.logo.url}?v=${encodeURIComponent(session.organization.logo.updatedAt)}`}
                      width={64}
                    />
                  ) : (
                    <ImageIcon aria-hidden="true" className="size-6 text-muted-foreground" />
                  )}
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="break-words text-sm font-medium text-foreground">
                    {session.organization.logo?.fileName ?? "Логотип не загружен"}
                  </p>
                  <p className="break-words text-sm leading-6 text-muted-foreground">
                    PNG, JPEG, WebP или SVG. Файл хранится в приватном объектном хранилище.
                  </p>
                </div>
                {canManageProfile ? (
                  <div className="flex flex-wrap gap-2">
                    <input
                      ref={logoInputRef}
                      accept="image/png,image/jpeg,image/webp,image/svg+xml"
                      aria-label="Загрузить логотип организации"
                      className="sr-only"
                      onChange={uploadLogo}
                      type="file"
                    />
                    <Button
                      disabled={isPending}
                      leftIcon={<UploadCloud className="size-4" />}
                      onClick={() => logoInputRef.current?.click()}
                      type="button"
                      variant="secondary"
                    >
                      Загрузить
                    </Button>
                    {session.organization.logo ? (
                      <Button
                        disabled={isPending}
                        leftIcon={<Trash2 className="size-4" />}
                        onClick={deleteLogo}
                        type="button"
                        variant="ghost"
                      >
                        Удалить
                      </Button>
                    ) : null}
                  </div>
                ) : null}
              </div>

              {canManageProfile ? (
                <Button
                  disabled={!profile.name.trim() || hasProfileErrors(profileErrors)}
                  leftIcon={<Save className="size-4" />}
                  loading={isPending}
                  onClick={submitProfile}
                >
                  Сохранить профиль
                </Button>
              ) : null}
            </IslandCard>

            {session.workspace.scopeType !== "organization" ? (
              <Card className="gap-3 self-start" data-testid="scope-graph" padding="lg">
                <Badge tone="warning">Ограниченный доступ</Badge>
                <h2 className="break-words text-lg font-semibold text-foreground">{session.workspace.scopeName}</h2>
                <p className="break-words text-sm leading-6 text-muted-foreground">{session.organization.name}</p>
              </Card>
            ) : null}
          </div>
        ) : null}

        {activeTab === "divisions" ? (
          canCreateDivision ? (
            <FormListSplitLayout
              columnsClassName="xl:grid-cols-[0.9fr_1.1fr]"
              form={
                <StructureFormCard
                  form={divisionForm}
                  isPending={isPending}
                  onChange={setDivisionForm}
                  onSubmit={submitDivision}
                  namePrefix="division"
                  submitLabel="Создать дивизион"
                  showType={false}
                  title="Новый дивизион"
                />
              }
              list={divisionList}
            />
          ) : (
            divisionList
          )
        ) : null}

        {activeTab === "units" ? (
          canCreateUnit ? (
            <FormListSplitLayout
              columnsClassName="xl:grid-cols-[0.9fr_1.1fr]"
              form={
                <StructureFormCard
                  form={unitForm}
                  includeDivision
                  isPending={isPending}
                  onChange={setUnitForm}
                  onSubmit={submitUnit}
                  namePrefix="unit"
                  divisionOptions={divisionOptions}
                  submitLabel="Создать юнит"
                  title="Новый юнит"
                />
              }
              list={unitList}
            />
          ) : (
            unitList
          )
        ) : null}

        {activeTab === "employees" && session.workspace.canViewEmployees ? <EmployeeAccessWorkspace session={session} /> : null}
      </div>
    </>
  );
}

type StructureFormCardProps = {
  form: StructureForm;
  includeDivision?: boolean;
  isPending: boolean;
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
  isPending,
  onChange,
  onSubmit,
  namePrefix,
  divisionOptions = [],
  submitLabel,
  showType = true,
  title,
}: StructureFormCardProps) {
  const canSubmit =
    isStructureFormReady(form, showType) &&
    (!includeDivision || divisionOptions.some((item) => item.value === form.divisionId));

  return (
    <IslandCard
      icon={<Building2 aria-hidden="true" className="size-4" />}
      headingLevel={2}
      title={title}
    >
      <StructureFormFields
        divisionOptions={divisionOptions}
        form={form}
        includeDivision={includeDivision}
        namePrefix={namePrefix}
        onChange={onChange}
        showType={showType}
      />

      <Button
        disabled={!canSubmit || isPending}
        loading={isPending}
        onClick={onSubmit}
      >
        {submitLabel}
      </Button>
    </IslandCard>
  );
}

type StructureFormFieldsProps = {
  form: StructureForm;
  includeDivision?: boolean;
  onChange: (value: StructureForm) => void;
  namePrefix: string;
  divisionOptions?: Array<{ label: string; value: string }>;
  showDivisionSelector?: boolean;
  showType?: boolean;
};

function StructureFormFields({
  form,
  includeDivision = false,
  onChange,
  namePrefix,
  divisionOptions = [],
  showDivisionSelector = includeDivision,
  showType = true,
}: StructureFormFieldsProps) {
  const update = (patch: Partial<StructureForm>) => onChange({ ...form, ...patch });

  return (
    <>
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
        {includeDivision && showDivisionSelector ? (
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
    </>
  );
}

function StructureEditDialog({
  canChangeUnitParent,
  dialog,
  divisionOptions,
  isPending,
  onCancel,
  onChange,
  onSubmit,
}: {
  canChangeUnitParent: boolean;
  dialog: StructureEditDialogState | null;
  divisionOptions: Array<{ label: string; value: string }>;
  isPending: boolean;
  onCancel: () => void;
  onChange: (next: StructureEditDialogState) => void;
  onSubmit: () => void;
}) {
  if (!dialog) {
    return null;
  }

  const isUnit = dialog.kind === "unit";
  const title = isUnit ? "Редактировать юнит" : "Редактировать дивизион";
  const canSubmit = isStructureFormReady(dialog.form, isUnit);
  const update = (form: StructureForm) => onChange({ ...dialog, form });

  return (
    <Dialog
      badge={
        <Badge icon={<Pencil className="size-4" />} tone="interactive">
          Редактирование
        </Badge>
      }
      bodyClassName="grid gap-5"
      description={dialog.recordLabel}
      dismissible={!isPending}
      footer={
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            {!canSubmit
              ? "Заполните обязательные поля перед сохранением."
              : "Изменения попадут в текущую структуру после сохранения."}
          </p>
          <div className="flex flex-wrap gap-3">
            <Button disabled={isPending} onClick={onCancel} type="button" variant="secondary">
              Отмена
            </Button>
            <Button
              disabled={!canSubmit}
              leftIcon={<Save className="size-4" />}
              loading={isPending}
              onClick={onSubmit}
              type="button"
            >
              Сохранить изменения
            </Button>
          </div>
        </div>
      }
      onOpenChange={(open) => {
        if (!open && !isPending) {
          onCancel();
        }
      }}
      headerIcon={
        isUnit ? (
          <MapPinned aria-hidden="true" className="size-4" />
        ) : (
          <Building2 aria-hidden="true" className="size-4" />
        )
      }
      headerVariant="muted"
      open={Boolean(dialog)}
      showClose={!isPending}
      size="lg"
      title={title}
    >
      <StructureFormFields
        divisionOptions={divisionOptions}
        form={dialog.form}
        includeDivision={isUnit}
        namePrefix={isUnit ? "editUnit" : "editDivision"}
        onChange={update}
        showDivisionSelector={isUnit && canChangeUnitParent}
        showType={isUnit}
      />
    </Dialog>
  );
}

type NodeRowProps = {
  canManage: boolean;
  editLabel: string;
  meta: string;
  name: string;
  onArchive: () => void;
  onEdit: () => void;
  type?: string;
};

function NodeRow({ canManage, editLabel, meta, name, onArchive, onEdit, type }: NodeRowProps) {
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
            <Button aria-label={editLabel} onClick={onEdit} size="sm" type="button" variant="secondary">
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
