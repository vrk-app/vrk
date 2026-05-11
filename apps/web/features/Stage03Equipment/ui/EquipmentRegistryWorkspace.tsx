"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Archive,
  Cable,
  Pencil,
  Ruler,
  Save,
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

type RegistryTab = "equipment" | "mi" | "standards";

type Props = {
  session: SessionSummaryResponse;
  initialTab: RegistryTab;
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
      linkedStandards: LinkedStandardRecord[];
      recordId: string;
      recordLabel: string;
      form: MeasuringInstrumentFormState;
    }
  | {
      kind: "standard";
      recordId: string;
      recordLabel: string;
      form: StandardFormState;
    };

const tabMeta: Array<{
  key: RegistryTab;
  label: string;
  icon: typeof Wrench;
}> = [
  {
    key: "equipment",
    label: "Оборудование",
    icon: Wrench,
  },
  {
    key: "mi",
    label: "Средства измерения",
    icon: Cable,
  },
  {
    key: "standards",
    label: "Эталоны",
    icon: Ruler,
  },
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

function defaultStandardForm(session: SessionSummaryResponse): StandardFormState {
  return {
    ownershipScopeType: session.divisions.length ? "division" : "unit",
    scopeId: session.divisions[0]?.id ?? session.units[0]?.id ?? "",
    ownerLabel: "",
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

function standardFormFromRecord(record: StandardRecord): StandardFormState {
  return {
    ownershipScopeType: record.ownershipScope.scopeType,
    scopeId: record.ownershipScope.scopeId ?? "",
    ownerLabel: record.ownershipScope.label,
    standardType: record.standardType,
    model: record.model,
    identifier: record.identifier,
    serialNumber: record.serialNumber ?? "",
    metrologicalCharacteristics: record.metrologicalCharacteristics,
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

function standardPayload(form: StandardFormState, session: SessionSummaryResponse) {
  return {
    divisionId: form.ownershipScopeType === "division" ? optionalString(form.scopeId) : undefined,
    unitId: form.ownershipScopeType === "unit" ? optionalString(form.scopeId) : undefined,
    ownerLabel:
      form.ownershipScopeType === "organization"
        ? optionalString(form.ownerLabel) ?? session.organization.name
        : optionalString(form.ownerLabel),
    standardType: form.standardType,
    model: form.model,
    identifier: form.identifier,
    serialNumber: optionalString(form.serialNumber),
    metrologicalCharacteristics: form.metrologicalCharacteristics,
    comment: optionalString(form.comment),
    documentUrl: optionalString(form.documentUrl),
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

function isStandardFormReady(form: StandardFormState) {
  return Boolean(
    (form.ownershipScopeType === "organization" || form.scopeId) &&
      form.standardType.trim() &&
      form.model.trim() &&
      form.identifier.trim() &&
      form.metrologicalCharacteristics.trim(),
  );
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

function formatPlacementKind(value: MeasuringInstrumentPlacement) {
  return value === "built_in" ? "Встроенное" : "Отдельное";
}

function formatScopeType(value: StandardRecord["ownershipScope"]["scopeType"] | StandardFormState["ownershipScopeType"]) {
  switch (value) {
    case "organization":
      return "Организация";
    case "division":
      return "Дивизион";
    default:
      return "Юнит";
  }
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

function standardLinkOptions(standards: StandardRecord[], linkedStandards: LinkedStandardRecord[] = []) {
  const seen = new Set<string>();
  const options = standards.map((standard) => {
    seen.add(standard.id);
    return {
      id: standard.id,
      label: `${standard.standardType} • ${standard.identifier}`,
      detail: `${standard.model} • ${standard.ownershipScope.label}`,
    };
  });

  for (const standard of linkedStandards) {
    if (!seen.has(standard.id)) {
      options.push({
        id: standard.id,
        label: `${standard.standardType} • ${standard.identifier}`,
        detail: `${standard.model} • ${standard.scopeLabel}`,
      });
    }
  }

  return options;
}

function measuringInstrumentLinkOptions(measuringInstruments: MeasuringInstrumentRecord[], unitId: string) {
  return measuringInstruments
    .filter((item) => !item.archivedAt && item.unit.id === unitId && item.placementKind === "standalone" && !item.equipment)
    .map((item) => ({
      id: item.id,
      label: `${item.name} • ${item.registrationNumber}`,
      detail: `${item.instrumentType} • ${item.model}`,
    }));
}

function buildEquipmentRoute(tab: RegistryTab, showArchived: boolean) {
  const search = new URLSearchParams();
  if (tab !== "equipment") {
    search.set("tab", tab);
  }
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

function EmptyState({
  title,
  detail,
}: {
  title: string;
  detail: string;
}) {
  return (
    <div className="rounded-[var(--radius-xl)] border border-dashed border-border bg-muted/50 px-5 py-6 text-sm text-muted-foreground">
      <div className="font-medium text-foreground">{title}</div>
      <p className="mt-2 leading-6">{detail}</p>
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
  activeStandards,
  editor,
  loading,
  onCancel,
  onChange,
  onSubmit,
  session,
}: {
  activeStandards: StandardRecord[];
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
      : editor.kind === "measuringInstrument"
        ? "Редактировать средство измерения"
        : "Редактировать эталон";
  const HeaderIcon =
    editor.kind === "equipment" ? Wrench : editor.kind === "measuringInstrument" ? Cable : Ruler;
  const canSubmit =
    editor.kind === "equipment"
      ? isEquipmentFormReady(editor.form)
      : editor.kind === "measuringInstrument"
        ? isMeasuringInstrumentFormReady(editor.form)
        : isStandardFormReady(editor.form);

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

  const updateStandardForm = (patch: Partial<StandardFormState>) => {
    if (editor.kind !== "standard") {
      return;
    }
    onChange({ ...editor, form: { ...editor.form, ...patch } });
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
  ) => {
    const linkedStandardOptions = standardLinkOptions(activeStandards, state.linkedStandards);

    return (
      <div className="grid gap-4">
        <SelectField
          label="Юнит"
          name="edit-measuring-instrument-unit-id"
          onChange={(event) =>
            updateMeasuringInstrumentForm({
              unitId: event.target.value,
            })
          }
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
        </div>
        <label className="grid gap-2.5">
          <span className="text-sm font-medium text-foreground">Связанные эталоны</span>
          <div className="grid gap-2 rounded-[var(--radius-lg)] border border-border bg-muted/40 p-3">
            {linkedStandardOptions.length ? (
              linkedStandardOptions.map((option) => (
                <label
                  className="flex items-start gap-3 rounded-[var(--radius-md)] border border-transparent px-2 py-2 hover:border-border"
                  key={option.id}
                >
                  <input
                    aria-label={option.label}
                    checked={state.form.standardIds.includes(option.id)}
                    className="mt-0.5"
                    name={`edit-measuring-instrument-standard-${option.id}`}
                    onChange={() =>
                      updateMeasuringInstrumentForm({
                        standardIds: state.form.standardIds.includes(option.id)
                          ? state.form.standardIds.filter((id) => id !== option.id)
                          : [...state.form.standardIds, option.id],
                      })
                    }
                    translate="no"
                    type="checkbox"
                  />
                  <span className="min-w-0 space-y-1 text-sm">
                    <span className="block break-words font-medium text-foreground" translate="no">
                      {option.label}
                    </span>
                    <span className="block break-words text-muted-foreground">{option.detail}</span>
                  </span>
                </label>
              ))
            ) : (
              <EmptyState detail="Активные эталоны отсутствуют. Связи можно оставить пустыми." title="Связи недоступны" />
            )}
          </div>
        </label>
        <div className="grid gap-4 md:grid-cols-2">
          <InputField
            autoComplete={defaultAutoComplete("url")}
            label="Документ / ссылка"
            name="edit-measuring-instrument-document-url"
            onChange={(event) => updateMeasuringInstrumentForm({ documentUrl: event.target.value })}
            type="url"
            value={state.form.documentUrl}
          />
        </div>
        <TextareaField
          label="Комментарий"
          name="edit-measuring-instrument-comment"
          onChange={(event) => updateMeasuringInstrumentForm({ comment: event.target.value })}
          value={state.form.comment}
        />
      </div>
    );
  };

  const renderStandardForm = (state: Extract<EditDialogState, { kind: "standard" }>) => {
    const scopeOptions = state.form.ownershipScopeType === "division" ? session.divisions : session.units;

    return (
      <div className="grid gap-4">
        <div className="grid gap-4 md:grid-cols-2">
          <SelectField
            label="Уровень владения"
            name="edit-standard-ownership-scope"
            onChange={(event) => {
              const ownershipScopeType = event.target.value as StandardFormState["ownershipScopeType"];
              const nextScopeId =
                ownershipScopeType === "organization"
                  ? ""
                  : ownershipScopeType === "division"
                    ? session.divisions[0]?.id ?? ""
                    : session.units[0]?.id ?? "";
              const nextOwnerLabel =
                ownershipScopeType === "organization"
                  ? session.organization.name
                  : ownershipScopeType === "division"
                    ? session.divisions.find((division) => division.id === nextScopeId)?.name ?? ""
                    : session.units.find((unit) => unit.id === nextScopeId)?.name ?? "";
              updateStandardForm({
                ownershipScopeType,
                ownerLabel: nextOwnerLabel,
                scopeId: nextScopeId,
              });
            }}
            options={[
              { label: "Организация", value: "organization" },
              { disabled: !session.divisions.length, label: "Дивизион", value: "division" },
              { disabled: !session.units.length, label: "Юнит", value: "unit" },
            ]}
            value={state.form.ownershipScopeType}
          />
          <SelectField
            disabled={state.form.ownershipScopeType === "organization"}
            label="Точка владения"
            name="edit-standard-scope-id"
            onChange={(event) => updateStandardForm({ scopeId: event.target.value })}
            options={scopeOptions.map((item) => ({ label: item.name, value: item.id }))}
            placeholder={
              state.form.ownershipScopeType === "organization" ? "Организация в целом" : "Выберите точку владения"
            }
            value={state.form.scopeId}
          />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <InputField
            autoComplete={defaultAutoComplete("text")}
            label="Тип эталона"
            name="edit-standard-type"
            onChange={(event) => updateStandardForm({ standardType: event.target.value })}
            value={state.form.standardType}
          />
          <InputField
            autoComplete={defaultAutoComplete("text")}
            label="Модель"
            name="edit-standard-model"
            onChange={(event) => updateStandardForm({ model: event.target.value })}
            value={state.form.model}
          />
          <InputField
            autoComplete={defaultAutoComplete("text")}
            label="Идентификатор"
            name="edit-standard-identifier"
            onChange={(event) => updateStandardForm({ identifier: event.target.value })}
            spellCheck={false}
            translate="no"
            value={state.form.identifier}
          />
          <InputField
            autoComplete={defaultAutoComplete("text")}
            label="Серийный номер"
            name="edit-standard-serial-number"
            onChange={(event) => updateStandardForm({ serialNumber: event.target.value })}
            spellCheck={false}
            translate="no"
            value={state.form.serialNumber}
          />
          <InputField
            autoComplete={defaultAutoComplete("text")}
            label="Владелец / ответственная сторона"
            name="edit-standard-owner-label"
            onChange={(event) => updateStandardForm({ ownerLabel: event.target.value })}
            value={state.form.ownerLabel}
          />
          <div className="rounded-[var(--radius-lg)] border border-border bg-muted/60 px-4 py-3 text-sm leading-6 text-muted-foreground">
            Статус эталона и срок действия не редактируются вручную, они пересчитываются через журнал.
          </div>
          <InputField
            autoComplete={defaultAutoComplete("url")}
            label="Документ / ссылка"
            name="edit-standard-document-url"
            onChange={(event) => updateStandardForm({ documentUrl: event.target.value })}
            type="url"
            value={state.form.documentUrl}
          />
        </div>
        <TextareaField
          label="Метрологические характеристики"
          name="edit-standard-metrological-characteristics"
          onChange={(event) => updateStandardForm({ metrologicalCharacteristics: event.target.value })}
          value={state.form.metrologicalCharacteristics}
        />
        <TextareaField
          label="Комментарий"
          name="edit-standard-comment"
          onChange={(event) => updateStandardForm({ comment: event.target.value })}
          value={state.form.comment}
        />
      </div>
    );
  };

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
      {editor.kind === "standard" ? renderStandardForm(editor) : null}
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

export function EquipmentRegistryWorkspace({ session, initialShowArchived, initialTab }: Props) {
  const router = useRouter();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<RegistryTab>(initialTab);
  const [showArchived, setShowArchived] = useState(initialShowArchived);
  const [equipmentRecords, setEquipmentRecords] = useState<EquipmentRecord[]>([]);
  const [measuringInstruments, setMeasuringInstruments] = useState<MeasuringInstrumentRecord[]>([]);
  const [standards, setStandards] = useState<StandardRecord[]>([]);
  const [equipmentForm, setEquipmentForm] = useState(() => defaultEquipmentForm(session));
  const [measuringInstrumentForm, setMeasuringInstrumentForm] = useState(() => defaultMeasuringInstrumentForm(session));
  const [standardForm, setStandardForm] = useState(() => defaultStandardForm(session));
  const [measuringInstrumentJournalForm, setMeasuringInstrumentJournalForm] = useState(defaultJournalForm);
  const [standardJournalForm, setStandardJournalForm] = useState(defaultJournalForm);
  const [selectedMeasuringInstrumentId, setSelectedMeasuringInstrumentId] = useState("");
  const [selectedStandardId, setSelectedStandardId] = useState("");
  const [measuringInstrumentJournals, setMeasuringInstrumentJournals] = useState<JournalRecord[]>([]);
  const [standardJournals, setStandardJournals] = useState<JournalRecord[]>([]);
  const [loadingMeasuringInstrumentJournals, setLoadingMeasuringInstrumentJournals] = useState(false);
  const [loadingStandardJournals, setLoadingStandardJournals] = useState(false);
  const [loading, setLoading] = useState(true);
  const hasLoadedRegistriesRef = useRef(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [archiveConfirmation, setArchiveConfirmation] = useState<ArchiveConfirmation | null>(null);
  const [editDialog, setEditDialog] = useState<EditDialogState | null>(null);
  const [mutationInFlight, setMutationInFlight] = useState(false);
  const [isPending, startTransition] = useTransition();

  const canManageRegistry = sessionHasCapability(session, "manage_equipment");

  const activeStandards = standards.filter((item) => !item.archivedAt);
  const linkableMeasuringInstrumentOptions = measuringInstrumentLinkOptions(measuringInstruments, equipmentForm.unitId);
  const selectedMeasuringInstrument =
    measuringInstruments.find((item) => item.id === selectedMeasuringInstrumentId) ?? null;
  const selectedStandard = standards.find((item) => item.id === selectedStandardId) ?? null;
  const isMutating = isPending || mutationInFlight;
  const registryTabCounts: Record<RegistryTab, number> = {
    equipment: equipmentRecords.length,
    mi: measuringInstruments.length,
    standards: standards.length,
  };
  const registryTabItems = tabMeta.map((item) => ({
    ...item,
    badge: String(registryTabCounts[item.key]),
  }));

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
      const [equipmentData, measuringInstrumentData, standardData] = await Promise.all([
        fetchAllRegistryPages<EquipmentRecord>("/api/equipment", "Не удалось загрузить реестр оборудования.", showArchived),
        fetchAllRegistryPages<MeasuringInstrumentRecord>(
          "/api/equipment/measuring-instruments",
          "Не удалось загрузить реестр средств измерения.",
          showArchived,
        ),
        fetchAllRegistryPages<StandardRecord>("/api/equipment/standards", "Не удалось загрузить реестр эталонов.", showArchived),
      ]);

      setEquipmentRecords(equipmentData);
      setMeasuringInstruments(measuringInstrumentData.map(normalizeMeasuringInstrument));
      setStandards(standardData);
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
      }).then((response) =>
        parseEnvelope<JournalRecord[]>(response, "Не удалось загрузить журнал средства измерения."),
      );
      setMeasuringInstrumentJournals(journals);
    } catch (error) {
      showErrorToast("Не удалось загрузить журнал средства измерения.", error, "equipment-mi-journals-load-error");
    } finally {
      setLoadingMeasuringInstrumentJournals(false);
    }
  }, [showErrorToast]);

  const loadStandardJournals = useCallback(async (id: string) => {
    setLoadingStandardJournals(true);
    try {
      const journals = await fetch(`/api/equipment/standards/${id}/journals`, {
        cache: "no-store",
      }).then((response) => parseEnvelope<JournalRecord[]>(response, "Не удалось загрузить журнал эталона."));
      setStandardJournals(journals);
    } catch (error) {
      showErrorToast("Не удалось загрузить журнал эталона.", error, "equipment-standard-journals-load-error");
    } finally {
      setLoadingStandardJournals(false);
    }
  }, [showErrorToast]);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    setShowArchived(initialShowArchived);
  }, [initialShowArchived]);

  useEffect(() => {
    void loadRegistries();
  }, [loadRegistries]);

  useEffect(() => {
    if (standardForm.ownershipScopeType === "organization") {
      if (standardForm.scopeId !== "") {
        setStandardForm((current) => ({ ...current, scopeId: "" }));
      }
      return;
    }

    const options =
      standardForm.ownershipScopeType === "division"
        ? session.divisions
        : session.units;

    if (!options.length) {
      if (standardForm.scopeId !== "") {
        setStandardForm((current) => ({ ...current, scopeId: "" }));
      }
      return;
    }

    if (!options.some((item) => item.id === standardForm.scopeId)) {
      setStandardForm((current) => ({ ...current, scopeId: options[0]?.id ?? "" }));
    }
  }, [session.divisions, session.units, standardForm.ownershipScopeType, standardForm.scopeId]);

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
    if (!standards.length) {
      if (selectedStandardId !== "") {
        setSelectedStandardId("");
      }
      return;
    }

    if (!standards.some((item) => item.id === selectedStandardId)) {
      setSelectedStandardId(standards[0]?.id ?? "");
    }
  }, [standards, selectedStandardId]);

  useEffect(() => {
    const activeStandardIDs = new Set(activeStandards.map((item) => item.id));

    setMeasuringInstrumentForm((current) => {
      const nextStandardIDs = current.standardIds.filter((id) => activeStandardIDs.has(id));
      if (nextStandardIDs.length === current.standardIds.length) {
        return current;
      }

      return {
        ...current,
        standardIds: nextStandardIDs,
      };
    });
  }, [activeStandards]);

  useEffect(() => {
    const linkableIDs = new Set(
      measuringInstruments
        .filter(
          (item) =>
            !item.archivedAt &&
            item.unit.id === equipmentForm.unitId &&
            item.placementKind === "standalone" &&
            !item.equipment,
        )
        .map((item) => item.id),
    );

    setEquipmentForm((current) => {
      const nextIDs = current.measuringInstrumentIds.filter((id) => linkableIDs.has(id));
      if (nextIDs.length === current.measuringInstrumentIds.length) {
        return current;
      }

      return {
        ...current,
        measuringInstrumentIds: nextIDs,
      };
    });
  }, [equipmentForm.unitId, measuringInstruments]);

  useEffect(() => {
    if (selectedMeasuringInstrumentId) {
      void loadMeasuringInstrumentJournals(selectedMeasuringInstrumentId);
    } else {
      setMeasuringInstrumentJournals([]);
    }
  }, [loadMeasuringInstrumentJournals, selectedMeasuringInstrumentId]);

  useEffect(() => {
    if (selectedStandardId) {
      void loadStandardJournals(selectedStandardId);
    } else {
      setStandardJournals([]);
    }
  }, [loadStandardJournals, selectedStandardId]);

  function handleTabChange(nextTab: RegistryTab) {
    setActiveTab(nextTab);
    router.replace(buildEquipmentRoute(nextTab, showArchived), {
      scroll: false,
    });
  }

  function handleArchiveVisibilityChange() {
    setShowArchived((current) => {
      const next = !current;
      router.replace(buildEquipmentRoute(activeTab, next), { scroll: false });
      return next;
    });
  }

  async function createEquipment() {
    const response = await fetch("/api/equipment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(equipmentPayload(equipmentForm)),
    });

    const created = await parseEnvelope<EquipmentRecord>(response, "Не удалось создать карточку оборудования.");
    await Promise.all(
      equipmentForm.measuringInstrumentIds.map(async (id) => {
        const instrument = measuringInstruments.find((item) => item.id === id);
        if (!instrument) {
          return;
        }

        const linkResponse = await fetch(`/api/equipment/measuring-instruments/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            measuringInstrumentPayload({
              ...measuringInstrumentFormFromRecord(instrument),
              equipmentId: created.id,
              placementKind: "built_in",
              unitId: created.unit.id,
            }),
          ),
        });

        await parseEnvelope<MeasuringInstrumentRecord>(
          linkResponse,
          "Не удалось связать средство измерения с оборудованием.",
        );
      }),
    );
    setEquipmentForm(defaultEquipmentForm(session));
    await loadRegistries();
    showSuccessToast(
      equipmentForm.measuringInstrumentIds.length
        ? "Оборудование создано. Связанные СИ добавлены в карточку."
        : "Оборудование создано и появилось в учете.",
      "equipment-create-success",
    );
  }

  async function createMeasuringInstrument() {
    const response = await fetch("/api/equipment/measuring-instruments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(measuringInstrumentPayload(measuringInstrumentForm)),
    });

    const created = await parseEnvelope<MeasuringInstrumentRecord>(
      response,
      "Не удалось создать средство измерения.",
    );
    setMeasuringInstrumentForm(defaultMeasuringInstrumentForm(session));
    await loadRegistries();
    setSelectedMeasuringInstrumentId(created.id);
    showSuccessToast(
      "Средство измерения создано. Метрологический статус рассчитывается по журналу.",
      "equipment-mi-create-success",
    );
  }

  async function createStandard() {
    const response = await fetch("/api/equipment/standards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(standardPayload(standardForm, session)),
    });

    const created = await parseEnvelope<StandardRecord>(response, "Не удалось создать эталон.");
    setStandardForm(defaultStandardForm(session));
    await loadRegistries();
    setSelectedStandardId(created.id);
    showSuccessToast(
      "Эталон создан. Действующий статус и срок поверки станут производными после записи в журнал.",
      "equipment-standard-create-success",
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
      linkedStandards: record.standards,
      recordId: record.id,
      recordLabel: record.name,
      form: measuringInstrumentFormFromRecord(record),
    });
  }

  function openStandardEditor(record: StandardRecord) {
    setEditDialog({
      kind: "standard",
      recordId: record.id,
      recordLabel: `${record.standardType} • ${record.identifier}`,
      form: standardFormFromRecord(record),
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
        "Не удалось обновить средство измерения.",
      );
      await loadRegistries();
      setSelectedMeasuringInstrumentId(updated.id);
      setEditDialog(null);
      showSuccessToast("Средство измерения обновлено.", "equipment-mi-update-success");
      return;
    }

    const response = await fetch(`/api/equipment/standards/${editDialog.recordId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(standardPayload(editDialog.form, session)),
    });
    const updated = await parseEnvelope<StandardRecord>(response, "Не удалось обновить эталон.");
    await loadRegistries();
    setSelectedStandardId(updated.id);
    setEditDialog(null);
    showSuccessToast("Эталон обновлен.", "equipment-standard-update-success");
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
    await parseEnvelope<MeasuringInstrumentRecord>(response, "Не удалось архивировать средство измерения.");
    await loadRegistries();
    if (selectedMeasuringInstrumentId === id) {
      await loadMeasuringInstrumentJournals(id);
    }
    showSuccessToast(
      "Средство измерения переведено в архив и убрано из активных списков выбора.",
      "equipment-mi-archive-success",
    );
  }

  async function archiveStandard(id: string) {
    const response = await fetch(`/api/equipment/standards/${id}/archive`, {
      method: "POST",
    });
    await parseEnvelope<StandardRecord>(response, "Не удалось архивировать эталон.");
    await loadRegistries();
    if (selectedStandardId === id) {
      await loadStandardJournals(id);
    }
    showSuccessToast("Эталон переведен в архив и исключен из активных связей.", "equipment-standard-archive-success");
  }

  async function createMeasuringInstrumentJournal() {
    if (!selectedMeasuringInstrumentId) {
      throw new Error("Сначала выберите средство измерения для журнала.");
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

    await parseEnvelope<JournalRecord>(response, "Не удалось добавить запись в журнал средства измерения.");
    setMeasuringInstrumentJournalForm(defaultJournalForm());
    await loadRegistries();
    await loadMeasuringInstrumentJournals(selectedMeasuringInstrumentId);
    showSuccessToast(
      "Запись журнала СИ сохранена. Производный статус и ближайшая дата пересчитаны.",
      "equipment-mi-journal-create-success",
    );
  }

  async function createStandardJournal() {
    if (!selectedStandardId) {
      throw new Error("Сначала выберите эталон для журнала.");
    }

    const response = await fetch(`/api/equipment/standards/${selectedStandardId}/journals`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        operationType: standardJournalForm.operationType,
        operationDate: standardJournalForm.operationDate,
        documentNumber: standardJournalForm.documentNumber,
        validUntil: optionalString(standardJournalForm.validUntil),
        executorOrganization: standardJournalForm.executorOrganization,
        attachmentUrl: optionalString(standardJournalForm.attachmentUrl),
        comment: optionalString(standardJournalForm.comment),
      }),
    });

    await parseEnvelope<JournalRecord>(response, "Не удалось добавить запись в журнал эталона.");
    setStandardJournalForm(defaultJournalForm());
    await loadRegistries();
    await loadStandardJournals(selectedStandardId);
    showSuccessToast(
      "Запись журнала эталона сохранена. Производный статус и срок действия пересчитаны.",
      "equipment-standard-journal-create-success",
    );
  }

  function toggleStandard(id: string) {
    setMeasuringInstrumentForm((current) => ({
      ...current,
      standardIds: current.standardIds.includes(id)
        ? current.standardIds.filter((item) => item !== id)
        : [...current.standardIds, id],
    }));
  }

  function toggleEquipmentMeasuringInstrument(id: string) {
    setEquipmentForm((current) => ({
      ...current,
      measuringInstrumentIds: current.measuringInstrumentIds.includes(id)
        ? current.measuringInstrumentIds.filter((item) => item !== id)
        : [...current.measuringInstrumentIds, id],
    }));
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

  function confirmArchive() {
    if (!archiveConfirmation) {
      return;
    }

    const confirmation = archiveConfirmation;
    setArchiveConfirmation(null);
    runMutation(confirmation.task, confirmation.fallbackMessage, confirmation.dedupeKey);
  }

  function renderEquipmentTab() {
    const equipmentFormCard = (
        <IslandCard
          headingLevel={2}
          icon={<Wrench aria-hidden="true" className="size-4" />}
          title="Новое оборудование"
        >
          {canManageRegistry ? (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <SelectField
                  label="Юнит владения"
                  name="equipment-unit-id"
                  onChange={(event) =>
                    setEquipmentForm((current) => ({ ...current, unitId: event.target.value }))
                  }
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
                  onChange={(event) =>
                    setEquipmentForm((current) => ({ ...current, manufacturer: event.target.value }))
                  }
                  value={equipmentForm.manufacturer}
                />
                <InputField
                  autoComplete={defaultAutoComplete("text")}
                  label="Класс / тип"
                  name="equipment-classification"
                  onChange={(event) =>
                    setEquipmentForm((current) => ({ ...current, classification: event.target.value }))
                  }
                  value={equipmentForm.classification}
                />
                <InputField
                  autoComplete={defaultAutoComplete("text")}
                  label="Модель"
                  name="equipment-model"
                  onChange={(event) =>
                    setEquipmentForm((current) => ({ ...current, model: event.target.value }))
                  }
                  value={equipmentForm.model}
                />
                <InputField
                  autoComplete={defaultAutoComplete("number")}
                  inputMode="numeric"
                  label="Год выпуска"
                  name="equipment-manufacture-year"
                  onChange={(event) =>
                    setEquipmentForm((current) => ({ ...current, manufactureYear: event.target.value }))
                  }
                  type="number"
                  value={equipmentForm.manufactureYear}
                />
                <InputField
                  autoComplete={defaultAutoComplete("text")}
                  label="Полное наименование"
                  name="equipment-full-name"
                  onChange={(event) =>
                    setEquipmentForm((current) => ({ ...current, fullName: event.target.value }))
                  }
                  value={equipmentForm.fullName}
                />
                <InputField
                  autoComplete={defaultAutoComplete("text")}
                  label="Заводской номер"
                  name="equipment-factory-number"
                  onChange={(event) =>
                    setEquipmentForm((current) => ({ ...current, factoryNumber: event.target.value }))
                  }
                  spellCheck={false}
                  translate="no"
                  value={equipmentForm.factoryNumber}
                />
                <InputField
                  autoComplete={defaultAutoComplete("text")}
                  label="Инвентарный номер"
                  name="equipment-inventory-number"
                  onChange={(event) =>
                    setEquipmentForm((current) => ({ ...current, inventoryNumber: event.target.value }))
                  }
                  spellCheck={false}
                  translate="no"
                  value={equipmentForm.inventoryNumber}
                />
                <InputField
                  autoComplete={defaultAutoComplete("url")}
                  label="Документ / ссылка"
                  name="equipment-document-url"
                  onChange={(event) =>
                    setEquipmentForm((current) => ({ ...current, documentUrl: event.target.value }))
                  }
                  type="url"
                  value={equipmentForm.documentUrl}
                />
              </div>
              <label className="grid gap-2.5">
                <span className="text-sm font-medium text-foreground">Связанные средства измерения</span>
                <div className="grid gap-2 rounded-[var(--radius-lg)] border border-border bg-muted/40 p-3">
                  {linkableMeasuringInstrumentOptions.length ? (
                    linkableMeasuringInstrumentOptions.map((item) => (
                      <label
                        className="flex items-start gap-3 rounded-[var(--radius-md)] border border-transparent px-2 py-2 hover:border-border"
                        key={item.id}
                      >
                        <input
                          aria-label={item.label}
                          checked={equipmentForm.measuringInstrumentIds.includes(item.id)}
                          className="mt-0.5"
                          name={`equipment-measuring-instrument-${item.id}`}
                          onChange={() => toggleEquipmentMeasuringInstrument(item.id)}
                          translate="no"
                          type="checkbox"
                        />
                        <span className="min-w-0 space-y-1 text-sm">
                          <span className="block break-words font-medium text-foreground" translate="no">
                            {item.label}
                          </span>
                          <span className="block break-words text-muted-foreground">{item.detail}</span>
                        </span>
                      </label>
                    ))
                  ) : (
                    <EmptyState
                      detail="Активные отдельные СИ в выбранном юните отсутствуют. Связи можно оставить пустыми."
                      title="Связи недоступны"
                    />
                  )}
                </div>
              </label>
              <TextareaField
                label="Комментарий"
                name="equipment-comment"
                onChange={(event) =>
                  setEquipmentForm((current) => ({ ...current, comment: event.target.value }))
                }
                value={equipmentForm.comment}
              />
              <Button
                disabled={!isEquipmentFormReady(equipmentForm)}
                fullWidth
                loading={isMutating}
                onClick={() =>
                  runMutation(
                    createEquipment,
                    "Не удалось создать оборудование или связать выбранные СИ.",
                    "equipment-create-error",
                  )
                }
                type="button"
              >
                Создать оборудование
              </Button>
            </>
          ) : (
            <EmptyState
              detail="В текущей области новые записи не создаются. Пользователь видит только разрешенный список."
              title="Создание скрыто"
            />
          )}
        </IslandCard>
    );

    const equipmentListCard = (
        <IslandCard
          bodyClassName={canManageRegistry ? "min-h-0 flex-1" : undefined}
          className={canManageRegistry ? "h-full min-h-0 overflow-hidden" : undefined}
          headingLevel={2}
          icon={<Wrench aria-hidden="true" className="size-4" />}
          metric={equipmentRecords.length}
          title="Оборудование в учете"
        >
          <Badge tone="info">{showArchived ? "Активные и архив" : "Только активные"}</Badge>

          {!equipmentRecords.length && !loading ? (
            <EmptyState
              detail="Оборудование еще не зарегистрировано. Средства измерения можно вести отдельно."
              title="Оборудование пока не добавлено"
            />
          ) : null}

          <FormListScrollArea className="grid gap-4">
            {equipmentRecords.map((item) => (
              <Card
                className="gap-4 [contain-intrinsic-size:1px_320px] [content-visibility:auto]"
                key={item.id}
                padding="md"
                tone="muted"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <h3 className="break-words text-lg font-semibold text-foreground">{item.fullName}</h3>
                    <p className="break-words text-sm text-muted-foreground">
                      {item.manufacturer} • {item.classification} • {item.model}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge tone={statusToneMap[item.status]}>{statusLabelMap[item.status]}</Badge>
                    <Badge tone={item.measuringInstrumentCount ? "interactive" : "neutral"}>
                      СИ: {item.measuringInstrumentCount}
                    </Badge>
                    {item.archivedAt ? <Badge tone="neutral">В архиве</Badge> : null}
                  </div>
                </div>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {fieldDetail("Заводской номер", item.factoryNumber, true)}
                  {fieldDetail("Инвентарный номер", item.inventoryNumber, true)}
                  {fieldDetail("Год выпуска", item.manufactureYear)}
                  {fieldDetail("Юнит", item.unit.name)}
                  {fieldDetail("Дивизион", item.unit.divisionName)}
                  {fieldDetail("Архивирован", item.archivedAt ? formatTimestamp(item.archivedAt) : undefined)}
                </div>
                {item.comment || item.documentUrl ? (
                  <div className="grid gap-3 md:grid-cols-2">
                    {fieldDetail("Комментарий", item.comment)}
                    {fieldDetail("Документ", item.documentUrl)}
                  </div>
                ) : null}
                {canManageRegistry && !item.archivedAt ? (
                  <div className="grid gap-3 sm:grid-cols-2">
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
                  </div>
                ) : null}
              </Card>
            ))}
          </FormListScrollArea>
        </IslandCard>
    );

    return canManageRegistry ? (
      <FormListSplitLayout form={equipmentFormCard} list={equipmentListCard} />
    ) : (
      <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        {equipmentFormCard}
        {equipmentListCard}
      </div>
    );
  }

  function renderMeasuringInstrumentTab() {
    const measuringInstrumentFormCard = (
          <IslandCard
            headingLevel={2}
            icon={<Cable aria-hidden="true" className="size-4" />}
            title="Новое средство измерения"
          >
            {canManageRegistry ? (
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
                    onChange={(event) =>
                      setMeasuringInstrumentForm((current) => ({ ...current, name: event.target.value }))
                    }
                    value={measuringInstrumentForm.name}
                  />
                  <InputField
                    autoComplete={defaultAutoComplete("text")}
                    label="Тип / класс"
                    name="measuring-instrument-type"
                    onChange={(event) =>
                      setMeasuringInstrumentForm((current) => ({
                        ...current,
                        instrumentType: event.target.value,
                      }))
                    }
                    value={measuringInstrumentForm.instrumentType}
                  />
                  <InputField
                    autoComplete={defaultAutoComplete("text")}
                    label="Модель"
                    name="measuring-instrument-model"
                    onChange={(event) =>
                      setMeasuringInstrumentForm((current) => ({ ...current, model: event.target.value }))
                    }
                    value={measuringInstrumentForm.model}
                  />
                  <InputField
                    autoComplete={defaultAutoComplete("text")}
                    label="ФИФ"
                    name="measuring-instrument-registration-number"
                    onChange={(event) =>
                      setMeasuringInstrumentForm((current) => ({
                        ...current,
                        registrationNumber: event.target.value,
                      }))
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
                </div>
                <label className="grid gap-2.5">
                  <span className="text-sm font-medium text-foreground">Связанные эталоны</span>
                  <div className="grid gap-2 rounded-[var(--radius-lg)] border border-border bg-muted/40 p-3">
                    {activeStandards.length ? (
                      activeStandards.map((item) => (
                        <label
                          className="flex items-start gap-3 rounded-[var(--radius-md)] border border-transparent px-2 py-2 hover:border-border"
                          key={item.id}
                        >
                          <input
                            aria-label={item.identifier}
                            checked={measuringInstrumentForm.standardIds.includes(item.id)}
                            className="mt-0.5"
                            name={`measuring-instrument-standard-${item.id}`}
                            onChange={() => toggleStandard(item.id)}
                            translate="no"
                            type="checkbox"
                          />
                          <span className="min-w-0 space-y-1 text-sm">
                            <span className="block break-words font-medium text-foreground" translate="no">
                              {item.standardType} • {item.identifier}
                            </span>
                            <span className="block break-words text-muted-foreground">
                              {item.model} • {item.ownershipScope.label}
                            </span>
                          </span>
                        </label>
                      ))
                    ) : (
                      <EmptyState
                        detail="Активные эталоны отсутствуют. СИ можно создать без связей."
                        title="Активные связи пока недоступны"
                      />
                    )}
                  </div>
                </label>
                <div className="grid gap-4 md:grid-cols-2">
                  <InputField
                    autoComplete={defaultAutoComplete("url")}
                    label="Документ / ссылка"
                    name="measuring-instrument-document-url"
                    onChange={(event) =>
                      setMeasuringInstrumentForm((current) => ({
                        ...current,
                        documentUrl: event.target.value,
                      }))
                    }
                    type="url"
                    value={measuringInstrumentForm.documentUrl}
                  />
                </div>
                <TextareaField
                  label="Комментарий"
                  name="measuring-instrument-comment"
                  onChange={(event) =>
                    setMeasuringInstrumentForm((current) => ({ ...current, comment: event.target.value }))
                  }
                  value={measuringInstrumentForm.comment}
                />
                <Button
                  disabled={!isMeasuringInstrumentFormReady(measuringInstrumentForm)}
                  fullWidth
                  loading={isMutating}
                  onClick={() =>
                    runMutation(
                      createMeasuringInstrument,
                      "Не удалось создать средство измерения.",
                      "equipment-mi-create-error",
                    )
                  }
                  type="button"
                >
                  Создать средство измерения
                </Button>
              </>
            ) : (
              <EmptyState
                detail="Пользователь видит только список и журналы в рамках выданного доступа. Создание СИ скрыто."
                title="Только просмотр"
              />
            )}
          </IslandCard>
    );

    const measuringInstrumentListCard = (
          <IslandCard
            bodyClassName={canManageRegistry ? "min-h-0 flex-1" : undefined}
            className={canManageRegistry ? "h-full min-h-0 overflow-hidden" : undefined}
            headingLevel={2}
            icon={<Cable aria-hidden="true" className="size-4" />}
            metric={measuringInstruments.length}
            title="Средства измерения в учете"
          >
            <Badge tone="info">{showArchived ? "Активные и архив" : "Только активные"}</Badge>

            {!measuringInstruments.length && !loading ? (
              <EmptyState
                detail="Здесь появятся отдельные СИ и встроенные СИ, привязанные к оборудованию."
                title="Средства измерения пока не добавлены"
              />
            ) : null}

            <FormListScrollArea className="grid gap-4">
              {measuringInstruments.map((item) => (
                <Card
                  className="gap-4 [contain-intrinsic-size:1px_360px] [content-visibility:auto]"
                  key={item.id}
                  padding="md"
                  tone="muted"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 space-y-1">
                      <h3 className="break-words text-lg font-semibold text-foreground">{item.name}</h3>
                      <p className="break-words text-sm text-muted-foreground">
                        {item.instrumentType} • {item.model}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge tone={statusToneMap[item.status]}>{statusLabelMap[item.status]}</Badge>
                      <Badge tone={item.placementKind === "built_in" ? "interactive" : "neutral"}>
                        {formatPlacementKind(item.placementKind)}
                      </Badge>
                      <Badge tone={item.standards.length ? "interactive" : "neutral"}>
                        Эталоны: {item.standards.length}
                      </Badge>
                      {item.archivedAt ? <Badge tone="neutral">В архиве</Badge> : null}
                    </div>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {fieldDetail("ФИФ", item.registrationNumber, true)}
                    {fieldDetail("Серийный номер", item.serialNumber, true)}
                    {fieldDetail("Юнит", item.unit.name)}
                    {fieldDetail("Связано с оборудованием", item.equipment?.fullName)}
                    {fieldDetail("Журнал", item.journalCount ? `${item.journalCount} записей` : "пока пуст")}
                    {fieldDetail("Действует до", item.nextDueDate ? formatDate(item.nextDueDate) : undefined)}
                  </div>
                  {item.latestJournal ? (
                    <div className="rounded-[var(--radius-lg)] border border-border bg-card px-4 py-3 text-sm leading-6 text-muted-foreground">
                      Последняя запись: <span className="font-medium text-foreground">{formatOperationType(item.latestJournal.operationType)}</span>{" "}
                      от <span className="font-medium text-foreground">{formatDate(item.latestJournal.operationDate)}</span>, документ{" "}
                      <span className="font-medium text-foreground" translate="no">
                        {item.latestJournal.documentNumber}
                      </span>
                      .
                    </div>
                  ) : (
                    <EmptyState
                      detail="Статус еще не подтвержден журналом. После первой операции текущий статус и срок рассчитаются автоматически."
                      title="Журнал операций пока пуст"
                    />
                  )}
                  {item.standards.length ? (
                    <div className="grid gap-3 md:grid-cols-2">
                      {item.standards.map((standard) => (
                        <div
                          className="rounded-[var(--radius-lg)] border border-border bg-card px-4 py-3"
                          key={`${item.id}:${standard.id}`}
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-sm font-semibold text-foreground">
                              <span translate="no">
                                {standard.standardType} • {standard.identifier}
                              </span>
                            </p>
                            <Badge size="sm" tone={statusToneMap[standard.status]}>
                              {statusLabelMap[standard.status]}
                            </Badge>
                          </div>
                          <p className="mt-2 text-sm text-muted-foreground">
                            {standard.model} • {standard.scopeLabel}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : null}
                  {canManageRegistry && !item.archivedAt ? (
                    <div className="flex flex-wrap justify-end gap-3">
                      <Button
                        aria-label={`Редактировать средство измерения ${item.name}`}
                        leftIcon={<Pencil className="size-4" />}
                        onClick={() => openMeasuringInstrumentEditor(item)}
                        size="sm"
                        type="button"
                        variant="secondary"
                      >
                        Редактировать
                      </Button>
                      <Button
                        aria-label={`Архивировать средство измерения ${item.name}`}
                        leftIcon={<Archive className="size-4" />}
                        loading={isMutating}
                        onClick={() =>
                          requestArchive(
                            () => archiveMeasuringInstrument(item.id),
                            "Не удалось архивировать средство измерения.",
                            `средство измерения «${item.name}»`,
                            "equipment-mi-archive-error",
                          )
                        }
                        size="sm"
                        type="button"
                        variant="ghost"
                      >
                        Архивировать
                      </Button>
                    </div>
                  ) : null}
                </Card>
              ))}
            </FormListScrollArea>
          </IslandCard>
    );

    const measuringInstrumentRegistryPair = canManageRegistry ? (
      <FormListSplitLayout form={measuringInstrumentFormCard} list={measuringInstrumentListCard} />
    ) : (
      <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        {measuringInstrumentFormCard}
        {measuringInstrumentListCard}
      </div>
    );

    function renderMeasuringInstrumentJournalPair() {
      if (!selectedMeasuringInstrument) {
        return (
          <EmptyState
            detail="Выберите средство измерения из текущей области доступа, чтобы посмотреть историю операций и рассчитанный статус."
            title="Журнал еще не выбран"
          />
        );
      }

      const hasActiveJournalForm = canManageRegistry && !selectedMeasuringInstrument.archivedAt;
      const journalFormCard = (
        <Card className={hasActiveJournalForm ? "h-full min-h-0 gap-4" : "gap-4"} padding="md" tone="muted">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-foreground">{selectedMeasuringInstrument.name}</h3>
            <p className="text-sm text-muted-foreground">
              Текущий статус:{" "}
              <span className="font-medium text-foreground">{statusLabelMap[selectedMeasuringInstrument.status]}</span>
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
                  name="mi-journal-operation-type"
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
                  name="mi-journal-operation-date"
                  onChange={(event) =>
                    setMeasuringInstrumentJournalForm((current) => ({
                      ...current,
                      operationDate: event.target.value,
                    }))
                  }
                  type="date"
                  value={measuringInstrumentJournalForm.operationDate}
                />
                <InputField
                  autoComplete={defaultAutoComplete("text")}
                  label="Документ"
                  name="mi-journal-document-number"
                  onChange={(event) =>
                    setMeasuringInstrumentJournalForm((current) => ({
                      ...current,
                      documentNumber: event.target.value,
                    }))
                  }
                  spellCheck={false}
                  translate="no"
                  value={measuringInstrumentJournalForm.documentNumber}
                />
                <InputField
                  autoComplete={defaultAutoComplete("text")}
                  label="Действует до"
                  name="mi-journal-valid-until"
                  onChange={(event) =>
                    setMeasuringInstrumentJournalForm((current) => ({
                      ...current,
                      validUntil: event.target.value,
                    }))
                  }
                  type="date"
                  value={measuringInstrumentJournalForm.validUntil}
                />
                <InputField
                  autoComplete={defaultAutoComplete("text")}
                  label="Организация-исполнитель"
                  name="mi-journal-executor"
                  onChange={(event) =>
                    setMeasuringInstrumentJournalForm((current) => ({
                      ...current,
                      executorOrganization: event.target.value,
                    }))
                  }
                  value={measuringInstrumentJournalForm.executorOrganization}
                />
                <InputField
                  autoComplete={defaultAutoComplete("url")}
                  label="Вложение / ссылка"
                  name="mi-journal-attachment"
                  onChange={(event) =>
                    setMeasuringInstrumentJournalForm((current) => ({
                      ...current,
                      attachmentUrl: event.target.value,
                    }))
                  }
                  type="url"
                  value={measuringInstrumentJournalForm.attachmentUrl}
                />
              </div>
              <TextareaField
                label="Комментарий"
                name="mi-journal-comment"
                onChange={(event) =>
                  setMeasuringInstrumentJournalForm((current) => ({
                    ...current,
                    comment: event.target.value,
                  }))
                }
                value={measuringInstrumentJournalForm.comment}
              />
              <div className="flex flex-wrap gap-3">
                <Button
                  loading={isMutating}
                  onClick={() =>
                    runMutation(
                      createMeasuringInstrumentJournal,
                      "Не удалось добавить запись в журнал средства измерения.",
                      "equipment-mi-journal-create-error",
                    )
                  }
                  type="button"
                >
                  Добавить запись журнала
                </Button>
                <Button
                  aria-label="Архивировать выбранное СИ"
                  leftIcon={<Archive className="size-4" />}
                  loading={isMutating}
                  onClick={() =>
                    requestArchive(
                      () => archiveMeasuringInstrument(selectedMeasuringInstrument.id),
                      "Не удалось архивировать средство измерения.",
                      `средство измерения «${selectedMeasuringInstrument.name}»`,
                      "equipment-mi-selected-archive-error",
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
                  ? "Архивированное СИ остается доступным для истории, но новые операции в него не добавляются."
                  : "В текущей области доступа журнал можно только читать."
              }
              title="Редактирование скрыто"
            />
          )}
        </Card>
      );
      const journalTimeline = loadingMeasuringInstrumentJournals ? (
        <EmptyState detail="История операций средства измерения загружается." title="Загрузка журнала" />
      ) : (
        <JournalTimeline
          emptyDetail="Для выбранного СИ еще нет операций. После первой записи статус и срок станут производными."
          emptyTitle="Журнал пока пуст"
          journals={measuringInstrumentJournals}
        />
      );
      const journalTimelineCard = (
        <Card
          className={hasActiveJournalForm ? "h-full min-h-0 gap-4 overflow-hidden" : "gap-4"}
          padding="md"
          tone="muted"
        >
          <div className="flex items-center gap-3">
            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-foreground">Хронология операций</h3>
            </div>
          </div>
          {hasActiveJournalForm ? <FormListScrollArea>{journalTimeline}</FormListScrollArea> : journalTimeline}
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

    return (
      <div className="grid gap-4">
        {measuringInstrumentRegistryPair}

        <IslandCard
          headingLevel={2}
          icon={<Cable aria-hidden="true" className="size-4" />}
          title="Журнал операций по СИ"
        >
          <div className="flex flex-wrap justify-end gap-3">
            <div className="min-w-64">
              <SelectField
                label="Выбранное средство измерения"
                name="selected-measuring-instrument"
                onChange={(event) => setSelectedMeasuringInstrumentId(event.target.value)}
                options={measuringInstruments.map((item) => ({
                  label: `${item.name} • ${item.registrationNumber}`,
                  value: item.id,
                }))}
                placeholder="Выберите запись"
                value={selectedMeasuringInstrumentId}
              />
            </div>
          </div>

          {renderMeasuringInstrumentJournalPair()}
        </IslandCard>
      </div>
    );
  }

  function renderStandardsTab() {
    const scopeOptions =
      standardForm.ownershipScopeType === "division" ? session.divisions : session.units;

    const standardFormCard = (
          <IslandCard
            headingLevel={2}
            icon={<Ruler aria-hidden="true" className="size-4" />}
            title="Новый эталон"
          >
            {canManageRegistry ? (
              <>
                <div className="grid gap-4 md:grid-cols-2">
                  <SelectField
                    label="Уровень владения"
                    name="standard-ownership-scope"
                    onChange={(event) =>
                      setStandardForm((current) => ({
                        ...current,
                        ownershipScopeType: event.target.value as StandardFormState["ownershipScopeType"],
                      }))
                    }
                    options={[
                      { label: "Организация", value: "organization" },
                      { disabled: !session.divisions.length, label: "Дивизион", value: "division" },
                      { disabled: !session.units.length, label: "Юнит", value: "unit" },
                    ]}
                    value={standardForm.ownershipScopeType}
                  />
                  <SelectField
                    disabled={standardForm.ownershipScopeType === "organization"}
                    label="Точка владения"
                    name="standard-scope-id"
                    onChange={(event) =>
                      setStandardForm((current) => ({ ...current, scopeId: event.target.value }))
                    }
                    options={scopeOptions.map((item) => ({ label: item.name, value: item.id }))}
                    placeholder={
                      standardForm.ownershipScopeType === "organization"
                        ? "Организация в целом"
                        : "Выберите точку владения"
                    }
                    value={standardForm.scopeId}
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <InputField
                    autoComplete={defaultAutoComplete("text")}
                    label="Тип эталона"
                    name="standard-type"
                    onChange={(event) =>
                      setStandardForm((current) => ({ ...current, standardType: event.target.value }))
                    }
                    value={standardForm.standardType}
                  />
                  <InputField
                    autoComplete={defaultAutoComplete("text")}
                    label="Модель"
                    name="standard-model"
                    onChange={(event) =>
                      setStandardForm((current) => ({ ...current, model: event.target.value }))
                    }
                    value={standardForm.model}
                  />
                  <InputField
                    autoComplete={defaultAutoComplete("text")}
                    label="Идентификатор"
                    name="standard-identifier"
                    onChange={(event) =>
                      setStandardForm((current) => ({ ...current, identifier: event.target.value }))
                    }
                    spellCheck={false}
                    translate="no"
                    value={standardForm.identifier}
                  />
                  <InputField
                    autoComplete={defaultAutoComplete("text")}
                    label="Серийный номер"
                    name="standard-serial-number"
                    onChange={(event) =>
                      setStandardForm((current) => ({ ...current, serialNumber: event.target.value }))
                    }
                    spellCheck={false}
                    translate="no"
                    value={standardForm.serialNumber}
                  />
                  <InputField
                    autoComplete={defaultAutoComplete("text")}
                    label="Владелец / ответственная сторона"
                    name="standard-owner-label"
                    onChange={(event) =>
                      setStandardForm((current) => ({ ...current, ownerLabel: event.target.value }))
                    }
                    value={standardForm.ownerLabel}
                  />
                  <InputField
                    autoComplete={defaultAutoComplete("url")}
                    label="Документ / ссылка"
                    name="standard-document-url"
                    onChange={(event) =>
                      setStandardForm((current) => ({ ...current, documentUrl: event.target.value }))
                    }
                    type="url"
                    value={standardForm.documentUrl}
                  />
                </div>
                <TextareaField
                  label="Метрологические характеристики"
                  name="standard-metrological-characteristics"
                  onChange={(event) =>
                    setStandardForm((current) => ({
                      ...current,
                      metrologicalCharacteristics: event.target.value,
                    }))
                  }
                  value={standardForm.metrologicalCharacteristics}
                />
                <TextareaField
                  label="Комментарий"
                  name="standard-comment"
                  onChange={(event) =>
                    setStandardForm((current) => ({ ...current, comment: event.target.value }))
                  }
                  value={standardForm.comment}
                />
                <Button
                  disabled={!isStandardFormReady(standardForm)}
                  fullWidth
                  loading={isMutating}
                  onClick={() =>
                    runMutation(createStandard, "Не удалось создать эталон.", "equipment-standard-create-error")
                  }
                  type="button"
                >
                  Создать эталон
                </Button>
              </>
            ) : (
              <EmptyState
                detail="Пользователь с доступом только на просмотр видит эталоны своей области и связи со средствами измерения."
                title="Создание эталонов скрыто"
              />
            )}
          </IslandCard>
    );

    const standardListCard = (
          <IslandCard
            bodyClassName={canManageRegistry ? "min-h-0 flex-1" : undefined}
            className={canManageRegistry ? "h-full min-h-0 overflow-hidden" : undefined}
            headingLevel={2}
            icon={<Ruler aria-hidden="true" className="size-4" />}
            metric={standards.length}
            title="Эталоны в учете"
          >
            <Badge tone="info">{showArchived ? "Активные и архив" : "Только активные"}</Badge>

            {!standards.length && !loading ? (
              <EmptyState
                detail="После создания эталоны остаются отдельными записями и могут использоваться повторно в нескольких СИ."
                title="Эталоны пока не добавлены"
              />
            ) : null}

            <FormListScrollArea className="grid gap-4">
              {standards.map((item) => (
                <Card
                  className="gap-4 [contain-intrinsic-size:1px_400px] [content-visibility:auto]"
                  key={item.id}
                  padding="md"
                  tone="muted"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 space-y-1">
                      <h3 className="break-words text-lg font-semibold text-foreground">
                        <span translate="no">
                          {item.standardType} • {item.identifier}
                        </span>
                      </h3>
                      <p className="break-words text-sm text-muted-foreground">{item.model}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge tone={statusToneMap[item.status]}>{statusLabelMap[item.status]}</Badge>
                      <Badge tone={item.linkedMeasuringInstruments ? "interactive" : "neutral"}>
                        Связанные СИ: {item.linkedMeasuringInstruments}
                      </Badge>
                      {item.archivedAt ? <Badge tone="neutral">В архиве</Badge> : null}
                    </div>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {fieldDetail("Уровень владения", formatScopeType(item.ownershipScope.scopeType))}
                    {fieldDetail("Область", item.ownershipScope.label)}
                    {fieldDetail("Серийный номер", item.serialNumber, true)}
                    {fieldDetail("Действует до", item.nextDueDate ? formatDate(item.nextDueDate) : undefined)}
                    {fieldDetail("Журнал", item.journalCount ? `${item.journalCount} записей` : "пока пуст")}
                    {fieldDetail("Архивирован", item.archivedAt ? formatTimestamp(item.archivedAt) : undefined)}
                  </div>
                  {item.latestJournal ? (
                    <div className="rounded-[var(--radius-lg)] border border-border bg-card px-4 py-3 text-sm leading-6 text-muted-foreground">
                      Последняя запись: <span className="font-medium text-foreground">{formatOperationType(item.latestJournal.operationType)}</span>{" "}
                      от <span className="font-medium text-foreground">{formatDate(item.latestJournal.operationDate)}</span>, документ{" "}
                      <span className="font-medium text-foreground" translate="no">
                        {item.latestJournal.documentNumber}
                      </span>
                      .
                    </div>
                  ) : (
                    <EmptyState
                      detail="Журнал еще не подтвержден. После первой записи статус и срок действия станут производными."
                      title="Журнал пока пуст"
                    />
                  )}
                  <div className="rounded-[var(--radius-lg)] border border-border bg-card px-4 py-3">
                    <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      Метрологические характеристики
                    </div>
                    <p className="mt-2 text-sm leading-6 text-foreground">{item.metrologicalCharacteristics}</p>
                  </div>
                  {item.comment ? (
                    <div className="rounded-[var(--radius-lg)] border border-border bg-card px-4 py-3">
                      <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Комментарий</div>
                      <p className="mt-2 text-sm leading-6 text-foreground">{item.comment}</p>
                    </div>
                  ) : null}
                  {canManageRegistry && !item.archivedAt ? (
                    <div className="flex flex-wrap justify-end gap-3">
                      <Button
                        aria-label={`Редактировать эталон ${item.identifier}`}
                        leftIcon={<Pencil className="size-4" />}
                        onClick={() => openStandardEditor(item)}
                        size="sm"
                        type="button"
                        variant="secondary"
                      >
                        Редактировать
                      </Button>
                      <Button
                        aria-label={`Архивировать эталон ${item.identifier}`}
                        leftIcon={<Archive className="size-4" />}
                        loading={isMutating}
                        onClick={() =>
                          requestArchive(
                            () => archiveStandard(item.id),
                            "Не удалось архивировать эталон.",
                            `эталон «${item.identifier}»`,
                            "equipment-standard-archive-error",
                          )
                        }
                        size="sm"
                        type="button"
                        variant="ghost"
                      >
                        Архивировать
                      </Button>
                    </div>
                  ) : null}
                </Card>
              ))}
            </FormListScrollArea>
          </IslandCard>
    );

    const standardRegistryPair = canManageRegistry ? (
      <FormListSplitLayout form={standardFormCard} list={standardListCard} />
    ) : (
      <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        {standardFormCard}
        {standardListCard}
      </div>
    );

    function renderStandardJournalPair() {
      if (!selectedStandard) {
        return (
          <EmptyState
            detail="Выберите эталон из текущей области доступа, чтобы посмотреть историю операций и рассчитанный статус."
            title="Журнал еще не выбран"
          />
        );
      }

      const hasActiveJournalForm = canManageRegistry && !selectedStandard.archivedAt;
      const journalFormCard = (
        <Card className={hasActiveJournalForm ? "h-full min-h-0 gap-4" : "gap-4"} padding="md" tone="muted">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-foreground">
              <span translate="no">
                {selectedStandard.standardType} • {selectedStandard.identifier}
              </span>
            </h3>
            <p className="text-sm text-muted-foreground">
              Текущий статус: <span className="font-medium text-foreground">{statusLabelMap[selectedStandard.status]}</span>
              {selectedStandard.nextDueDate
                ? ` • действует до ${formatDate(selectedStandard.nextDueDate)}`
                : " • срок пока не рассчитан"}
            </p>
          </div>
          {hasActiveJournalForm ? (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <SelectField
                  label="Тип операции"
                  name="standard-journal-operation-type"
                  onChange={(event) =>
                    setStandardJournalForm((current) => ({
                      ...current,
                      operationType: event.target.value as JournalRecord["operationType"],
                    }))
                  }
                  options={journalOperationOptions}
                  value={standardJournalForm.operationType}
                />
                <InputField
                  autoComplete={defaultAutoComplete("text")}
                  label="Дата операции"
                  name="standard-journal-operation-date"
                  onChange={(event) =>
                    setStandardJournalForm((current) => ({
                      ...current,
                      operationDate: event.target.value,
                    }))
                  }
                  type="date"
                  value={standardJournalForm.operationDate}
                />
                <InputField
                  autoComplete={defaultAutoComplete("text")}
                  label="Документ"
                  name="standard-journal-document-number"
                  onChange={(event) =>
                    setStandardJournalForm((current) => ({
                      ...current,
                      documentNumber: event.target.value,
                    }))
                  }
                  spellCheck={false}
                  translate="no"
                  value={standardJournalForm.documentNumber}
                />
                <InputField
                  autoComplete={defaultAutoComplete("text")}
                  label="Действует до"
                  name="standard-journal-valid-until"
                  onChange={(event) =>
                    setStandardJournalForm((current) => ({
                      ...current,
                      validUntil: event.target.value,
                    }))
                  }
                  type="date"
                  value={standardJournalForm.validUntil}
                />
                <InputField
                  autoComplete={defaultAutoComplete("text")}
                  label="Организация-исполнитель"
                  name="standard-journal-executor"
                  onChange={(event) =>
                    setStandardJournalForm((current) => ({
                      ...current,
                      executorOrganization: event.target.value,
                    }))
                  }
                  value={standardJournalForm.executorOrganization}
                />
                <InputField
                  autoComplete={defaultAutoComplete("url")}
                  label="Вложение / ссылка"
                  name="standard-journal-attachment"
                  onChange={(event) =>
                    setStandardJournalForm((current) => ({
                      ...current,
                      attachmentUrl: event.target.value,
                    }))
                  }
                  type="url"
                  value={standardJournalForm.attachmentUrl}
                />
              </div>
              <TextareaField
                label="Комментарий"
                name="standard-journal-comment"
                onChange={(event) =>
                  setStandardJournalForm((current) => ({
                    ...current,
                    comment: event.target.value,
                  }))
                }
                value={standardJournalForm.comment}
              />
              <div className="flex flex-wrap gap-3">
                <Button
                  loading={isMutating}
                  onClick={() =>
                    runMutation(
                      createStandardJournal,
                      "Не удалось добавить запись в журнал эталона.",
                      "equipment-standard-journal-create-error",
                    )
                  }
                  type="button"
                >
                  Добавить запись журнала
                </Button>
                <Button
                  leftIcon={<Archive className="size-4" />}
                  loading={isMutating}
                  onClick={() =>
                    requestArchive(
                      () => archiveStandard(selectedStandard.id),
                      "Не удалось архивировать эталон.",
                      `эталон «${selectedStandard.identifier}»`,
                      "equipment-standard-selected-archive-error",
                    )
                  }
                  size="sm"
                  type="button"
                  variant="ghost"
                >
                  Архивировать выбранный эталон
                </Button>
              </div>
            </>
          ) : (
            <EmptyState
              detail={
                selectedStandard.archivedAt
                  ? "Архивированный эталон остается доступным для истории, но новые операции в него не добавляются."
                  : "В текущей области доступа журнал можно только читать."
              }
              title="Редактирование скрыто"
            />
          )}
        </Card>
      );
      const journalTimeline = loadingStandardJournals ? (
        <EmptyState detail="История операций эталона загружается." title="Загрузка журнала" />
      ) : (
        <JournalTimeline
          emptyDetail="Для выбранного эталона еще нет операций. После первой записи статус и срок действия станут производными."
          emptyTitle="Журнал пока пуст"
          journals={standardJournals}
        />
      );
      const journalTimelineCard = (
        <Card
          className={hasActiveJournalForm ? "h-full min-h-0 gap-4 overflow-hidden" : "gap-4"}
          padding="md"
          tone="muted"
        >
          <div className="flex items-center gap-3">
            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-foreground">Хронология операций</h3>
            </div>
          </div>
          {hasActiveJournalForm ? <FormListScrollArea>{journalTimeline}</FormListScrollArea> : journalTimeline}
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

    return (
      <div className="grid gap-4">
        {standardRegistryPair}

        <IslandCard
          headingLevel={2}
          icon={<Ruler aria-hidden="true" className="size-4" />}
          title="Журнал операций по эталонам"
        >
          <div className="flex flex-wrap justify-end gap-3">
            <div className="min-w-64">
              <SelectField
                label="Выбранный эталон"
                name="selected-standard"
                onChange={(event) => setSelectedStandardId(event.target.value)}
                options={standards.map((item) => ({
                  label: `${item.standardType} • ${item.identifier}`,
                  value: item.id,
                }))}
                placeholder="Выберите запись"
                value={selectedStandardId}
              />
            </div>
          </div>

          {renderStandardJournalPair()}
        </IslandCard>
      </div>
    );
  }

  return (
    <>
      <EditRegistryDialog
        activeStandards={activeStandards}
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
        aria-hidden={archiveConfirmation || editDialog ? true : undefined}
        className="grid min-w-0 gap-4"
        inert={archiveConfirmation || editDialog ? true : undefined}
      >
        {loadError ? (
          <div
            aria-live="polite"
            className="rounded-[var(--radius-xl)] border border-destructive/20 bg-destructive-soft px-4 py-3 text-sm text-destructive"
          >
            {loadError}
          </div>
        ) : null}

        <div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-center">
          <Tabs
            activeKey={activeTab}
            ariaLabel="Реестры оборудования"
            className="min-w-0 flex-1"
            fullWidth
            getPanelId={(key) => `equipment-panel-${key}`}
            idPrefix="equipment-registry"
            items={registryTabItems}
            onChange={handleTabChange}
          />
          <Button
            aria-pressed={showArchived}
            className="h-[54px] w-[175px] self-start justify-center text-center lg:self-auto lg:shrink-0"
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
            detail="Загружаем записи для выбранного режима."
            title="Загружаем учет…"
          />
        ) : null}

        <div
          aria-labelledby={`equipment-registry-${activeTab}`}
          id={`equipment-panel-${activeTab}`}
          role="tabpanel"
        >
          {!loading && activeTab === "equipment" ? renderEquipmentTab() : null}
          {!loading && activeTab === "mi" ? renderMeasuringInstrumentTab() : null}
          {!loading && activeTab === "standards" ? renderStandardsTab() : null}
        </div>
      </div>
    </>
  );
}
