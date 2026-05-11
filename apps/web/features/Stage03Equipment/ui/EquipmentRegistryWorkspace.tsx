"use client";

import { useCallback, useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  Archive,
  Cable,
  FileText,
  Gauge,
  ListChecks,
  MapPin,
  Network,
  Pencil,
  Plus,
  Save,
  Trash2,
  Wrench,
} from "lucide-react";
import type {
  ApiEnvelope,
  ApiMeta,
  EquipmentRecord,
  JournalRecord,
  LinkedStandardRecord,
  MeasuringInstrumentPlacement,
  MeasuringInstrumentRecord,
  RegistryStatus,
  SessionSummaryResponse,
  StandardRecord,
} from "@/shared/api";
import { sessionHasCapability } from "@/shared/api";
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  Dialog,
  FormListScrollArea,
  FormListSplitLayout,
  InputField,
  IslandCard,
  SelectField,
  Tabs,
  TextareaField,
  useToast,
} from "@/shared/ui";
import { cn } from "@/shared/lib/cn";

type EquipmentFormKind = "technical" | "diagnostic";
type EquipmentWorkspaceTab = "equipment" | "journal";

type Props = {
  session: SessionSummaryResponse;
  initialShowArchived: boolean;
};

type EquipmentFormState = {
  unitId: string;
  manufacturer: string;
  classification: string;
  model: string;
  fullName: string;
  factoryNumber: string;
  inventoryNumber: string;
  manufactureYear: string;
  status: RegistryStatus;
  measuringInstrumentIds: string[];
  comment: string;
  documentUrl: string;
};

type MeasuringInstrumentFormState = {
  unitId: string;
  placementKind: MeasuringInstrumentPlacement;
  equipmentId: string;
  name: string;
  instrumentType: string;
  model: string;
  registrationNumber: string;
  serialNumber: string;
  standardIds: string[];
  comment: string;
  documentUrl: string;
};

type StandardFormState = {
  ownershipScopeType: "organization" | "division" | "unit";
  scopeId: string;
  ownerLabel: string;
  standardType: string;
  model: string;
  identifier: string;
  serialNumber: string;
  metrologicalCharacteristics: string;
  comment: string;
  documentUrl: string;
};

type DiagnosticStandardDraft = Pick<
  StandardFormState,
  | "standardType"
  | "model"
  | "identifier"
  | "serialNumber"
  | "metrologicalCharacteristics"
  | "comment"
  | "documentUrl"
> & {
  localId: string;
};

type JournalFormState = {
  operationType: JournalRecord["operationType"];
  operationDate: string;
  documentNumber: string;
  validUntil: string;
  executorOrganization: string;
  attachmentUrl: string;
  comment: string;
};

type ArchiveConfirmation = {
  dedupeKey: string;
  fallbackMessage: string;
  recordLabel: string;
  task: () => Promise<void>;
};

type EditDialogState =
  | {
      kind: "equipment";
      recordId: string;
      recordLabel: string;
      form: EquipmentFormState;
    }
  | {
      kind: "measuringInstrument";
      recordId: string;
      recordLabel: string;
      form: MeasuringInstrumentFormState;
      standards: LinkedStandardRecord[];
      standardDrafts: DiagnosticStandardDraft[];
      removedStandardIds: string[];
    };

type EquipmentPassportSection = {
  id: string;
  title: ReactNode;
  icon: ReactNode;
  trailing?: ReactNode;
  children: ReactNode;
};

const equipmentFormKindOptions: Array<{ value: EquipmentFormKind; label: string }> = [
  { value: "technical", label: "Техническое" },
  { value: "diagnostic", label: "Диагностическое" },
];

const registryStatusOptions: Array<{ value: RegistryStatus; label: string }> = [
  { value: "active", label: "Активно" },
  { value: "inactive", label: "Приостановлено" },
  { value: "retired", label: "Выведено" },
];

const journalOperationOptions: Array<{ value: JournalRecord["operationType"]; label: string }> = [
  { value: "verification", label: "Поверка" },
  { value: "calibration", label: "Калибровка" },
  { value: "maintenance", label: "Техобслуживание" },
  { value: "suspension", label: "Приостановка" },
  { value: "decommission", label: "Вывод из эксплуатации" },
];

const equipmentWorkspaceTabs = [
  { key: "equipment", label: "Оборудование", icon: Wrench },
  { key: "journal", label: "Журнал операций", icon: ListChecks },
] as const;

function getEquipmentWorkspacePanelId(key: EquipmentWorkspaceTab) {
  return `equipment-workspace-panel-${key}`;
}

const statusToneMap: Record<RegistryStatus, "success" | "warning" | "neutral"> = {
  active: "success",
  inactive: "warning",
  retired: "neutral",
};

const statusLabelMap: Record<RegistryStatus, string> = {
  active: "Активно",
  inactive: "Приостановлено",
  retired: "Выведено",
};

function defaultEquipmentForm(session: SessionSummaryResponse): EquipmentFormState {
  return {
    unitId: session.units[0]?.id ?? "",
    manufacturer: "",
    classification: "",
    model: "",
    fullName: "",
    factoryNumber: "",
    inventoryNumber: "",
    manufactureYear: String(new Date().getFullYear()),
    status: "active",
    measuringInstrumentIds: [],
    comment: "",
    documentUrl: "",
  };
}

function defaultMeasuringInstrumentForm(session: SessionSummaryResponse): MeasuringInstrumentFormState {
  return {
    unitId: session.units[0]?.id ?? "",
    placementKind: "standalone",
    equipmentId: "",
    name: "",
    instrumentType: "",
    model: "",
    registrationNumber: "",
    serialNumber: "",
    standardIds: [],
    comment: "",
    documentUrl: "",
  };
}

function createDiagnosticStandardDraft(): DiagnosticStandardDraft {
  return {
    localId:
      globalThis.crypto?.randomUUID() ??
      `diagnostic-standard-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    standardType: "",
    model: "",
    identifier: "",
    serialNumber: "",
    metrologicalCharacteristics: "",
    comment: "",
    documentUrl: "",
  };
}

function defaultJournalForm(): JournalFormState {
  return {
    operationType: "verification",
    operationDate: new Date().toISOString().slice(0, 10),
    documentNumber: "",
    validUntil: "",
    executorOrganization: "",
    attachmentUrl: "",
    comment: "",
  };
}

function equipmentFormFromRecord(record: EquipmentRecord): EquipmentFormState {
  return {
    unitId: record.unit.id,
    manufacturer: record.manufacturer,
    classification: record.classification,
    model: record.model,
    fullName: record.fullName,
    factoryNumber: record.factoryNumber,
    inventoryNumber: record.inventoryNumber ?? "",
    manufactureYear: String(record.manufactureYear),
    status: record.status,
    measuringInstrumentIds: [],
    comment: record.comment ?? "",
    documentUrl: record.documentUrl ?? "",
  };
}

function measuringInstrumentFormFromRecord(record: MeasuringInstrumentRecord): MeasuringInstrumentFormState {
  return {
    unitId: record.unit.id,
    placementKind: record.placementKind,
    equipmentId: record.equipment?.id ?? "",
    name: record.name,
    instrumentType: record.instrumentType,
    model: record.model,
    registrationNumber: record.registrationNumber,
    serialNumber: record.serialNumber,
    standardIds: record.standards.map((standard) => standard.id),
    comment: record.comment ?? "",
    documentUrl: record.documentUrl ?? "",
  };
}

async function parseEnvelope<T>(response: Response, fallbackMessage: string) {
  const body = (await response.json()) as ApiEnvelope<T>;
  if (!response.ok || !body.success || body.data === undefined) {
    throw new Error(body.error ?? fallbackMessage);
  }
  return body.data;
}

async function parseEnvelopeWithMeta<T>(response: Response, fallbackMessage: string): Promise<{ data: T; meta?: ApiMeta }> {
  const body = (await response.json()) as ApiEnvelope<T>;
  if (!response.ok || !body.success || body.data === undefined) {
    throw new Error(body.error ?? fallbackMessage);
  }
  return {
    data: body.data,
    meta: body.meta,
  };
}

const registryPageSize = 100;

async function fetchAllRegistryPages<T>(path: string, fallbackMessage: string, includeArchived: boolean): Promise<T[]> {
  const items: T[] = [];
  let offset = 0;

  for (;;) {
    const searchParams = new URLSearchParams();
    if (includeArchived) {
      searchParams.set("includeArchived", "true");
    }
    searchParams.set("limit", String(registryPageSize));
    searchParams.set("offset", String(offset));

    const response = await fetch(`${path}?${searchParams.toString()}`, { cache: "no-store" });
    const page = await parseEnvelopeWithMeta<T[]>(response, fallbackMessage);
    items.push(...page.data);

    const total = page.meta?.total ?? items.length;
    const nextOffset = (page.meta?.offset ?? offset) + page.data.length;
    if (page.data.length === 0 || nextOffset >= total) {
      return items;
    }
    if (nextOffset <= offset) {
      return items;
    }

    offset = nextOffset;
  }
}

function optionalString(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function equipmentPayload(form: EquipmentFormState) {
  return {
    unitId: form.unitId,
    manufacturer: form.manufacturer,
    classification: form.classification,
    model: form.model,
    fullName: form.fullName,
    factoryNumber: form.factoryNumber,
    inventoryNumber: optionalString(form.inventoryNumber),
    manufactureYear: Number(form.manufactureYear),
    status: form.status,
    comment: optionalString(form.comment),
    documentUrl: optionalString(form.documentUrl),
  };
}

function measuringInstrumentPayload(form: MeasuringInstrumentFormState) {
  return {
    unitId: form.unitId,
    equipmentId: form.placementKind === "built_in" ? optionalString(form.equipmentId) : undefined,
    name: form.name,
    instrumentType: form.instrumentType,
    model: form.model,
    registrationNumber: form.registrationNumber,
    serialNumber: form.serialNumber,
    placementKind: form.placementKind,
    standardIds: form.standardIds,
    comment: optionalString(form.comment),
    documentUrl: optionalString(form.documentUrl),
  };
}

function diagnosticStandardPayload(
  draft: DiagnosticStandardDraft,
  diagnosticEquipmentId: string,
  diagnosticUnitId: string,
  session: SessionSummaryResponse,
) {
  const unit = session.units.find((item) => item.id === diagnosticUnitId) ?? session.units[0];

  return {
    diagnosticEquipmentId,
    unitId: unit?.id ?? "",
    ownerLabel: unit?.name ?? session.organization.name,
    standardType: draft.standardType,
    model: draft.model,
    identifier: draft.identifier,
    serialNumber: optionalString(draft.serialNumber),
    metrologicalCharacteristics: draft.metrologicalCharacteristics,
    comment: optionalString(draft.comment),
    documentUrl: optionalString(draft.documentUrl),
  };
}

function isEquipmentFormReady(form: EquipmentFormState) {
  const year = Number(form.manufactureYear);
  return Boolean(
    form.unitId &&
      form.manufacturer.trim() &&
      form.classification.trim() &&
      form.model.trim() &&
      form.fullName.trim() &&
      form.factoryNumber.trim() &&
      Number.isFinite(year),
  );
}

function isMeasuringInstrumentFormReady(form: MeasuringInstrumentFormState) {
  return Boolean(
    form.unitId &&
      form.name.trim() &&
      form.instrumentType.trim() &&
      form.model.trim() &&
      form.registrationNumber.trim() &&
      form.serialNumber.trim() &&
      (form.placementKind !== "built_in" || form.equipmentId),
  );
}

function isDiagnosticStandardDraftReady(draft: DiagnosticStandardDraft) {
  return Boolean(
    draft.standardType.trim() &&
      draft.model.trim() &&
      draft.identifier.trim() &&
      draft.metrologicalCharacteristics.trim(),
  );
}

function areDiagnosticStandardDraftsReady(drafts: DiagnosticStandardDraft[]) {
  return drafts.every(isDiagnosticStandardDraftReady);
}

function defaultAutoComplete(type: string | undefined) {
  switch (type) {
    case "url":
      return "url";
    case "number":
      return "off";
    default:
      return "off";
  }
}

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatDate(value?: string) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "medium",
  }).format(new Date(value));
}

function formatOperationType(value: JournalRecord["operationType"]) {
  return journalOperationOptions.find((item) => item.value === value)?.label ?? value;
}

function normalizeMeasuringInstrument(item: MeasuringInstrumentRecord): MeasuringInstrumentRecord {
  return {
    ...item,
    standards: Array.isArray(item.standards) ? item.standards : [],
  };
}

function buildEquipmentRoute(showArchived: boolean) {
  const search = new URLSearchParams();
  if (showArchived) {
    search.set("archived", "1");
  }
  const query = search.toString();
  return query ? `/equipment?${query}` : "/equipment";
}

function fieldDetail(label: string, value: string | number | undefined | null, translateNo = false) {
  const content = value || "—";

  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-card px-4 py-3">
      <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{label}</div>
      <div className="mt-2 text-sm font-medium text-foreground">
        {translateNo && content !== "—" ? <span translate="no">{content}</span> : content}
      </div>
    </div>
  );
}

function passportDetail(label: string, value: string | number | undefined | null, translateNo = false) {
  const content = value || "—";

  return (
    <div className="min-w-0 space-y-1">
      <dt className="text-xs font-medium leading-4 text-muted-foreground">{label}</dt>
      <dd
        className="break-words text-sm font-medium leading-5 text-foreground [overflow-wrap:anywhere]"
        translate={translateNo && content !== "—" ? "no" : undefined}
      >
        {content}
      </dd>
    </div>
  );
}

function passportSectionHeading({
  children,
  icon,
  trailing,
}: {
  children: ReactNode;
  icon: ReactNode;
  trailing?: ReactNode;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2 text-sm font-semibold text-foreground">
      <span className="flex size-5 shrink-0 items-center justify-center text-muted-foreground">{icon}</span>
      <span className="flex min-w-0 items-baseline">
        <span className="min-w-0 break-words">{children}</span>
        {trailing !== undefined && trailing !== null ? (
          <span className="shrink-0 tabular-nums text-muted-foreground">
            <span aria-hidden="true" className="px-1 text-text-tertiary">
              ·
            </span>
            {trailing}
          </span>
        ) : null}
      </span>
    </div>
  );
}

function renderPassportSections(sections: EquipmentPassportSection[]) {
  return sections.map((section, index) => (
    <div className={cn("min-w-0 space-y-2", index > 0 && "border-t border-border pt-4")} key={section.id}>
      {passportSectionHeading({ children: section.title, icon: section.icon, trailing: section.trailing })}
      {section.children}
    </div>
  ));
}

function EquipmentPassportCard({
  actions,
  badges,
  icon,
  intrinsicClassName,
  label,
  primarySections,
  secondarySections,
  subtitle,
  title,
}: {
  actions?: ReactNode;
  badges: ReactNode;
  icon?: ReactNode;
  intrinsicClassName: string;
  label: string;
  primarySections: EquipmentPassportSection[];
  secondarySections?: EquipmentPassportSection[];
  subtitle: string;
  title: string;
}) {
  const hasSecondarySections = Boolean(secondarySections?.length);

  return (
    <Card className={cn("equipment-passport-card gap-5 [content-visibility:auto]", intrinsicClassName)} padding="md" tone="muted">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          {icon ? (
            <span className="flex size-10 shrink-0 items-center justify-center rounded-[var(--radius-lg)] border border-border bg-muted/70 text-muted-foreground">
              {icon}
            </span>
          ) : null}
          <div className="min-w-0 space-y-1">
            <h3 className="break-words text-xl font-semibold leading-7 text-foreground">{title}</h3>
            <p className="break-words text-sm leading-6 text-muted-foreground">{subtitle}</p>
          </div>
        </div>
        <div className="flex min-w-0 flex-wrap gap-2">
          <Badge tone="neutral">{label}</Badge>
          {badges}
        </div>
      </div>

      <div className={cn("equipment-passport-layout", hasSecondarySections && "equipment-passport-layout--split")}>
        <div className="equipment-passport-main space-y-4 p-4">{renderPassportSections(primarySections)}</div>
        {hasSecondarySections ? (
          <div className="equipment-passport-aside p-4">
            <div className="grid gap-4">{renderPassportSections(secondarySections ?? [])}</div>
          </div>
        ) : null}
      </div>

      {actions ? <div className="grid gap-3 sm:grid-cols-2">{actions}</div> : null}
    </Card>
  );
}

function EmptyState({
  title,
  detail,
  action,
}: {
  title: string;
  detail: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-xl)] border border-dashed border-border bg-muted/50 px-5 py-6 text-sm text-muted-foreground">
      <div className="min-w-0">
        <div className="font-medium text-foreground">{title}</div>
        <p className="mt-2 leading-6">{detail}</p>
      </div>
      {action}
    </div>
  );
}

function ArchiveConfirmDialog({
  confirmation,
  loading,
  onCancel,
  onConfirm,
}: {
  confirmation: ArchiveConfirmation | null;
  loading: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!confirmation) {
    return null;
  }

  return (
    <ConfirmDialog
      confirmLabel="Архивировать"
      description={
        <>
          {confirmation.recordLabel} исчезнет из активных списков и останется доступна при включенной видимости архива.
        </>
      }
      icon={<Archive aria-hidden="true" className="size-5" />}
      loading={loading}
      onCancel={onCancel}
      onConfirm={onConfirm}
      open={Boolean(confirmation)}
      title="Архивировать запись?"
      tone="danger"
    />
  );
}

function EditRegistryDialog({
  editor,
  loading,
  onCancel,
  onChange,
  onSubmit,
  session,
}: {
  editor: EditDialogState | null;
  loading: boolean;
  onCancel: () => void;
  onChange: (next: EditDialogState) => void;
  onSubmit: () => void;
  session: SessionSummaryResponse;
}) {
  if (!editor) {
    return null;
  }

  const title =
    editor.kind === "equipment"
      ? "Редактировать оборудование"
      : "Редактировать диагностическое оборудование";
  const HeaderIcon = editor.kind === "equipment" ? Wrench : Cable;
  const canSubmit =
    editor.kind === "equipment"
      ? isEquipmentFormReady(editor.form)
      : isMeasuringInstrumentFormReady(editor.form) && areDiagnosticStandardDraftsReady(editor.standardDrafts);

  const updateEquipmentForm = (patch: Partial<EquipmentFormState>) => {
    if (editor.kind !== "equipment") {
      return;
    }
    onChange({ ...editor, form: { ...editor.form, ...patch } });
  };

  const updateMeasuringInstrumentForm = (patch: Partial<MeasuringInstrumentFormState>) => {
    if (editor.kind !== "measuringInstrument") {
      return;
    }
    onChange({ ...editor, form: { ...editor.form, ...patch } });
  };

  const updateEditStandardDraft = (localId: string, patch: Partial<DiagnosticStandardDraft>) => {
    if (editor.kind !== "measuringInstrument") {
      return;
    }
    onChange({
      ...editor,
      standardDrafts: editor.standardDrafts.map((draft) =>
        draft.localId === localId ? { ...draft, ...patch } : draft,
      ),
    });
  };

  const removeEditStandardDraft = (localId: string) => {
    if (editor.kind !== "measuringInstrument") {
      return;
    }
    onChange({
      ...editor,
      standardDrafts: editor.standardDrafts.filter((draft) => draft.localId !== localId),
    });
  };

  const addEditStandardDraft = () => {
    if (editor.kind !== "measuringInstrument") {
      return;
    }
    onChange({
      ...editor,
      standardDrafts: [...editor.standardDrafts, createDiagnosticStandardDraft()],
    });
  };

  const markStandardForRemoval = (standardId: string) => {
    if (editor.kind !== "measuringInstrument" || editor.removedStandardIds.includes(standardId)) {
      return;
    }
    onChange({
      ...editor,
      form: {
        ...editor.form,
        standardIds: editor.form.standardIds.filter((id) => id !== standardId),
      },
      removedStandardIds: [...editor.removedStandardIds, standardId],
    });
  };

  const restoreRemovedStandard = (standardId: string) => {
    if (editor.kind !== "measuringInstrument") {
      return;
    }
    onChange({
      ...editor,
      form: {
        ...editor.form,
        standardIds: Array.from(new Set([...editor.form.standardIds, standardId])),
      },
      removedStandardIds: editor.removedStandardIds.filter((id) => id !== standardId),
    });
  };

  const renderEquipmentForm = (state: Extract<EditDialogState, { kind: "equipment" }>) => (
    <div className="grid gap-4">
      <div className="grid gap-4 md:grid-cols-2">
        <SelectField
          label="Юнит владения"
          name="edit-equipment-unit-id"
          onChange={(event) => updateEquipmentForm({ unitId: event.target.value })}
          options={session.units.map((unit) => ({ label: unit.name, value: unit.id }))}
          value={state.form.unitId}
        />
        <SelectField
          label="Статус оборудования"
          name="edit-equipment-status"
          onChange={(event) => updateEquipmentForm({ status: event.target.value as RegistryStatus })}
          options={registryStatusOptions}
          value={state.form.status}
        />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <InputField
          autoComplete={defaultAutoComplete("text")}
          label="Производитель"
          name="edit-equipment-manufacturer"
          onChange={(event) => updateEquipmentForm({ manufacturer: event.target.value })}
          value={state.form.manufacturer}
        />
        <InputField
          autoComplete={defaultAutoComplete("text")}
          label="Класс / тип"
          name="edit-equipment-classification"
          onChange={(event) => updateEquipmentForm({ classification: event.target.value })}
          value={state.form.classification}
        />
        <InputField
          autoComplete={defaultAutoComplete("text")}
          label="Модель"
          name="edit-equipment-model"
          onChange={(event) => updateEquipmentForm({ model: event.target.value })}
          value={state.form.model}
        />
        <InputField
          autoComplete={defaultAutoComplete("number")}
          inputMode="numeric"
          label="Год выпуска"
          name="edit-equipment-manufacture-year"
          onChange={(event) => updateEquipmentForm({ manufactureYear: event.target.value })}
          type="number"
          value={state.form.manufactureYear}
        />
        <InputField
          autoComplete={defaultAutoComplete("text")}
          label="Полное наименование"
          name="edit-equipment-full-name"
          onChange={(event) => updateEquipmentForm({ fullName: event.target.value })}
          value={state.form.fullName}
        />
        <InputField
          autoComplete={defaultAutoComplete("text")}
          label="Заводской номер"
          name="edit-equipment-factory-number"
          onChange={(event) => updateEquipmentForm({ factoryNumber: event.target.value })}
          spellCheck={false}
          translate="no"
          value={state.form.factoryNumber}
        />
        <InputField
          autoComplete={defaultAutoComplete("text")}
          label="Инвентарный номер"
          name="edit-equipment-inventory-number"
          onChange={(event) => updateEquipmentForm({ inventoryNumber: event.target.value })}
          spellCheck={false}
          translate="no"
          value={state.form.inventoryNumber}
        />
        <InputField
          autoComplete={defaultAutoComplete("url")}
          label="Документ / ссылка"
          name="edit-equipment-document-url"
          onChange={(event) => updateEquipmentForm({ documentUrl: event.target.value })}
          type="url"
          value={state.form.documentUrl}
        />
      </div>
      <TextareaField
        label="Комментарий"
        name="edit-equipment-comment"
        onChange={(event) => updateEquipmentForm({ comment: event.target.value })}
        value={state.form.comment}
      />
    </div>
  );

  const renderMeasuringInstrumentForm = (
    state: Extract<EditDialogState, { kind: "measuringInstrument" }>,
  ) => (
    <div className="grid gap-4">
      <SelectField
        label="Юнит"
        name="edit-measuring-instrument-unit-id"
        onChange={(event) => updateMeasuringInstrumentForm({ unitId: event.target.value })}
        options={session.units.map((unit) => ({ label: unit.name, value: unit.id }))}
        value={state.form.unitId}
      />
      <div className="grid gap-4 md:grid-cols-2">
        <InputField
          autoComplete={defaultAutoComplete("text")}
          label="Наименование"
          name="edit-measuring-instrument-name"
          onChange={(event) => updateMeasuringInstrumentForm({ name: event.target.value })}
          value={state.form.name}
        />
        <InputField
          autoComplete={defaultAutoComplete("text")}
          label="Тип / класс"
          name="edit-measuring-instrument-type"
          onChange={(event) => updateMeasuringInstrumentForm({ instrumentType: event.target.value })}
          value={state.form.instrumentType}
        />
        <InputField
          autoComplete={defaultAutoComplete("text")}
          label="Модель"
          name="edit-measuring-instrument-model"
          onChange={(event) => updateMeasuringInstrumentForm({ model: event.target.value })}
          value={state.form.model}
        />
        <InputField
          autoComplete={defaultAutoComplete("text")}
          label="ФИФ"
          name="edit-measuring-instrument-registration-number"
          onChange={(event) => updateMeasuringInstrumentForm({ registrationNumber: event.target.value })}
          spellCheck={false}
          translate="no"
          value={state.form.registrationNumber}
        />
        <InputField
          autoComplete={defaultAutoComplete("text")}
          label="Серийный номер"
          name="edit-measuring-instrument-serial-number"
          onChange={(event) => updateMeasuringInstrumentForm({ serialNumber: event.target.value })}
          spellCheck={false}
          translate="no"
          value={state.form.serialNumber}
        />
        <InputField
          autoComplete={defaultAutoComplete("url")}
          label="Документ / ссылка"
          name="edit-measuring-instrument-document-url"
          onChange={(event) => updateMeasuringInstrumentForm({ documentUrl: event.target.value })}
          type="url"
          value={state.form.documentUrl}
        />
      </div>
      <div className="grid gap-3 rounded-[var(--radius-lg)] border border-border bg-muted/30 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">Комплект эталонов</p>
            <p className="text-sm text-muted-foreground">
              Добавление и удаление применятся после сохранения карточки.
            </p>
          </div>
          <Button
            leftIcon={<Plus className="size-4" />}
            onClick={addEditStandardDraft}
            size="sm"
            type="button"
            variant="secondary"
          >
            Добавить меру
          </Button>
        </div>
        {state.standards.length ? (
          <div className="grid gap-3">
            {state.standards.map((standard) => {
              const pendingRemoval = state.removedStandardIds.includes(standard.id);
              return (
                <div
                  className={`rounded-[var(--radius-lg)] border px-4 py-3 ${
                    pendingRemoval ? "border-destructive/40 bg-destructive-soft/40" : "border-border bg-card"
                  }`}
                  key={standard.id}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge size="sm" tone={pendingRemoval ? "danger" : statusToneMap[standard.status]}>
                          {pendingRemoval ? "Будет удален" : statusLabelMap[standard.status]}
                        </Badge>
                        <span className="text-sm font-semibold text-foreground" translate="no">
                          {standard.standardType} • {standard.identifier}
                        </span>
                      </div>
                      <p className="break-words text-sm text-muted-foreground">
                        {standard.model} • {standard.scopeLabel}
                      </p>
                    </div>
                    {pendingRemoval ? (
                      <Button
                        aria-label={`Вернуть эталон ${standard.identifier}`}
                        onClick={() => restoreRemovedStandard(standard.id)}
                        size="sm"
                        type="button"
                        variant="secondary"
                      >
                        Вернуть
                      </Button>
                    ) : (
                      <Button
                        aria-label={`Удалить эталон ${standard.identifier}`}
                        leftIcon={<Trash2 className="size-4" />}
                        onClick={() => markStandardForRemoval(standard.id)}
                        size="sm"
                        type="button"
                        variant="danger"
                      >
                        Удалить
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : state.standardDrafts.length ? null : (
          <EmptyState detail="Комплект можно оставить пустым." title="Эталоны и меры не добавлены" />
        )}
        {state.standardDrafts.length ? (
          <div className="grid gap-3">
            {state.standardDrafts.map((draft, index) => (
              <div className="rounded-[var(--radius-lg)] border border-border bg-card p-4" key={draft.localId}>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-foreground">Новая мера {index + 1}</p>
                  <Button
                    aria-label={`Удалить новую меру ${index + 1}`}
                    leftIcon={<Trash2 className="size-4" />}
                    onClick={() => removeEditStandardDraft(draft.localId)}
                    size="sm"
                    type="button"
                    variant="ghost"
                  >
                    Удалить
                  </Button>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <InputField
                    autoComplete={defaultAutoComplete("text")}
                    label="Тип меры"
                    name={`edit-diagnostic-standard-type-${draft.localId}`}
                    onChange={(event) => updateEditStandardDraft(draft.localId, { standardType: event.target.value })}
                    value={draft.standardType}
                  />
                  <InputField
                    autoComplete={defaultAutoComplete("text")}
                    label="Модель"
                    name={`edit-diagnostic-standard-model-${draft.localId}`}
                    onChange={(event) => updateEditStandardDraft(draft.localId, { model: event.target.value })}
                    value={draft.model}
                  />
                  <InputField
                    autoComplete={defaultAutoComplete("text")}
                    label="Идентификатор"
                    name={`edit-diagnostic-standard-identifier-${draft.localId}`}
                    onChange={(event) => updateEditStandardDraft(draft.localId, { identifier: event.target.value })}
                    spellCheck={false}
                    translate="no"
                    value={draft.identifier}
                  />
                  <InputField
                    autoComplete={defaultAutoComplete("text")}
                    label="Серийный номер"
                    name={`edit-diagnostic-standard-serial-${draft.localId}`}
                    onChange={(event) => updateEditStandardDraft(draft.localId, { serialNumber: event.target.value })}
                    spellCheck={false}
                    translate="no"
                    value={draft.serialNumber}
                  />
                  <InputField
                    autoComplete={defaultAutoComplete("url")}
                    label="Документ / ссылка"
                    name={`edit-diagnostic-standard-document-${draft.localId}`}
                    onChange={(event) => updateEditStandardDraft(draft.localId, { documentUrl: event.target.value })}
                    type="url"
                    value={draft.documentUrl}
                  />
                </div>
                <TextareaField
                  className="mt-4"
                  label="Метрологические характеристики"
                  name={`edit-diagnostic-standard-characteristics-${draft.localId}`}
                  onChange={(event) =>
                    updateEditStandardDraft(draft.localId, {
                      metrologicalCharacteristics: event.target.value,
                    })
                  }
                  value={draft.metrologicalCharacteristics}
                />
                <TextareaField
                  className="mt-4"
                  label="Комментарий"
                  name={`edit-diagnostic-standard-comment-${draft.localId}`}
                  onChange={(event) => updateEditStandardDraft(draft.localId, { comment: event.target.value })}
                  value={draft.comment}
                />
              </div>
            ))}
          </div>
        ) : null}
        {state.removedStandardIds.length ? (
          <p className="text-sm text-destructive-strong">
            К удалению отмечено: {state.removedStandardIds.length}. Записи будут физически удалены после сохранения.
          </p>
        ) : null}
      </div>
      <TextareaField
        label="Комментарий"
        name="edit-measuring-instrument-comment"
        onChange={(event) => updateMeasuringInstrumentForm({ comment: event.target.value })}
        value={state.form.comment}
      />
    </div>
  );

  return (
    <Dialog
      badge={
        <Badge icon={<Pencil className="size-4" />} tone="interactive">
          Редактирование
        </Badge>
      }
      description={editor.recordLabel}
      dismissible={!loading}
      footer={
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            {!canSubmit ? "Заполните обязательные поля перед сохранением." : "Изменения попадут в текущий реестр после сохранения."}
          </p>
          <div className="flex flex-wrap gap-3">
            <Button disabled={loading} onClick={onCancel} type="button" variant="secondary">
              Отмена
            </Button>
            <Button
              disabled={!canSubmit}
              leftIcon={<Save className="size-4" />}
              loading={loading}
              onClick={onSubmit}
              type="button"
            >
              Сохранить изменения
            </Button>
          </div>
        </div>
      }
      onOpenChange={(open) => {
        if (!open && !loading) {
          onCancel();
        }
      }}
      headerIcon={<HeaderIcon aria-hidden="true" className="size-4" />}
      headerVariant="muted"
      open={Boolean(editor)}
      showClose={!loading}
      size="lg"
      title={title}
    >
      {editor.kind === "equipment" ? renderEquipmentForm(editor) : null}
      {editor.kind === "measuringInstrument" ? renderMeasuringInstrumentForm(editor) : null}
    </Dialog>
  );
}

function JournalTimeline({
  journals,
  emptyTitle,
  emptyDetail,
}: {
  journals: JournalRecord[];
  emptyTitle: string;
  emptyDetail: string;
}) {
  if (!journals.length) {
    return <EmptyState detail={emptyDetail} title={emptyTitle} />;
  }

  return (
    <div className="grid gap-3">
      {journals.map((journal) => (
        <div className="rounded-[var(--radius-lg)] border border-border bg-card px-4 py-4" key={journal.id}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge size="sm" tone="interactive">
                  {formatOperationType(journal.operationType)}
                </Badge>
                <Badge size="sm" tone="neutral">
                  {formatDate(journal.operationDate)}
                </Badge>
              </div>
              <p className="text-sm font-semibold text-foreground" translate="no">
                {journal.documentNumber}
              </p>
            </div>
            {journal.validUntil ? (
              <Badge size="sm" tone="warning">
                Действует до {formatDate(journal.validUntil)}
              </Badge>
            ) : null}
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {fieldDetail("Исполнитель", journal.executorOrganization)}
            {fieldDetail("Вложение", journal.attachmentUrl)}
          </div>
          {journal.comment ? (
            <div className="mt-3 rounded-[var(--radius-lg)] border border-border bg-muted/40 px-4 py-3 text-sm leading-6 text-foreground">
              {journal.comment}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}

export function EquipmentRegistryWorkspace({ session, initialShowArchived }: Props) {
  const router = useRouter();
  const { showToast } = useToast();
  const [showArchived, setShowArchived] = useState(initialShowArchived);
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<EquipmentWorkspaceTab>("equipment");
  const [equipmentRecords, setEquipmentRecords] = useState<EquipmentRecord[]>([]);
  const [measuringInstruments, setMeasuringInstruments] = useState<MeasuringInstrumentRecord[]>([]);
  const [equipmentFormKind, setEquipmentFormKind] = useState<EquipmentFormKind>("technical");
  const [equipmentForm, setEquipmentForm] = useState(() => defaultEquipmentForm(session));
  const [measuringInstrumentForm, setMeasuringInstrumentForm] = useState(() => defaultMeasuringInstrumentForm(session));
  const [diagnosticStandardDrafts, setDiagnosticStandardDrafts] = useState<DiagnosticStandardDraft[]>([]);
  const [measuringInstrumentJournalForm, setMeasuringInstrumentJournalForm] = useState(defaultJournalForm);
  const [selectedMeasuringInstrumentId, setSelectedMeasuringInstrumentId] = useState("");
  const [measuringInstrumentJournals, setMeasuringInstrumentJournals] = useState<JournalRecord[]>([]);
  const [loadingMeasuringInstrumentJournals, setLoadingMeasuringInstrumentJournals] = useState(false);
  const [loading, setLoading] = useState(true);
  const hasLoadedRegistriesRef = useRef(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [archiveConfirmation, setArchiveConfirmation] = useState<ArchiveConfirmation | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialog, setEditDialog] = useState<EditDialogState | null>(null);
  const [mutationInFlight, setMutationInFlight] = useState(false);
  const [isPending, startTransition] = useTransition();

  const canManageRegistry = sessionHasCapability(session, "manage_equipment");

  const selectedMeasuringInstrument =
    measuringInstruments.find((item) => item.id === selectedMeasuringInstrumentId) ?? null;
  const isMutating = isPending || mutationInFlight;
  const unifiedEquipmentCount = equipmentRecords.length + measuringInstruments.length;

  const showSuccessToast = useCallback((title: string, dedupeKey: string) => {
    showToast({
      dedupeKey,
      title,
      tone: "success",
    });
  }, [showToast]);

  const showErrorToast = useCallback((title: string, error: unknown, dedupeKey: string) => {
    showToast({
      dedupeKey,
      description: error instanceof Error ? error.message : undefined,
      title,
      tone: "error",
    });
  }, [showToast]);

  const loadRegistries = useCallback(async () => {
    if (!hasLoadedRegistriesRef.current) {
      setLoading(true);
    }
    setLoadError(null);

    try {
      const [equipmentData, measuringInstrumentData] = await Promise.all([
        fetchAllRegistryPages<EquipmentRecord>("/api/equipment", "Не удалось загрузить реестр оборудования.", showArchived),
        fetchAllRegistryPages<MeasuringInstrumentRecord>(
          "/api/equipment/measuring-instruments",
          "Не удалось загрузить диагностическое оборудование.",
          showArchived,
        ),
      ]);

      setEquipmentRecords(equipmentData);
      setMeasuringInstruments(measuringInstrumentData.map(normalizeMeasuringInstrument));
      hasLoadedRegistriesRef.current = true;
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Не удалось загрузить данные реестров.");
    } finally {
      setLoading(false);
    }
  }, [showArchived]);

  const loadMeasuringInstrumentJournals = useCallback(async (id: string) => {
    setLoadingMeasuringInstrumentJournals(true);
    try {
      const journals = await fetch(`/api/equipment/measuring-instruments/${id}/journals`, {
        cache: "no-store",
      }).then((response) => parseEnvelope<JournalRecord[]>(response, "Не удалось загрузить журнал оборудования."));
      setMeasuringInstrumentJournals(journals);
    } catch (error) {
      showErrorToast("Не удалось загрузить журнал оборудования.", error, "equipment-journals-load-error");
    } finally {
      setLoadingMeasuringInstrumentJournals(false);
    }
  }, [showErrorToast]);

  useEffect(() => {
    setShowArchived(initialShowArchived);
  }, [initialShowArchived]);

  useEffect(() => {
    void loadRegistries();
  }, [loadRegistries]);

  useEffect(() => {
    if (!measuringInstruments.length) {
      if (selectedMeasuringInstrumentId !== "") {
        setSelectedMeasuringInstrumentId("");
      }
      return;
    }

    if (!measuringInstruments.some((item) => item.id === selectedMeasuringInstrumentId)) {
      setSelectedMeasuringInstrumentId(measuringInstruments[0]?.id ?? "");
    }
  }, [measuringInstruments, selectedMeasuringInstrumentId]);

  useEffect(() => {
    if (selectedMeasuringInstrumentId) {
      void loadMeasuringInstrumentJournals(selectedMeasuringInstrumentId);
    } else {
      setMeasuringInstrumentJournals([]);
    }
  }, [loadMeasuringInstrumentJournals, selectedMeasuringInstrumentId]);

  useEffect(() => {
    if (
      measuringInstrumentForm.equipmentId &&
      !equipmentRecords.some(
        (item) =>
          item.id === measuringInstrumentForm.equipmentId &&
          item.unit.id === measuringInstrumentForm.unitId &&
          !item.archivedAt,
      )
    ) {
      setMeasuringInstrumentForm((current) => ({
        ...current,
        equipmentId: "",
        placementKind: "standalone",
      }));
    }
  }, [equipmentRecords, measuringInstrumentForm.equipmentId, measuringInstrumentForm.unitId]);

  function handleArchiveVisibilityChange() {
    setShowArchived((current) => {
      const next = !current;
      router.replace(buildEquipmentRoute(next), { scroll: false });
      return next;
    });
  }

  async function createEquipment({ keepOpen = false }: { keepOpen?: boolean } = {}) {
    const response = await fetch("/api/equipment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(equipmentPayload(equipmentForm)),
    });

    await parseEnvelope<EquipmentRecord>(response, "Не удалось создать карточку оборудования.");
    setEquipmentForm(defaultEquipmentForm(session));
    await loadRegistries();
    if (!keepOpen) {
      setCreateDialogOpen(false);
    }
    showSuccessToast("Техническое оборудование создано и появилось в учете.", "equipment-create-success");
  }

  async function createDiagnosticEquipment({ keepOpen = false }: { keepOpen?: boolean } = {}) {
    const response = await fetch("/api/equipment/measuring-instruments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        measuringInstrumentPayload({
          ...measuringInstrumentForm,
          placementKind: measuringInstrumentForm.equipmentId ? "built_in" : "standalone",
          standardIds: [],
        }),
      ),
    });

    const created = await parseEnvelope<MeasuringInstrumentRecord>(
      response,
      "Не удалось создать диагностическое оборудование.",
    );

    const createdStandards: StandardRecord[] = [];
    for (const draft of diagnosticStandardDrafts) {
      const standardResponse = await fetch(`/api/equipment/measuring-instruments/${created.id}/standards`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(diagnosticStandardPayload(draft, created.id, created.unit.id, session)),
      });

      createdStandards.push(
        await parseEnvelope<StandardRecord>(standardResponse, "Не удалось создать эталон или меру."),
      );
    }

    setMeasuringInstrumentForm(defaultMeasuringInstrumentForm(session));
    setDiagnosticStandardDrafts([]);
    await loadRegistries();
    setSelectedMeasuringInstrumentId(created.id);
    if (!keepOpen) {
      setCreateDialogOpen(false);
    }
    showSuccessToast(
      createdStandards.length
        ? "Диагностическое оборудование создано с комплектом эталонов."
        : "Диагностическое оборудование создано без эталонов.",
      "equipment-mi-create-success",
    );
  }

  function openEquipmentEditor(record: EquipmentRecord) {
    setEditDialog({
      kind: "equipment",
      recordId: record.id,
      recordLabel: record.fullName,
      form: equipmentFormFromRecord(record),
    });
  }

  function openMeasuringInstrumentEditor(record: MeasuringInstrumentRecord) {
    setEditDialog({
      kind: "measuringInstrument",
      recordId: record.id,
      recordLabel: record.name,
      form: measuringInstrumentFormFromRecord(record),
      standards: record.standards,
      standardDrafts: [],
      removedStandardIds: [],
    });
  }

  async function updateEditedRecord() {
    if (!editDialog) {
      return;
    }

    if (editDialog.kind === "equipment") {
      const response = await fetch(`/api/equipment/${editDialog.recordId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(equipmentPayload(editDialog.form)),
      });
      await parseEnvelope<EquipmentRecord>(response, "Не удалось обновить оборудование.");
      await loadRegistries();
      setEditDialog(null);
      showSuccessToast("Оборудование обновлено.", "equipment-update-success");
      return;
    }

    if (editDialog.kind === "measuringInstrument") {
      const response = await fetch(`/api/equipment/measuring-instruments/${editDialog.recordId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(measuringInstrumentPayload(editDialog.form)),
      });
      const updated = await parseEnvelope<MeasuringInstrumentRecord>(
        response,
        "Не удалось обновить диагностическое оборудование.",
      );
      for (const draft of editDialog.standardDrafts) {
        const standardResponse = await fetch(`/api/equipment/measuring-instruments/${updated.id}/standards`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(diagnosticStandardPayload(draft, updated.id, updated.unit.id, session)),
        });
        await parseEnvelope<StandardRecord>(standardResponse, "Не удалось создать эталон или меру.");
      }
      for (const standardId of editDialog.removedStandardIds) {
        const deleteResponse = await fetch(`/api/equipment/measuring-instruments/${updated.id}/standards/${standardId}`, {
          method: "DELETE",
        });
        await parseEnvelope<{ id: string }>(deleteResponse, "Не удалось удалить эталон или меру.");
      }
      await loadRegistries();
      setSelectedMeasuringInstrumentId(updated.id);
      setEditDialog(null);
      showSuccessToast("Диагностическое оборудование обновлено.", "equipment-mi-update-success");
      return;
    }

  }

  async function archiveEquipment(id: string) {
    const response = await fetch(`/api/equipment/${id}/archive`, {
      method: "POST",
    });
    await parseEnvelope<EquipmentRecord>(response, "Не удалось архивировать оборудование.");
    await loadRegistries();
    showSuccessToast(
      "Оборудование переведено в архив и исключено из активного реестра.",
      "equipment-archive-success",
    );
  }

  async function archiveMeasuringInstrument(id: string) {
    const response = await fetch(`/api/equipment/measuring-instruments/${id}/archive`, {
      method: "POST",
    });
    await parseEnvelope<MeasuringInstrumentRecord>(response, "Не удалось архивировать диагностическое оборудование.");
    await loadRegistries();
    if (selectedMeasuringInstrumentId === id) {
      await loadMeasuringInstrumentJournals(id);
    }
    showSuccessToast(
      "Диагностическое оборудование переведено в архив и убрано из активного списка.",
      "equipment-mi-archive-success",
    );
  }

  async function createMeasuringInstrumentJournal() {
    if (!selectedMeasuringInstrumentId) {
      throw new Error("Сначала выберите оборудование для журнала.");
    }

    const response = await fetch(`/api/equipment/measuring-instruments/${selectedMeasuringInstrumentId}/journals`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        operationType: measuringInstrumentJournalForm.operationType,
        operationDate: measuringInstrumentJournalForm.operationDate,
        documentNumber: measuringInstrumentJournalForm.documentNumber,
        validUntil: optionalString(measuringInstrumentJournalForm.validUntil),
        executorOrganization: measuringInstrumentJournalForm.executorOrganization,
        attachmentUrl: optionalString(measuringInstrumentJournalForm.attachmentUrl),
        comment: optionalString(measuringInstrumentJournalForm.comment),
      }),
    });

    await parseEnvelope<JournalRecord>(response, "Не удалось добавить запись в журнал оборудования.");
    setMeasuringInstrumentJournalForm(defaultJournalForm());
    await loadRegistries();
    await loadMeasuringInstrumentJournals(selectedMeasuringInstrumentId);
    showSuccessToast(
      "Запись журнала сохранена. Производный статус и ближайшая дата пересчитаны.",
      "equipment-mi-journal-create-success",
    );
  }

  function runMutation(task: () => Promise<void>, fallbackMessage: string, dedupeKey: string) {
    setMutationInFlight(true);
    startTransition(() => {
      void task()
        .catch((error) => {
          showErrorToast(fallbackMessage, error, dedupeKey);
        })
        .finally(() => {
          setMutationInFlight(false);
        });
    });
  }

  function requestArchive(task: () => Promise<void>, fallbackMessage: string, recordLabel: string, dedupeKey: string) {
    setArchiveConfirmation({ dedupeKey, fallbackMessage, recordLabel, task });
  }

  function submitEquipmentCreate(keepOpen = false) {
    runMutation(
      () =>
        equipmentFormKind === "technical"
          ? createEquipment({ keepOpen })
          : createDiagnosticEquipment({ keepOpen }),
      equipmentFormKind === "technical"
        ? "Не удалось создать техническое оборудование."
        : "Не удалось создать диагностическое оборудование.",
      equipmentFormKind === "technical" ? "equipment-create-error" : "equipment-diagnostic-create-error",
    );
  }

  function confirmArchive() {
    if (!archiveConfirmation) {
      return;
    }

    const confirmation = archiveConfirmation;
    setArchiveConfirmation(null);
    runMutation(confirmation.task, confirmation.fallbackMessage, confirmation.dedupeKey);
  }

  function updateDiagnosticStandardDraft(localId: string, patch: Partial<DiagnosticStandardDraft>) {
    setDiagnosticStandardDrafts((current) =>
      current.map((draft) => (draft.localId === localId ? { ...draft, ...patch } : draft)),
    );
  }

  function removeDiagnosticStandardDraft(localId: string) {
    setDiagnosticStandardDrafts((current) => current.filter((draft) => draft.localId !== localId));
  }

  function renderTechnicalEquipmentFields() {
    return (
      <>
        <div className="grid gap-4 md:grid-cols-2">
          <SelectField
            label="Юнит владения"
            name="equipment-unit-id"
            onChange={(event) => setEquipmentForm((current) => ({ ...current, unitId: event.target.value }))}
            options={session.units.map((unit) => ({ label: unit.name, value: unit.id }))}
            value={equipmentForm.unitId}
          />
          <SelectField
            label="Статус оборудования"
            name="equipment-status"
            onChange={(event) =>
              setEquipmentForm((current) => ({
                ...current,
                status: event.target.value as RegistryStatus,
              }))
            }
            options={registryStatusOptions}
            value={equipmentForm.status}
          />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <InputField
            autoComplete={defaultAutoComplete("text")}
            label="Производитель"
            name="equipment-manufacturer"
            onChange={(event) => setEquipmentForm((current) => ({ ...current, manufacturer: event.target.value }))}
            value={equipmentForm.manufacturer}
          />
          <InputField
            autoComplete={defaultAutoComplete("text")}
            label="Класс / тип"
            name="equipment-classification"
            onChange={(event) => setEquipmentForm((current) => ({ ...current, classification: event.target.value }))}
            value={equipmentForm.classification}
          />
          <InputField
            autoComplete={defaultAutoComplete("text")}
            label="Модель"
            name="equipment-model"
            onChange={(event) => setEquipmentForm((current) => ({ ...current, model: event.target.value }))}
            value={equipmentForm.model}
          />
          <InputField
            autoComplete={defaultAutoComplete("number")}
            inputMode="numeric"
            label="Год выпуска"
            name="equipment-manufacture-year"
            onChange={(event) => setEquipmentForm((current) => ({ ...current, manufactureYear: event.target.value }))}
            type="number"
            value={equipmentForm.manufactureYear}
          />
          <InputField
            autoComplete={defaultAutoComplete("text")}
            label="Полное наименование"
            name="equipment-full-name"
            onChange={(event) => setEquipmentForm((current) => ({ ...current, fullName: event.target.value }))}
            value={equipmentForm.fullName}
          />
          <InputField
            autoComplete={defaultAutoComplete("text")}
            label="Заводской номер"
            name="equipment-factory-number"
            onChange={(event) => setEquipmentForm((current) => ({ ...current, factoryNumber: event.target.value }))}
            spellCheck={false}
            translate="no"
            value={equipmentForm.factoryNumber}
          />
          <InputField
            autoComplete={defaultAutoComplete("text")}
            label="Инвентарный номер"
            name="equipment-inventory-number"
            onChange={(event) => setEquipmentForm((current) => ({ ...current, inventoryNumber: event.target.value }))}
            spellCheck={false}
            translate="no"
            value={equipmentForm.inventoryNumber}
          />
          <InputField
            autoComplete={defaultAutoComplete("url")}
            label="Документ / ссылка"
            name="equipment-document-url"
            onChange={(event) => setEquipmentForm((current) => ({ ...current, documentUrl: event.target.value }))}
            type="url"
            value={equipmentForm.documentUrl}
          />
        </div>
        <TextareaField
          label="Комментарий"
          name="equipment-comment"
          onChange={(event) => setEquipmentForm((current) => ({ ...current, comment: event.target.value }))}
          value={equipmentForm.comment}
        />
      </>
    );
  }

  function renderDiagnosticEquipmentFields() {
    return (
      <>
        <div className="grid gap-4 md:grid-cols-2">
          <SelectField
            label="Юнит"
            name="measuring-instrument-unit-id"
            onChange={(event) =>
              setMeasuringInstrumentForm((current) => ({ ...current, unitId: event.target.value }))
            }
            options={session.units.map((unit) => ({ label: unit.name, value: unit.id }))}
            value={measuringInstrumentForm.unitId}
          />
          <InputField
            autoComplete={defaultAutoComplete("text")}
            label="Наименование"
            name="measuring-instrument-name"
            onChange={(event) => setMeasuringInstrumentForm((current) => ({ ...current, name: event.target.value }))}
            value={measuringInstrumentForm.name}
          />
          <InputField
            autoComplete={defaultAutoComplete("text")}
            label="Тип / класс"
            name="measuring-instrument-type"
            onChange={(event) =>
              setMeasuringInstrumentForm((current) => ({ ...current, instrumentType: event.target.value }))
            }
            value={measuringInstrumentForm.instrumentType}
          />
          <InputField
            autoComplete={defaultAutoComplete("text")}
            label="Модель"
            name="measuring-instrument-model"
            onChange={(event) => setMeasuringInstrumentForm((current) => ({ ...current, model: event.target.value }))}
            value={measuringInstrumentForm.model}
          />
          <InputField
            autoComplete={defaultAutoComplete("text")}
            label="ФИФ"
            name="measuring-instrument-registration-number"
            onChange={(event) =>
              setMeasuringInstrumentForm((current) => ({ ...current, registrationNumber: event.target.value }))
            }
            spellCheck={false}
            translate="no"
            value={measuringInstrumentForm.registrationNumber}
          />
          <InputField
            autoComplete={defaultAutoComplete("text")}
            label="Серийный номер"
            name="measuring-instrument-serial-number"
            onChange={(event) =>
              setMeasuringInstrumentForm((current) => ({ ...current, serialNumber: event.target.value }))
            }
            spellCheck={false}
            translate="no"
            value={measuringInstrumentForm.serialNumber}
          />
          <InputField
            autoComplete={defaultAutoComplete("url")}
            label="Документ / ссылка"
            name="measuring-instrument-document-url"
            onChange={(event) =>
              setMeasuringInstrumentForm((current) => ({ ...current, documentUrl: event.target.value }))
            }
            type="url"
            value={measuringInstrumentForm.documentUrl}
          />
          <SelectField
            clearable
            label="Связь с техническим оборудованием"
            name="measuring-instrument-equipment-id"
            onChange={(event) =>
              setMeasuringInstrumentForm((current) => ({
                ...current,
                equipmentId: event.target.value,
                placementKind: event.target.value ? "built_in" : "standalone",
              }))
            }
            options={equipmentRecords
              .filter((item) => !item.archivedAt && item.unit.id === measuringInstrumentForm.unitId)
              .map((item) => ({ label: item.fullName, value: item.id }))}
            placeholder="Без связи…"
            value={measuringInstrumentForm.equipmentId}
          />
        </div>
        <TextareaField
          label="Комментарий"
          name="measuring-instrument-comment"
          onChange={(event) => setMeasuringInstrumentForm((current) => ({ ...current, comment: event.target.value }))}
          value={measuringInstrumentForm.comment}
        />
        <div className="grid gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-sm font-medium text-foreground">Эталоны</span>
            <Button
              leftIcon={<Plus className="size-4" />}
              onClick={() => setDiagnosticStandardDrafts((current) => [...current, createDiagnosticStandardDraft()])}
              size="sm"
              type="button"
              variant="secondary"
            >
              Добавить меру
            </Button>
          </div>
          {diagnosticStandardDrafts.length ? (
            <div className="grid gap-3">
              {diagnosticStandardDrafts.map((draft, index) => (
                <div className="rounded-[var(--radius-lg)] border border-border bg-muted/40 p-4" key={draft.localId}>
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-foreground">Мера {index + 1}</p>
                    <Button
                      aria-label={`Удалить меру ${index + 1}`}
                      leftIcon={<Trash2 className="size-4" />}
                      onClick={() => removeDiagnosticStandardDraft(draft.localId)}
                      size="sm"
                      type="button"
                      variant="ghost"
                    >
                      Удалить
                    </Button>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <InputField
                      autoComplete={defaultAutoComplete("text")}
                      label="Тип меры"
                      name={`diagnostic-standard-type-${draft.localId}`}
                      onChange={(event) => updateDiagnosticStandardDraft(draft.localId, { standardType: event.target.value })}
                      value={draft.standardType}
                    />
                    <InputField
                      autoComplete={defaultAutoComplete("text")}
                      label="Модель"
                      name={`diagnostic-standard-model-${draft.localId}`}
                      onChange={(event) => updateDiagnosticStandardDraft(draft.localId, { model: event.target.value })}
                      value={draft.model}
                    />
                    <InputField
                      autoComplete={defaultAutoComplete("text")}
                      label="Идентификатор"
                      name={`diagnostic-standard-identifier-${draft.localId}`}
                      onChange={(event) => updateDiagnosticStandardDraft(draft.localId, { identifier: event.target.value })}
                      spellCheck={false}
                      translate="no"
                      value={draft.identifier}
                    />
                    <InputField
                      autoComplete={defaultAutoComplete("text")}
                      label="Серийный номер"
                      name={`diagnostic-standard-serial-${draft.localId}`}
                      onChange={(event) => updateDiagnosticStandardDraft(draft.localId, { serialNumber: event.target.value })}
                      spellCheck={false}
                      translate="no"
                      value={draft.serialNumber}
                    />
                    <InputField
                      autoComplete={defaultAutoComplete("url")}
                      label="Документ / ссылка"
                      name={`diagnostic-standard-document-${draft.localId}`}
                      onChange={(event) => updateDiagnosticStandardDraft(draft.localId, { documentUrl: event.target.value })}
                      type="url"
                      value={draft.documentUrl}
                    />
                  </div>
                  <TextareaField
                    className="mt-4"
                    label="Метрологические характеристики"
                    name={`diagnostic-standard-characteristics-${draft.localId}`}
                    onChange={(event) =>
                      updateDiagnosticStandardDraft(draft.localId, {
                        metrologicalCharacteristics: event.target.value,
                      })
                    }
                    value={draft.metrologicalCharacteristics}
                  />
                  <TextareaField
                    className="mt-4"
                    label="Комментарий"
                    name={`diagnostic-standard-comment-${draft.localId}`}
                    onChange={(event) => updateDiagnosticStandardDraft(draft.localId, { comment: event.target.value })}
                    value={draft.comment}
                  />
                </div>
              ))}
            </div>
          ) : (
            <EmptyState detail="Комплект можно оставить пустым." title="Эталоны и меры не добавлены" />
          )}
        </div>
      </>
    );
  }

  function renderEquipmentCreateDialog() {
    if (!canManageRegistry) {
      return null;
    }

    const canSubmit =
      equipmentFormKind === "technical"
        ? isEquipmentFormReady(equipmentForm)
        : isMeasuringInstrumentFormReady(measuringInstrumentForm) && areDiagnosticStandardDraftsReady(diagnosticStandardDrafts);

    return (
      <Dialog
        bodyClassName="grid gap-5"
        dismissible={!isMutating}
        footer={
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              {!canSubmit ? "Заполните обязательные поля перед созданием." : "Карточка появится в реестре после сохранения."}
            </p>
            <div className="flex flex-wrap gap-3">
              <Button disabled={isMutating} onClick={() => setCreateDialogOpen(false)} type="button" variant="secondary">
                Отмена
              </Button>
              <Button
                disabled={!canSubmit || isMutating}
                onClick={() => submitEquipmentCreate(true)}
                type="button"
                variant="secondary"
              >
                Создать и добавить ещё
              </Button>
              <Button
                disabled={!canSubmit}
                leftIcon={<Plus className="size-4" />}
                loading={isMutating}
                onClick={() => submitEquipmentCreate(false)}
                type="button"
              >
                Создать оборудование
              </Button>
            </div>
          </div>
        }
        headerIcon={<Wrench aria-hidden="true" className="size-4" />}
        headerVariant="muted"
        onOpenChange={(open) => {
          if (!open && !isMutating) {
            setCreateDialogOpen(false);
          }
        }}
        open={createDialogOpen}
        showClose={!isMutating}
        size="xl"
        title="Новое оборудование"
      >
        <SelectField
          label="Тип оборудования"
          name="equipment-form-kind"
          onChange={(event) => setEquipmentFormKind(event.target.value as EquipmentFormKind)}
          options={equipmentFormKindOptions}
          value={equipmentFormKind}
        />
        {equipmentFormKind === "technical" ? renderTechnicalEquipmentFields() : renderDiagnosticEquipmentFields()}
      </Dialog>
    );
  }

  function renderReadonlyJournalCard(journalTimeline: ReactNode) {
    if (!selectedMeasuringInstrument) {
      return null;
    }

    return (
      <Card className="gap-4" padding="md" tone="muted">
        <div className="min-w-0 space-y-1">
          <h3 className="break-words text-lg font-semibold text-foreground">{selectedMeasuringInstrument.name}</h3>
          <p className="text-sm text-muted-foreground">
            Текущий статус: <span className="font-medium text-foreground">{statusLabelMap[selectedMeasuringInstrument.status]}</span>
            {selectedMeasuringInstrument.nextDueDate
              ? ` • действует до ${formatDate(selectedMeasuringInstrument.nextDueDate)}`
              : " • срок пока не рассчитан"}
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {fieldDetail("Тип / класс", selectedMeasuringInstrument.instrumentType)}
          {fieldDetail("Модель", selectedMeasuringInstrument.model)}
          {fieldDetail("ФИФ", selectedMeasuringInstrument.registrationNumber, true)}
          {fieldDetail("Серийный номер", selectedMeasuringInstrument.serialNumber, true)}
          {fieldDetail("Юнит", selectedMeasuringInstrument.unit.name)}
          {fieldDetail("Действует до", selectedMeasuringInstrument.nextDueDate ? formatDate(selectedMeasuringInstrument.nextDueDate) : undefined)}
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-foreground">Хронология операций</h3>
        </div>
        {journalTimeline}
      </Card>
    );
  }

  function renderTechnicalEquipmentCard(item: EquipmentRecord) {
    const secondarySections: EquipmentPassportSection[] = [];

    if (item.documentUrl || item.comment) {
      secondarySections.push({
        id: "technical-evidence",
        title: "Документ и комментарий",
        icon: <FileText aria-hidden="true" className="size-4" />,
        children: (
          <dl className="grid gap-3">
            {item.documentUrl ? passportDetail("Документ", item.documentUrl, true) : null}
            {item.comment ? passportDetail("Комментарий", item.comment) : null}
          </dl>
        ),
      });
    }

    return (
      <EquipmentPassportCard
        actions={
          canManageRegistry && !item.archivedAt ? (
            <>
              <Button
                aria-label={`Редактировать оборудование ${item.fullName}`}
                leftIcon={<Pencil className="size-4" />}
                onClick={() => openEquipmentEditor(item)}
                size="sm"
                type="button"
                variant="secondary"
              >
                Редактировать
              </Button>
              <Button
                aria-label={`Архивировать оборудование ${item.fullName}`}
                leftIcon={<Archive className="size-4" />}
                loading={isMutating}
                onClick={() =>
                  requestArchive(
                    () => archiveEquipment(item.id),
                    "Не удалось архивировать оборудование.",
                    `оборудование «${item.fullName}»`,
                    "equipment-archive-error",
                  )
                }
                size="sm"
                type="button"
                variant="ghost"
              >
                Архивировать
              </Button>
            </>
          ) : null
        }
        badges={
          <>
            <Badge tone={statusToneMap[item.status]}>{statusLabelMap[item.status]}</Badge>
            {item.archivedAt ? <Badge tone="neutral">В архиве</Badge> : null}
          </>
        }
        icon={<Wrench aria-hidden="true" className="size-5" />}
        intrinsicClassName="[contain-intrinsic-size:1px_420px]"
        key={`technical:${item.id}`}
        label="Техническое"
        primarySections={[
          {
            id: "technical-requisites",
            title: "Реквизиты записи",
            icon: <Wrench aria-hidden="true" className="size-4" />,
            children: (
              <dl className="grid gap-3 sm:grid-cols-2">
                {passportDetail("Заводской номер", item.factoryNumber, true)}
                {passportDetail("Инвентарный номер", item.inventoryNumber, true)}
                {passportDetail("Производитель", item.manufacturer)}
                {passportDetail("Классификация", item.classification)}
                {passportDetail("Модель", item.model)}
                {passportDetail("Год выпуска", item.manufactureYear)}
                {item.archivedAt ? passportDetail("Архивирован", formatTimestamp(item.archivedAt)) : null}
              </dl>
            ),
          },
          {
            id: "technical-scope",
            title: "Область учета",
            icon: <MapPin aria-hidden="true" className="size-4" />,
            children: (
              <p className="mt-2 break-words text-sm leading-6 text-foreground">
                {[item.unit.divisionName, item.unit.name].filter(Boolean).join(", ")}
              </p>
            ),
          },
        ]}
        secondarySections={secondarySections}
        subtitle={[item.manufacturer, item.classification, item.model].filter(Boolean).join(" • ")}
        title={item.fullName}
      />
    );
  }

  function renderDiagnosticEquipmentCard(item: MeasuringInstrumentRecord) {
    const secondarySections: EquipmentPassportSection[] = [
      {
        id: "diagnostic-journal",
        title: "Журнал",
        icon: <ListChecks aria-hidden="true" className="size-4" />,
        children: (
          <>
            {item.latestJournal ? (
              <p className="break-words text-sm leading-6 text-foreground">
                Последняя запись:{" "}
                <span className="font-medium text-foreground">{formatOperationType(item.latestJournal.operationType)}</span> от{" "}
                <span className="font-medium text-foreground">{formatDate(item.latestJournal.operationDate)}</span>, документ{" "}
                <span className="font-medium text-foreground" translate="no">
                  {item.latestJournal.documentNumber}
                </span>
                .
              </p>
            ) : (
              <p className="break-words text-sm leading-6 text-muted-foreground">
                После первой операции текущий статус и срок рассчитаются автоматически.
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              <Badge size="sm" tone="neutral">
                {item.journalCount ? `${item.journalCount} записей` : "журнал пуст"}
              </Badge>
              <Badge size="sm" tone="neutral">
                {item.nextDueDate ? `Действует до ${formatDate(item.nextDueDate)}` : "срок не рассчитан"}
              </Badge>
            </div>
          </>
        ),
      },
    ];

    if (item.documentUrl) {
      secondarySections.push({
        id: "diagnostic-document",
        title: "Паспорт СИ",
        icon: <FileText aria-hidden="true" className="size-4" />,
        children: (
          <p className="mt-2 break-all font-mono text-sm leading-6 text-foreground" translate="no">
            {item.documentUrl}
          </p>
        ),
      });
    }

    secondarySections.push({
      id: "diagnostic-standards",
      title: "Эталоны",
      icon: <Network aria-hidden="true" className="size-4" />,
      trailing: item.standards.length,
      children: (
        <div className="min-w-0 space-y-3">
          {item.standards.length ? (
            <div className="grid gap-2">
              {item.standards.map((standard) => (
                <div
                  className="grid min-w-0 gap-2 rounded-[var(--radius-md)] border border-border bg-card px-3 py-2 sm:grid-cols-[minmax(0,1fr)_auto]"
                  key={`${item.id}:${standard.id}`}
                >
                  <div className="min-w-0">
                    <p className="break-words text-sm font-semibold leading-5 text-foreground">
                      <span translate="no">
                        {standard.standardType} • {standard.identifier}
                      </span>
                    </p>
                    <p className="mt-1 break-words text-sm leading-5 text-muted-foreground">
                      {standard.model} • {standard.scopeLabel}
                    </p>
                  </div>
                  {standard.status === "active" ? null : (
                    <Badge className="w-fit" size="sm" tone={statusToneMap[standard.status]}>
                      {statusLabelMap[standard.status]}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <EmptyState detail="Комплект эталонов для этой карточки не задан." title="Эталоны не привязаны" />
          )}
        </div>
      ),
    });

    return (
      <EquipmentPassportCard
        actions={
          canManageRegistry && !item.archivedAt ? (
            <>
              <Button
                aria-label={`Редактировать диагностическое оборудование ${item.name}`}
                leftIcon={<Pencil className="size-4" />}
                onClick={() => openMeasuringInstrumentEditor(item)}
                size="sm"
                type="button"
                variant="secondary"
              >
                Редактировать
              </Button>
              <Button
                aria-label={`Архивировать диагностическое оборудование ${item.name}`}
                leftIcon={<Archive className="size-4" />}
                loading={isMutating}
                onClick={() =>
                  requestArchive(
                    () => archiveMeasuringInstrument(item.id),
                    "Не удалось архивировать диагностическое оборудование.",
                    `диагностическое оборудование «${item.name}»`,
                    "equipment-mi-archive-error",
                  )
                }
                size="sm"
                type="button"
                variant="ghost"
              >
                Архивировать
              </Button>
            </>
          ) : null
        }
        badges={
          <>
            <Badge tone={statusToneMap[item.status]}>{statusLabelMap[item.status]}</Badge>
            {item.archivedAt ? <Badge tone="neutral">В архиве</Badge> : null}
          </>
        }
        icon={<Gauge aria-hidden="true" className="size-5" />}
        intrinsicClassName="[contain-intrinsic-size:1px_520px]"
        key={`diagnostic:${item.id}`}
        label="Диагностическое"
        primarySections={[
          {
            id: "diagnostic-requisites",
            title: "Реквизиты записи",
            icon: <Wrench aria-hidden="true" className="size-4" />,
            children: (
              <dl className="grid gap-3 sm:grid-cols-2">
                {passportDetail("ФИФ", item.registrationNumber, true)}
                {passportDetail("Серийный номер", item.serialNumber, true)}
                {passportDetail("Тип", item.instrumentType)}
                {passportDetail("Модель", item.model)}
                {passportDetail("Юнит", item.unit.name)}
                {passportDetail("Связанное оборудование", item.equipment?.fullName)}
                {item.archivedAt ? passportDetail("Архивирован", formatTimestamp(item.archivedAt)) : null}
              </dl>
            ),
          },
          {
            id: "diagnostic-scope",
            title: "Область учета",
            icon: <MapPin aria-hidden="true" className="size-4" />,
            children: (
              <p className="mt-2 break-words text-sm leading-6 text-foreground">
                {[item.unit.divisionName, item.unit.name].filter(Boolean).join(", ")}
              </p>
            ),
          },
        ]}
        secondarySections={secondarySections}
        subtitle={`${item.instrumentType} • ${item.model}`}
        title={item.name}
      />
    );
  }

  function renderEquipmentListCard() {
    return (
      <IslandCard
        action={
          canManageRegistry ? (
            <button
              aria-label="Добавить оборудование"
              onClick={() => setCreateDialogOpen(true)}
              title="Добавить оборудование"
              type="button"
            >
              <Plus aria-hidden="true" className="size-4" />
            </button>
          ) : null
        }
        headingLevel={2}
        icon={<Wrench aria-hidden="true" className="size-4" />}
        metric={unifiedEquipmentCount}
        title="Оборудование в учете"
      >
        {!unifiedEquipmentCount && !loading ? (
          <EmptyState
            action={
              canManageRegistry ? (
                <Button
                  leftIcon={<Plus className="size-4" />}
                  onClick={() => setCreateDialogOpen(true)}
                  size="sm"
                  type="button"
                  variant="secondary"
                >
                  Добавить оборудование
                </Button>
              ) : undefined
            }
            detail="Техническое и диагностическое оборудование еще не зарегистрировано."
            title="Оборудование пока не добавлено"
          />
        ) : null}

        <FormListScrollArea className="grid gap-4">
          {equipmentRecords.map((item) => renderTechnicalEquipmentCard(item))}
          {measuringInstruments.map((item) => renderDiagnosticEquipmentCard(item))}
        </FormListScrollArea>
      </IslandCard>
    );
  }

  function renderUnifiedRegistry() {
    return renderEquipmentListCard();
  }

  function renderUnifiedJournalPair() {
    if (!selectedMeasuringInstrument) {
      return (
        <EmptyState
          detail="Диагностическое оборудование пока не зарегистрировано в текущей области доступа."
          title="Журнал еще не выбран"
        />
      );
    }

    const journalTimeline = loadingMeasuringInstrumentJournals ? (
      <EmptyState detail="История операций оборудования загружается." title="Загрузка журнала" />
    ) : (
      <JournalTimeline
        emptyDetail="Для выбранного оборудования еще нет операций. После первой записи статус и срок станут производными."
        emptyTitle="Журнал пока пуст"
        journals={measuringInstrumentJournals}
      />
    );

    if (!canManageRegistry) {
      return renderReadonlyJournalCard(journalTimeline);
    }

    const hasActiveJournalForm = !selectedMeasuringInstrument.archivedAt;
    const journalFormCard = (
      <Card className={hasActiveJournalForm ? "h-full min-h-0 gap-4" : "gap-4"} padding="md" tone="muted">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-foreground">{selectedMeasuringInstrument.name}</h3>
          <p className="text-sm text-muted-foreground">
            Текущий статус: <span className="font-medium text-foreground">{statusLabelMap[selectedMeasuringInstrument.status]}</span>
            {selectedMeasuringInstrument.nextDueDate
              ? ` • действует до ${formatDate(selectedMeasuringInstrument.nextDueDate)}`
              : " • срок пока не рассчитан"}
          </p>
        </div>
        {hasActiveJournalForm ? (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              <SelectField
                label="Тип операции"
                name="equipment-journal-operation-type"
                onChange={(event) =>
                  setMeasuringInstrumentJournalForm((current) => ({
                    ...current,
                    operationType: event.target.value as JournalRecord["operationType"],
                  }))
                }
                options={journalOperationOptions}
                value={measuringInstrumentJournalForm.operationType}
              />
              <InputField
                autoComplete={defaultAutoComplete("text")}
                label="Дата операции"
                name="equipment-journal-operation-date"
                onChange={(event) =>
                  setMeasuringInstrumentJournalForm((current) => ({ ...current, operationDate: event.target.value }))
                }
                type="date"
                value={measuringInstrumentJournalForm.operationDate}
              />
              <InputField
                autoComplete={defaultAutoComplete("text")}
                label="Документ"
                name="equipment-journal-document-number"
                onChange={(event) =>
                  setMeasuringInstrumentJournalForm((current) => ({ ...current, documentNumber: event.target.value }))
                }
                spellCheck={false}
                translate="no"
                value={measuringInstrumentJournalForm.documentNumber}
              />
              <InputField
                autoComplete={defaultAutoComplete("text")}
                label="Действует до"
                name="equipment-journal-valid-until"
                onChange={(event) =>
                  setMeasuringInstrumentJournalForm((current) => ({ ...current, validUntil: event.target.value }))
                }
                type="date"
                value={measuringInstrumentJournalForm.validUntil}
              />
              <InputField
                autoComplete={defaultAutoComplete("text")}
                label="Организация-исполнитель"
                name="equipment-journal-executor"
                onChange={(event) =>
                  setMeasuringInstrumentJournalForm((current) => ({ ...current, executorOrganization: event.target.value }))
                }
                value={measuringInstrumentJournalForm.executorOrganization}
              />
              <InputField
                autoComplete={defaultAutoComplete("url")}
                label="Вложение / ссылка"
                name="equipment-journal-attachment"
                onChange={(event) =>
                  setMeasuringInstrumentJournalForm((current) => ({ ...current, attachmentUrl: event.target.value }))
                }
                type="url"
                value={measuringInstrumentJournalForm.attachmentUrl}
              />
            </div>
            <TextareaField
              label="Комментарий"
              name="equipment-journal-comment"
              onChange={(event) =>
                setMeasuringInstrumentJournalForm((current) => ({ ...current, comment: event.target.value }))
              }
              value={measuringInstrumentJournalForm.comment}
            />
            <div className="flex flex-wrap gap-3">
              <Button
                loading={isMutating}
                onClick={() =>
                  runMutation(
                    createMeasuringInstrumentJournal,
                    "Не удалось добавить запись в журнал оборудования.",
                    "equipment-journal-create-error",
                  )
                }
                type="button"
              >
                Добавить запись журнала
              </Button>
              <Button
                aria-label="Архивировать выбранное оборудование"
                leftIcon={<Archive className="size-4" />}
                loading={isMutating}
                onClick={() =>
                  requestArchive(
                    () => archiveMeasuringInstrument(selectedMeasuringInstrument.id),
                    "Не удалось архивировать диагностическое оборудование.",
                    `диагностическое оборудование «${selectedMeasuringInstrument.name}»`,
                    "equipment-selected-archive-error",
                  )
                }
                size="sm"
                type="button"
                variant="ghost"
              >
                Архивировать
              </Button>
            </div>
          </>
        ) : (
          <EmptyState
            detail={
              selectedMeasuringInstrument.archivedAt
                ? "Архивированная карточка остается доступной для истории, но новые операции в нее не добавляются."
                : "В текущей области доступа журнал можно только читать."
            }
            title="Редактирование скрыто"
          />
        )}
      </Card>
    );

    const journalTimelineCard = (
      <Card className={hasActiveJournalForm ? "h-full min-h-0 gap-4 overflow-hidden" : "gap-4"} padding="md" tone="muted">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-foreground">Хронология операций</h3>
        </div>
        {hasActiveJournalForm ? (
          <FormListScrollArea scrollMode="contained">{journalTimeline}</FormListScrollArea>
        ) : (
          journalTimeline
        )}
      </Card>
    );

    return hasActiveJournalForm ? (
      <FormListSplitLayout form={journalFormCard} list={journalTimelineCard} />
    ) : (
      <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        {journalFormCard}
        {journalTimelineCard}
      </div>
    );
  }

  function renderUnifiedJournal() {
    return (
      <IslandCard headingLevel={2} icon={<Cable aria-hidden="true" className="size-4" />} title="Журнал операций по оборудованию">
        <div className="flex flex-wrap justify-end gap-3">
          <div className="min-w-64">
            <SelectField
              label="Оборудование"
              name="selected-equipment-journal-record"
              onChange={(event) => setSelectedMeasuringInstrumentId(event.target.value)}
              options={measuringInstruments.map((item) => ({
                label: `${item.name} • ${item.registrationNumber}`,
                value: item.id,
              }))}
              placeholder="Выберите запись…"
              value={selectedMeasuringInstrumentId}
            />
          </div>
        </div>

        {renderUnifiedJournalPair()}
      </IslandCard>
    );
  }

  return (
    <>
      {renderEquipmentCreateDialog()}
      <EditRegistryDialog
        editor={editDialog}
        loading={isMutating}
        onCancel={() => setEditDialog(null)}
        onChange={setEditDialog}
        onSubmit={() => runMutation(updateEditedRecord, "Не удалось сохранить изменения.", "equipment-edit-error")}
        session={session}
      />
      <ArchiveConfirmDialog
        confirmation={archiveConfirmation}
        loading={isMutating}
        onCancel={() => setArchiveConfirmation(null)}
        onConfirm={confirmArchive}
      />

      <div
        aria-hidden={createDialogOpen || archiveConfirmation || editDialog ? true : undefined}
        className="grid min-w-0 gap-4"
        inert={createDialogOpen || archiveConfirmation || editDialog ? true : undefined}
      >
        {loadError ? (
          <div
            aria-live="polite"
            className="rounded-[var(--radius-xl)] border border-destructive/20 bg-destructive-soft px-4 py-3 text-sm text-destructive"
          >
            {loadError}
          </div>
        ) : null}

        <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
          <Tabs<EquipmentWorkspaceTab>
            activeKey={activeWorkspaceTab}
            ariaLabel="Разделы оборудования"
            getPanelId={getEquipmentWorkspacePanelId}
            idPrefix="equipment-workspace-tabs"
            items={equipmentWorkspaceTabs}
            onChange={setActiveWorkspaceTab}
          />
          <Button
            aria-pressed={showArchived}
            className="h-[52px] w-[175px] shrink-0 justify-center text-center"
            leftIcon={<Archive className="size-4" />}
            onClick={handleArchiveVisibilityChange}
            type="button"
            variant="secondary"
          >
            {showArchived ? "Архив показан" : "Показать архив"}
          </Button>
        </div>

        {loading ? (
          <EmptyState
            detail="Загружаем записи оборудования в текущей области."
            title="Загружаем учет…"
          />
        ) : null}

        {!loading ? (
          <div
            aria-labelledby={`equipment-workspace-tabs-${activeWorkspaceTab}`}
            className="min-w-0"
            id={getEquipmentWorkspacePanelId(activeWorkspaceTab)}
            role="tabpanel"
            tabIndex={0}
          >
            {activeWorkspaceTab === "equipment" ? renderUnifiedRegistry() : renderUnifiedJournal()}
          </div>
        ) : null}
      </div>
    </>
  );
}
