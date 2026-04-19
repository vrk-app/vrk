"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Archive,
  Building2,
  Cable,
  FileSpreadsheet,
  Layers3,
  RefreshCw,
  Ruler,
  ShieldCheck,
  Wrench,
} from "lucide-react";
import type {
  ApiEnvelope,
  EquipmentRecord,
  JournalRecord,
  MeasuringInstrumentPlacement,
  MeasuringInstrumentRecord,
  RegistryStatus,
  SessionSummaryResponse,
  StandardRecord,
} from "@/shared/api";
import { Badge, Button, Card, InputField } from "@/shared/ui";

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
  ownershipScopeType: "organization" | "subdivision" | "unit";
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

const selectClassName =
  "h-10 rounded-[var(--radius-md)] border border-input bg-card px-3.5 text-sm text-foreground shadow-xs outline-none transition-colors hover:border-border-strong focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-ring/15 disabled:cursor-not-allowed disabled:text-muted-foreground";

const textAreaClassName =
  "min-h-24 rounded-[var(--radius-md)] border border-input bg-card px-3.5 py-3 text-sm text-foreground shadow-xs outline-none transition-colors hover:border-border-strong focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-ring/15";

const tabMeta: Array<{
  key: RegistryTab;
  label: string;
  description: string;
  icon: typeof Wrench;
}> = [
  {
    key: "equipment",
    label: "Оборудование",
    description: "Отдельный реестр оборудования с archive-only lifecycle без обязательного метрологического payload.",
    icon: Wrench,
  },
  {
    key: "mi",
    label: "Средства измерения",
    description: "Статус и срок действия выводятся из журнала операций, а не из ручного поля карточки.",
    icon: Cable,
  },
  {
    key: "standards",
    label: "Эталоны",
    description: "Самостоятельный реестр эталонов с reusable links, историей операций и explicit archive state.",
    icon: Ruler,
  },
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
  active: "active",
  inactive: "inactive",
  retired: "retired",
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
    ownershipScopeType: session.subdivisions.length ? "subdivision" : "unit",
    scopeId: session.subdivisions[0]?.id ?? session.units[0]?.id ?? "",
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

async function parseEnvelope<T>(response: Response, fallbackMessage: string) {
  const body = (await response.json()) as ApiEnvelope<T>;
  if (!response.ok || !body.success || body.data === undefined) {
    throw new Error(body.error ?? fallbackMessage);
  }
  return body.data;
}

function optionalString(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
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
  return value === "built_in" ? "built-in" : "standalone";
}

function formatScopeType(value: StandardRecord["ownershipScope"]["scopeType"] | StandardFormState["ownershipScopeType"]) {
  switch (value) {
    case "organization":
      return "organization";
    case "subdivision":
      return "subdivision";
    default:
      return "unit";
  }
}

function formatOperationType(value: JournalRecord["operationType"]) {
  return journalOperationOptions.find((item) => item.value === value)?.label ?? value;
}

function confirmArchiveAction(recordLabel: string) {
  if (typeof window === "undefined") {
    return false;
  }

  return window.confirm(
    `Архивировать ${recordLabel}?\n\nЗапись исчезнет из активных списков и останется доступной только при включенной видимости архива.`,
  );
}

function normalizeMeasuringInstrument(item: MeasuringInstrumentRecord): MeasuringInstrumentRecord {
  return {
    ...item,
    standards: Array.isArray(item.standards) ? item.standards : [],
  };
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
  const [loadError, setLoadError] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [mutationSuccess, setMutationSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const canManageRegistry =
    session.grant?.roleTemplate === "organization_admin" && session.workspace.scopeType === "organization";

  const activeEquipmentRecords = equipmentRecords.filter((item) => !item.archivedAt);
  const activeStandards = standards.filter((item) => !item.archivedAt);
  const selectedMeasuringInstrument =
    measuringInstruments.find((item) => item.id === selectedMeasuringInstrumentId) ?? null;
  const selectedStandard = standards.find((item) => item.id === selectedStandardId) ?? null;

  const loadRegistries = useCallback(async () => {
    setLoading(true);
    setLoadError(null);

    const search = showArchived ? "?includeArchived=true" : "";

    try {
      const [equipmentData, measuringInstrumentData, standardData] = await Promise.all([
        fetch(`/api/equipment${search}`, { cache: "no-store" }).then((response) =>
          parseEnvelope<EquipmentRecord[]>(response, "Не удалось загрузить equipment registry."),
        ),
        fetch(`/api/equipment/measuring-instruments${search}`, { cache: "no-store" }).then((response) =>
          parseEnvelope<MeasuringInstrumentRecord[]>(response, "Не удалось загрузить registry средств измерения."),
        ),
        fetch(`/api/equipment/standards${search}`, { cache: "no-store" }).then((response) =>
          parseEnvelope<StandardRecord[]>(response, "Не удалось загрузить standards registry."),
        ),
      ]);

      setEquipmentRecords(equipmentData);
      setMeasuringInstruments(measuringInstrumentData.map(normalizeMeasuringInstrument));
      setStandards(standardData);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Не удалось загрузить registry contour.");
    } finally {
      setLoading(false);
    }
  }, [showArchived]);

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
      standardForm.ownershipScopeType === "subdivision"
        ? session.subdivisions
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
  }, [session.subdivisions, session.units, standardForm.ownershipScopeType, standardForm.scopeId]);

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
    if (selectedMeasuringInstrumentId) {
      void loadMeasuringInstrumentJournals(selectedMeasuringInstrumentId);
    } else {
      setMeasuringInstrumentJournals([]);
    }
  }, [selectedMeasuringInstrumentId]);

  useEffect(() => {
    if (selectedStandardId) {
      void loadStandardJournals(selectedStandardId);
    } else {
      setStandardJournals([]);
    }
  }, [selectedStandardId]);

  async function loadMeasuringInstrumentJournals(id: string) {
    setLoadingMeasuringInstrumentJournals(true);
    try {
      const journals = await fetch(`/api/equipment/measuring-instruments/${id}/journals`, {
        cache: "no-store",
      }).then((response) =>
        parseEnvelope<JournalRecord[]>(response, "Не удалось загрузить журнал средства измерения."),
      );
      setMeasuringInstrumentJournals(journals);
    } catch (error) {
      setMutationError(error instanceof Error ? error.message : "Не удалось загрузить журнал средства измерения.");
    } finally {
      setLoadingMeasuringInstrumentJournals(false);
    }
  }

  async function loadStandardJournals(id: string) {
    setLoadingStandardJournals(true);
    try {
      const journals = await fetch(`/api/equipment/standards/${id}/journals`, {
        cache: "no-store",
      }).then((response) => parseEnvelope<JournalRecord[]>(response, "Не удалось загрузить журнал эталона."));
      setStandardJournals(journals);
    } catch (error) {
      setMutationError(error instanceof Error ? error.message : "Не удалось загрузить журнал эталона.");
    } finally {
      setLoadingStandardJournals(false);
    }
  }

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
      body: JSON.stringify({
        unitId: equipmentForm.unitId,
        manufacturer: equipmentForm.manufacturer,
        classification: equipmentForm.classification,
        model: equipmentForm.model,
        fullName: equipmentForm.fullName,
        factoryNumber: equipmentForm.factoryNumber,
        inventoryNumber: optionalString(equipmentForm.inventoryNumber),
        manufactureYear: Number(equipmentForm.manufactureYear),
        status: equipmentForm.status,
        comment: optionalString(equipmentForm.comment),
        documentUrl: optionalString(equipmentForm.documentUrl),
      }),
    });

    await parseEnvelope<EquipmentRecord>(response, "Не удалось создать equipment record.");
    setEquipmentForm(defaultEquipmentForm(session));
    await loadRegistries();
    setMutationSuccess("Equipment record создан и появился в реестре.");
  }

  async function createMeasuringInstrument() {
    const response = await fetch("/api/equipment/measuring-instruments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        unitId: measuringInstrumentForm.unitId,
        equipmentId:
          measuringInstrumentForm.placementKind === "built_in"
            ? optionalString(measuringInstrumentForm.equipmentId)
            : undefined,
        name: measuringInstrumentForm.name,
        instrumentType: measuringInstrumentForm.instrumentType,
        model: measuringInstrumentForm.model,
        registrationNumber: measuringInstrumentForm.registrationNumber,
        serialNumber: measuringInstrumentForm.serialNumber,
        placementKind: measuringInstrumentForm.placementKind,
        standardIds: measuringInstrumentForm.standardIds,
        comment: optionalString(measuringInstrumentForm.comment),
        documentUrl: optionalString(measuringInstrumentForm.documentUrl),
      }),
    });

    const created = await parseEnvelope<MeasuringInstrumentRecord>(
      response,
      "Не удалось создать record средства измерения.",
    );
    setMeasuringInstrumentForm(defaultMeasuringInstrumentForm(session));
    await loadRegistries();
    setSelectedMeasuringInstrumentId(created.id);
    setMutationSuccess("Средство измерения создано. Текущий метрологический статус теперь будет определяться журналом.");
  }

  async function createStandard() {
    const response = await fetch("/api/equipment/standards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subdivisionId:
          standardForm.ownershipScopeType === "subdivision" ? optionalString(standardForm.scopeId) : undefined,
        unitId: standardForm.ownershipScopeType === "unit" ? optionalString(standardForm.scopeId) : undefined,
        ownerLabel: optionalString(standardForm.ownerLabel),
        standardType: standardForm.standardType,
        model: standardForm.model,
        identifier: standardForm.identifier,
        serialNumber: optionalString(standardForm.serialNumber),
        metrologicalCharacteristics: standardForm.metrologicalCharacteristics,
        comment: optionalString(standardForm.comment),
        documentUrl: optionalString(standardForm.documentUrl),
      }),
    });

    const created = await parseEnvelope<StandardRecord>(response, "Не удалось создать standard record.");
    setStandardForm(defaultStandardForm(session));
    await loadRegistries();
    setSelectedStandardId(created.id);
    setMutationSuccess("Эталон создан. Действующий статус и срок поверки станут производными после записи в журнал.");
  }

  async function archiveEquipment(id: string) {
    const response = await fetch(`/api/equipment/${id}/archive`, {
      method: "POST",
    });
    await parseEnvelope<EquipmentRecord>(response, "Не удалось архивировать оборудование.");
    await loadRegistries();
    setMutationSuccess("Оборудование переведено в архив и исключено из активного реестра.");
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
    setMutationSuccess("Средство измерения переведено в архив и убрано из активных pickers.");
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
    setMutationSuccess("Эталон переведен в архив и исключен из активных связей.");
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
    setMutationSuccess("Запись журнала СИ сохранена. Производный статус и ближайшая дата пересчитаны.");
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
    setMutationSuccess("Запись журнала эталона сохранена. Производный статус и срок действия пересчитаны.");
  }

  function toggleStandard(id: string) {
    setMeasuringInstrumentForm((current) => ({
      ...current,
      standardIds: current.standardIds.includes(id)
        ? current.standardIds.filter((item) => item !== id)
        : [...current.standardIds, id],
    }));
  }

  function runMutation(task: () => Promise<void>, fallbackMessage: string) {
    startTransition(() => {
      setMutationError(null);
      setMutationSuccess(null);
      void task().catch((error) => {
        setMutationError(error instanceof Error ? error.message : fallbackMessage);
      });
    });
  }

  function runConfirmedArchive(task: () => Promise<void>, fallbackMessage: string, recordLabel: string) {
    if (!confirmArchiveAction(recordLabel)) {
      return;
    }

    runMutation(task, fallbackMessage);
  }

  function renderManageabilityNote() {
    if (canManageRegistry) {
      return (
        <div className="rounded-[var(--radius-xl)] border border-info-soft bg-info-soft/50 px-4 py-3 text-sm text-info-strong">
          Organization-scoped `organization_admin` видит активный и архивный контур, добавляет journal entries и
          архивирует записи без hard delete.
        </div>
      );
    }

    return (
      <div className="rounded-[var(--radius-xl)] border border-warning-soft bg-warning-soft/50 px-4 py-3 text-sm text-warning-strong">
        Текущий workspace остается read-only: активный/архивный список и journal history фильтруются по разрешенному
        subtree, а mutate surface скрыта.
      </div>
    );
  }

  function renderEquipmentTab() {
    return (
      <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className="gap-5" padding="lg">
          <div className="space-y-2">
            <Badge tone="interactive">Equipment registry</Badge>
            <div className="space-y-1">
              <h2 className="text-xl font-semibold text-foreground">Карточка оборудования</h2>
              <p className="text-sm leading-6 text-muted-foreground">
                Equipment остается отдельной карточкой. Archive-only lifecycle переводит запись из активного списка в
                явный архив без hard delete.
              </p>
            </div>
          </div>

          {canManageRegistry ? (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2.5">
                  <span className="text-sm font-medium text-foreground">Юнит владения</span>
                  <select
                    autoComplete="off"
                    className={selectClassName}
                    name="equipment-unit-id"
                    onChange={(event) =>
                      setEquipmentForm((current) => ({ ...current, unitId: event.target.value }))
                    }
                    value={equipmentForm.unitId}
                  >
                    {session.units.map((unit) => (
                      <option key={unit.id} value={unit.id}>
                        {unit.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-2.5">
                  <span className="text-sm font-medium text-foreground">Статус оборудования</span>
                  <select
                    autoComplete="off"
                    className={selectClassName}
                    name="equipment-status"
                    onChange={(event) =>
                      setEquipmentForm((current) => ({
                        ...current,
                        status: event.target.value as RegistryStatus,
                      }))
                    }
                    value={equipmentForm.status}
                  >
                    <option value="active">active</option>
                    <option value="inactive">inactive</option>
                    <option value="retired">retired</option>
                  </select>
                </label>
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
                <span className="text-sm font-medium text-foreground">Комментарий</span>
                <textarea
                  autoComplete="off"
                  className={textAreaClassName}
                  name="equipment-comment"
                  onChange={(event) =>
                    setEquipmentForm((current) => ({ ...current, comment: event.target.value }))
                  }
                  value={equipmentForm.comment}
                />
              </label>
              <Button
                fullWidth
                loading={isPending}
                onClick={() => runMutation(createEquipment, "Не удалось создать equipment record.")}
                type="button"
              >
                Создать оборудование
              </Button>
            </>
          ) : (
            <EmptyState
              detail="В этом scope новые equipment records не создаются. Пользователь видит только разрешенный registry contour."
              title="Mutate surface скрыта"
            />
          )}
        </Card>

        <Card className="gap-5" padding="lg">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <Badge tone="info">{showArchived ? "Active + archived" : "Active only"}</Badge>
              <h2 className="text-xl font-semibold text-foreground">Equipment list</h2>
            </div>
            <Button onClick={() => void loadRegistries()} rightIcon={<RefreshCw className="size-4" />} variant="secondary">
              Обновить
            </Button>
          </div>

          {!equipmentRecords.length && !loading ? (
            <EmptyState
              detail="Оборудование еще не зарегистрировано. Это валидное состояние и не требует обязательного payload со средствами измерения."
              title="Реестр оборудования пока пуст"
            />
          ) : null}

          <div className="grid gap-4">
            {equipmentRecords.map((item) => (
              <Card className="gap-4" key={item.id} padding="md" tone="muted">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <h3 className="text-lg font-semibold text-foreground">{item.fullName}</h3>
                    <p className="text-sm text-muted-foreground">
                      {item.manufacturer} • {item.classification} • {item.model}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge tone={statusToneMap[item.status]}>{statusLabelMap[item.status]}</Badge>
                    <Badge tone={item.measuringInstrumentCount ? "interactive" : "neutral"}>
                      СИ: {item.measuringInstrumentCount}
                    </Badge>
                    {item.archivedAt ? <Badge tone="neutral">archived</Badge> : null}
                  </div>
                </div>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {fieldDetail("Заводской номер", item.factoryNumber, true)}
                  {fieldDetail("Инвентарный номер", item.inventoryNumber, true)}
                  {fieldDetail("Год выпуска", item.manufactureYear)}
                  {fieldDetail("Юнит", item.unit.name)}
                  {fieldDetail("Подразделение", item.unit.subdivisionName)}
                  {fieldDetail("Архивирован", item.archivedAt ? formatTimestamp(item.archivedAt) : undefined)}
                </div>
                {item.comment || item.documentUrl ? (
                  <div className="grid gap-3 md:grid-cols-2">
                    {fieldDetail("Комментарий", item.comment)}
                    {fieldDetail("Документ", item.documentUrl)}
                  </div>
                ) : null}
                {canManageRegistry && !item.archivedAt ? (
                  <Button
                    fullWidth
                    leftIcon={<Archive className="size-4" />}
                    loading={isPending}
                    onClick={() =>
                      runConfirmedArchive(
                        () => archiveEquipment(item.id),
                        "Не удалось архивировать оборудование.",
                        `оборудование «${item.fullName}»`,
                      )
                    }
                    type="button"
                    variant="secondary"
                  >
                    Архивировать оборудование
                  </Button>
                ) : null}
              </Card>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  function renderMeasuringInstrumentTab() {
    return (
      <div className="grid gap-4">
        <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
          <Card className="gap-5" padding="lg">
            <div className="space-y-2">
              <Badge tone="interactive">Measuring instruments registry</Badge>
              <div className="space-y-1">
                <h2 className="text-xl font-semibold text-foreground">Карточка средства измерения</h2>
                <p className="text-sm leading-6 text-muted-foreground">
                  СИ создается как отдельная сущность. Метрологоческий статус после этого живет только как производный
                  view-model от журнала операций.
                </p>
              </div>
            </div>

            {canManageRegistry ? (
              <>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="grid gap-2.5">
                    <span className="text-sm font-medium text-foreground">Юнит</span>
                    <select
                      autoComplete="off"
                      className={selectClassName}
                      name="measuring-instrument-unit-id"
                      onChange={(event) =>
                        setMeasuringInstrumentForm((current) => ({ ...current, unitId: event.target.value }))
                      }
                      value={measuringInstrumentForm.unitId}
                    >
                      {session.units.map((unit) => (
                        <option key={unit.id} value={unit.id}>
                          {unit.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="grid gap-2.5">
                    <span className="text-sm font-medium text-foreground">Placement</span>
                    <select
                      autoComplete="off"
                      className={selectClassName}
                      name="measuring-instrument-placement-kind"
                      onChange={(event) =>
                        setMeasuringInstrumentForm((current) => ({
                          ...current,
                          placementKind: event.target.value as MeasuringInstrumentPlacement,
                          equipmentId: event.target.value === "built_in" ? current.equipmentId : "",
                        }))
                      }
                      value={measuringInstrumentForm.placementKind}
                    >
                      <option value="standalone">standalone</option>
                      <option value="built_in">built_in</option>
                    </select>
                  </label>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
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
                    label="Регистрационный номер"
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
                  <div className="rounded-[var(--radius-lg)] border border-border bg-muted/60 px-4 py-3 text-sm text-muted-foreground">
                    До первой journal entry статус и ближайшая дата не считаются вручную. После записи они становятся
                    производными от latest valid record.
                  </div>
                </div>
                <label className="grid gap-2.5">
                  <span className="text-sm font-medium text-foreground">Привязка к оборудованию</span>
                  <select
                    autoComplete="off"
                    className={selectClassName}
                    disabled={measuringInstrumentForm.placementKind !== "built_in" || !activeEquipmentRecords.length}
                    name="measuring-instrument-equipment-id"
                    onChange={(event) =>
                      setMeasuringInstrumentForm((current) => ({ ...current, equipmentId: event.target.value }))
                    }
                    value={measuringInstrumentForm.equipmentId}
                  >
                    <option value="">
                      {activeEquipmentRecords.length ? "Выберите equipment record" : "Нет активного оборудования"}
                    </option>
                    {activeEquipmentRecords
                      .filter((item) => item.unit.id === measuringInstrumentForm.unitId)
                      .map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.fullName}
                        </option>
                      ))}
                  </select>
                </label>
                <label className="grid gap-2.5">
                  <span className="text-sm font-medium text-foreground">Эталоны для reusable links</span>
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
                          <span className="space-y-1 text-sm">
                            <span className="block font-medium text-foreground" translate="no">
                              {item.standardType} • {item.identifier}
                            </span>
                            <span className="block text-muted-foreground">
                              {item.model} • {item.ownershipScope.label}
                            </span>
                          </span>
                        </label>
                      ))
                    ) : (
                      <EmptyState
                        detail="Активные эталоны отсутствуют. СИ можно создать и без связей, а archived records сюда не попадают."
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
                  <div className="rounded-[var(--radius-lg)] border border-border bg-muted/60 px-4 py-3 text-sm text-muted-foreground">
                    <div className="flex items-start gap-2">
                      <ShieldCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-accent" />
                      <p>
                        Built-in СИ требует equipment record из того же юнита. Standalone сохраняется без equipmentId.
                      </p>
                    </div>
                  </div>
                </div>
                <label className="grid gap-2.5">
                  <span className="text-sm font-medium text-foreground">Комментарий</span>
                  <textarea
                    autoComplete="off"
                    className={textAreaClassName}
                    name="measuring-instrument-comment"
                    onChange={(event) =>
                      setMeasuringInstrumentForm((current) => ({ ...current, comment: event.target.value }))
                    }
                    value={measuringInstrumentForm.comment}
                  />
                </label>
                <Button
                  fullWidth
                  loading={isPending}
                  onClick={() =>
                    runMutation(createMeasuringInstrument, "Не удалось создать record средства измерения.")
                  }
                  type="button"
                >
                  Создать средство измерения
                </Button>
              </>
            ) : (
              <EmptyState
                detail="Ниже остается только list visibility и journal history в рамках разрешенного scope. Создание СИ скрыто."
                title="Read-only registry"
              />
            )}
          </Card>

          <Card className="gap-5" padding="lg">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1">
                <Badge tone="info">{showArchived ? "Active + archived" : "Active only"}</Badge>
                <h2 className="text-xl font-semibold text-foreground">Measuring instruments list</h2>
              </div>
              <Button onClick={() => void loadRegistries()} rightIcon={<RefreshCw className="size-4" />} variant="secondary">
                Обновить
              </Button>
            </div>

            {!measuringInstruments.length && !loading ? (
              <EmptyState
                detail="Здесь появятся как standalone СИ, так и built-in записи, привязанные к equipment."
                title="Реестр средств измерения пока пуст"
              />
            ) : null}

            <div className="grid gap-4">
              {measuringInstruments.map((item) => (
                <Card className="gap-4" key={item.id} padding="md" tone="muted">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <h3 className="text-lg font-semibold text-foreground">{item.name}</h3>
                      <p className="text-sm text-muted-foreground">
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
                      {item.archivedAt ? <Badge tone="neutral">archived</Badge> : null}
                    </div>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {fieldDetail("Регистрационный номер", item.registrationNumber, true)}
                    {fieldDetail("Серийный номер", item.serialNumber, true)}
                    {fieldDetail("Юнит", item.unit.name)}
                    {fieldDetail("Built-in к оборудованию", item.equipment?.fullName)}
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
                      detail="Статус еще не подтвержден journal history. После первой записи в журнале текущий статус и срок станут производными."
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
                    <div className="flex justify-end">
                      <Button
                        leftIcon={<Archive className="size-4" />}
                        loading={isPending}
                        onClick={() =>
                          runConfirmedArchive(
                            () => archiveMeasuringInstrument(item.id),
                            "Не удалось архивировать средство измерения.",
                            `средство измерения «${item.name}»`,
                          )
                        }
                        type="button"
                        variant="secondary"
                      >
                        Архивировать СИ
                      </Button>
                    </div>
                  ) : null}
                </Card>
              ))}
            </div>
          </Card>
        </div>

        <Card className="gap-5" padding="lg">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <Badge tone="interactive">Metrology journal</Badge>
              <h2 className="text-xl font-semibold text-foreground">Журнал операций по СИ</h2>
            </div>
            <div className="min-w-64">
              <label className="grid gap-2.5">
                <span className="text-sm font-medium text-foreground">Выбранное средство измерения</span>
                <select
                  autoComplete="off"
                  className={selectClassName}
                  name="selected-measuring-instrument"
                  onChange={(event) => setSelectedMeasuringInstrumentId(event.target.value)}
                  value={selectedMeasuringInstrumentId}
                >
                  <option value="">Выберите запись</option>
                  {measuringInstruments.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} • {item.registrationNumber}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          {selectedMeasuringInstrument ? (
            <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
              <Card className="gap-4" padding="md" tone="muted">
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold text-foreground">{selectedMeasuringInstrument.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    Текущий статус: <span className="font-medium text-foreground">{statusLabelMap[selectedMeasuringInstrument.status]}</span>
                    {selectedMeasuringInstrument.nextDueDate
                      ? ` • действует до ${formatDate(selectedMeasuringInstrument.nextDueDate)}`
                      : " • срок пока не рассчитан"}
                  </p>
                </div>
                {canManageRegistry && !selectedMeasuringInstrument.archivedAt ? (
                  <>
                    <div className="grid gap-4 md:grid-cols-2">
                      <label className="grid gap-2.5">
                        <span className="text-sm font-medium text-foreground">Тип операции</span>
                        <select
                          autoComplete="off"
                          className={selectClassName}
                          name="mi-journal-operation-type"
                          onChange={(event) =>
                            setMeasuringInstrumentJournalForm((current) => ({
                              ...current,
                              operationType: event.target.value as JournalRecord["operationType"],
                            }))
                          }
                          value={measuringInstrumentJournalForm.operationType}
                        >
                          {journalOperationOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>
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
                    <label className="grid gap-2.5">
                      <span className="text-sm font-medium text-foreground">Комментарий</span>
                      <textarea
                        autoComplete="off"
                        className={textAreaClassName}
                        name="mi-journal-comment"
                        onChange={(event) =>
                          setMeasuringInstrumentJournalForm((current) => ({
                            ...current,
                            comment: event.target.value,
                          }))
                        }
                        value={measuringInstrumentJournalForm.comment}
                      />
                    </label>
                    <div className="flex flex-wrap gap-3">
                      <Button
                        loading={isPending}
                        onClick={() =>
                          runMutation(
                            createMeasuringInstrumentJournal,
                            "Не удалось добавить запись в журнал средства измерения.",
                          )
                        }
                        type="button"
                      >
                        Добавить запись журнала
                      </Button>
                      <Button
                        leftIcon={<Archive className="size-4" />}
                        loading={isPending}
                        onClick={() =>
                          runConfirmedArchive(
                            () => archiveMeasuringInstrument(selectedMeasuringInstrument.id),
                            "Не удалось архивировать средство измерения.",
                            `средство измерения «${selectedMeasuringInstrument.name}»`,
                          )
                        }
                        type="button"
                        variant="secondary"
                      >
                        Архивировать выбранное СИ
                      </Button>
                    </div>
                  </>
                ) : (
                  <EmptyState
                    detail={
                      selectedMeasuringInstrument.archivedAt
                        ? "Архивированное СИ остается доступным для истории, но новые journal entries в него не добавляются."
                        : "В текущем scope журнал можно только читать."
                    }
                    title="Mutate surface скрыта"
                  />
                )}
              </Card>

              <Card className="gap-4" padding="md" tone="muted">
                <div className="flex items-center justify-between gap-3">
                  <div className="space-y-1">
                    <Badge tone="info">History</Badge>
                    <h3 className="text-lg font-semibold text-foreground">Journal timeline</h3>
                  </div>
                  <Button
                    onClick={() => void loadMeasuringInstrumentJournals(selectedMeasuringInstrument.id)}
                    rightIcon={<RefreshCw className="size-4" />}
                    variant="secondary"
                  >
                    Обновить журнал
                  </Button>
                </div>
                {loadingMeasuringInstrumentJournals ? (
                  <EmptyState detail="Journal history средства измерения загружается." title="Загрузка журнала" />
                ) : (
                  <JournalTimeline
                    emptyDetail="Для выбранного СИ еще нет операций. После первой записи статус и срок станут производными."
                    emptyTitle="Журнал пока пуст"
                    journals={measuringInstrumentJournals}
                  />
                )}
              </Card>
            </div>
          ) : (
            <EmptyState
              detail="Выберите средство измерения из текущего scope, чтобы посмотреть journal history и производный статус."
              title="Журнал еще не выбран"
            />
          )}
        </Card>
      </div>
    );
  }

  function renderStandardsTab() {
    const scopeOptions =
      standardForm.ownershipScopeType === "subdivision" ? session.subdivisions : session.units;

    return (
      <div className="grid gap-4">
        <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
          <Card className="gap-5" padding="lg">
            <div className="space-y-2">
              <Badge tone="interactive">Standards registry</Badge>
              <div className="space-y-1">
                <h2 className="text-xl font-semibold text-foreground">Карточка эталона</h2>
                <p className="text-sm leading-6 text-muted-foreground">
                  Эталон остается отдельным reusable record. Его текущий статус и срок действия выводятся из journal
                  history, а архив существует отдельно от статуса.
                </p>
              </div>
            </div>

            {canManageRegistry ? (
              <>
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="grid gap-2.5">
                    <span className="text-sm font-medium text-foreground">Ownership scope</span>
                    <select
                      autoComplete="off"
                      className={selectClassName}
                      name="standard-ownership-scope"
                      onChange={(event) =>
                        setStandardForm((current) => ({
                          ...current,
                          ownershipScopeType: event.target.value as StandardFormState["ownershipScopeType"],
                        }))
                      }
                      value={standardForm.ownershipScopeType}
                    >
                      <option value="organization">organization</option>
                      <option value="subdivision" disabled={!session.subdivisions.length}>
                        subdivision
                      </option>
                      <option value="unit" disabled={!session.units.length}>
                        unit
                      </option>
                    </select>
                  </label>
                  <label className="grid gap-2.5">
                    <span className="text-sm font-medium text-foreground">Scope target</span>
                    <select
                      autoComplete="off"
                      className={selectClassName}
                      disabled={standardForm.ownershipScopeType === "organization"}
                      name="standard-scope-id"
                      onChange={(event) =>
                        setStandardForm((current) => ({ ...current, scopeId: event.target.value }))
                      }
                      value={standardForm.scopeId}
                    >
                      <option value="">
                        {standardForm.ownershipScopeType === "organization"
                          ? "Организация в целом"
                          : "Выберите точку владения"}
                      </option>
                      {scopeOptions.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  </label>
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
                    label="Owner label"
                    name="standard-owner-label"
                    onChange={(event) =>
                      setStandardForm((current) => ({ ...current, ownerLabel: event.target.value }))
                    }
                    value={standardForm.ownerLabel}
                  />
                  <div className="rounded-[var(--radius-lg)] border border-border bg-muted/60 px-4 py-3 text-sm text-muted-foreground">
                    Статус эталона вводить вручную не нужно. После первой journal entry статус и срок действия
                    выводятся из latest valid record.
                  </div>
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
                <label className="grid gap-2.5">
                  <span className="text-sm font-medium text-foreground">Метрологические характеристики</span>
                  <textarea
                    autoComplete="off"
                    className={textAreaClassName}
                    name="standard-metrological-characteristics"
                    onChange={(event) =>
                      setStandardForm((current) => ({
                        ...current,
                        metrologicalCharacteristics: event.target.value,
                      }))
                    }
                    value={standardForm.metrologicalCharacteristics}
                  />
                </label>
                <label className="grid gap-2.5">
                  <span className="text-sm font-medium text-foreground">Комментарий</span>
                  <textarea
                    autoComplete="off"
                    className={textAreaClassName}
                    name="standard-comment"
                    onChange={(event) =>
                      setStandardForm((current) => ({ ...current, comment: event.target.value }))
                    }
                    value={standardForm.comment}
                  />
                </label>
                <Button
                  fullWidth
                  loading={isPending}
                  onClick={() => runMutation(createStandard, "Не удалось создать standard record.")}
                  type="button"
                >
                  Создать эталон
                </Button>
              </>
            ) : (
              <EmptyState
                detail="Read-only пользователь видит только standards registry, доступный в его scope и через связанные СИ."
                title="Создание эталонов скрыто"
              />
            )}
          </Card>

          <Card className="gap-5" padding="lg">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1">
                <Badge tone="info">{showArchived ? "Active + archived" : "Active only"}</Badge>
                <h2 className="text-xl font-semibold text-foreground">Standards list</h2>
              </div>
              <Button onClick={() => void loadRegistries()} rightIcon={<RefreshCw className="size-4" />} variant="secondary">
                Обновить
              </Button>
            </div>

            {!standards.length && !loading ? (
              <EmptyState
                detail="После создания эталоны остаются отдельным реестром и могут использоваться повторно в нескольких СИ."
                title="Реестр эталонов пока пуст"
              />
            ) : null}

            <div className="grid gap-4">
              {standards.map((item) => (
                <Card className="gap-4" key={item.id} padding="md" tone="muted">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <h3 className="text-lg font-semibold text-foreground">
                        <span translate="no">
                          {item.standardType} • {item.identifier}
                        </span>
                      </h3>
                      <p className="text-sm text-muted-foreground">{item.model}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge tone={statusToneMap[item.status]}>{statusLabelMap[item.status]}</Badge>
                      <Badge tone={item.linkedMeasuringInstruments ? "interactive" : "neutral"}>
                        Связанные СИ: {item.linkedMeasuringInstruments}
                      </Badge>
                      {item.archivedAt ? <Badge tone="neutral">archived</Badge> : null}
                    </div>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {fieldDetail("Ownership scope", formatScopeType(item.ownershipScope.scopeType))}
                    {fieldDetail("Scope label", item.ownershipScope.label)}
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
                    <div className="flex justify-end">
                      <Button
                        leftIcon={<Archive className="size-4" />}
                        loading={isPending}
                        onClick={() =>
                          runConfirmedArchive(
                            () => archiveStandard(item.id),
                            "Не удалось архивировать эталон.",
                            `эталон «${item.identifier}»`,
                          )
                        }
                        type="button"
                        variant="secondary"
                      >
                        Архивировать эталон
                      </Button>
                    </div>
                  ) : null}
                </Card>
              ))}
            </div>
          </Card>
        </div>

        <Card className="gap-5" padding="lg">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <Badge tone="interactive">Metrology journal</Badge>
              <h2 className="text-xl font-semibold text-foreground">Журнал операций по эталонам</h2>
            </div>
            <div className="min-w-64">
              <label className="grid gap-2.5">
                <span className="text-sm font-medium text-foreground">Выбранный эталон</span>
                <select
                  autoComplete="off"
                  className={selectClassName}
                  name="selected-standard"
                  onChange={(event) => setSelectedStandardId(event.target.value)}
                  value={selectedStandardId}
                >
                  <option value="">Выберите запись</option>
                  {standards.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.standardType} • {item.identifier}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          {selectedStandard ? (
            <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
              <Card className="gap-4" padding="md" tone="muted">
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
                {canManageRegistry && !selectedStandard.archivedAt ? (
                  <>
                    <div className="grid gap-4 md:grid-cols-2">
                      <label className="grid gap-2.5">
                        <span className="text-sm font-medium text-foreground">Тип операции</span>
                        <select
                          autoComplete="off"
                          className={selectClassName}
                          name="standard-journal-operation-type"
                          onChange={(event) =>
                            setStandardJournalForm((current) => ({
                              ...current,
                              operationType: event.target.value as JournalRecord["operationType"],
                            }))
                          }
                          value={standardJournalForm.operationType}
                        >
                          {journalOperationOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>
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
                    <label className="grid gap-2.5">
                      <span className="text-sm font-medium text-foreground">Комментарий</span>
                      <textarea
                        autoComplete="off"
                        className={textAreaClassName}
                        name="standard-journal-comment"
                        onChange={(event) =>
                          setStandardJournalForm((current) => ({
                            ...current,
                            comment: event.target.value,
                          }))
                        }
                        value={standardJournalForm.comment}
                      />
                    </label>
                    <div className="flex flex-wrap gap-3">
                      <Button
                        loading={isPending}
                        onClick={() =>
                          runMutation(createStandardJournal, "Не удалось добавить запись в журнал эталона.")
                        }
                        type="button"
                      >
                        Добавить запись журнала
                      </Button>
                      <Button
                        leftIcon={<Archive className="size-4" />}
                        loading={isPending}
                        onClick={() =>
                          runConfirmedArchive(
                            () => archiveStandard(selectedStandard.id),
                            "Не удалось архивировать эталон.",
                            `эталон «${selectedStandard.identifier}»`,
                          )
                        }
                        type="button"
                        variant="secondary"
                      >
                        Архивировать выбранный эталон
                      </Button>
                    </div>
                  </>
                ) : (
                  <EmptyState
                    detail={
                      selectedStandard.archivedAt
                        ? "Архивированный эталон остается доступным для истории, но новые journal entries в него не добавляются."
                        : "В текущем scope журнал можно только читать."
                    }
                    title="Mutate surface скрыта"
                  />
                )}
              </Card>

              <Card className="gap-4" padding="md" tone="muted">
                <div className="flex items-center justify-between gap-3">
                  <div className="space-y-1">
                    <Badge tone="info">History</Badge>
                    <h3 className="text-lg font-semibold text-foreground">Journal timeline</h3>
                  </div>
                  <Button
                    onClick={() => void loadStandardJournals(selectedStandard.id)}
                    rightIcon={<RefreshCw className="size-4" />}
                    variant="secondary"
                  >
                    Обновить журнал
                  </Button>
                </div>
                {loadingStandardJournals ? (
                  <EmptyState detail="Journal history эталона загружается." title="Загрузка журнала" />
                ) : (
                  <JournalTimeline
                    emptyDetail="Для выбранного эталона еще нет операций. После первой записи статус и срок действия станут производными."
                    emptyTitle="Журнал пока пуст"
                    journals={standardJournals}
                  />
                )}
              </Card>
            </div>
          ) : (
            <EmptyState
              detail="Выберите эталон из текущего scope, чтобы посмотреть journal history и производный статус."
              title="Журнал еще не выбран"
            />
          )}
        </Card>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="gap-3" padding="md">
          <Badge icon={<Wrench className="size-4" />} tone="interactive">
            Equipment
          </Badge>
          <div className="text-3xl font-semibold text-foreground">{equipmentRecords.length}</div>
          <p className="text-sm text-muted-foreground">Отдельные equipment records с explicit archive state.</p>
        </Card>
        <Card className="gap-3" padding="md">
          <Badge icon={<Cable className="size-4" />} tone="interactive">
            Measuring instruments
          </Badge>
          <div className="text-3xl font-semibold text-foreground">{measuringInstruments.length}</div>
          <p className="text-sm text-muted-foreground">Производный metrology status из journal history.</p>
        </Card>
        <Card className="gap-3" padding="md">
          <Badge icon={<Ruler className="size-4" />} tone="interactive">
            Standards
          </Badge>
          <div className="text-3xl font-semibold text-foreground">{standards.length}</div>
          <p className="text-sm text-muted-foreground">Reusable эталоны с archive-only lifecycle.</p>
        </Card>
        <Card className="gap-3" padding="md">
          <Badge icon={<Building2 className="size-4" />} tone={canManageRegistry ? "success" : "warning"}>
            {canManageRegistry ? "organization-scope manage" : `${session.workspace.scopeType} read-only`}
          </Badge>
          <div className="text-lg font-semibold text-foreground">{session.workspace.scopeName}</div>
          <p className="text-sm text-muted-foreground">
            Видимость journal/archive contour фильтруется по текущему workspace и не расширяется вверх по иерархии.
          </p>
        </Card>
      </div>

      {renderManageabilityNote()}

      {loadError ? (
        <div
          aria-live="polite"
          className="rounded-[var(--radius-xl)] border border-destructive/20 bg-destructive-soft px-4 py-3 text-sm text-destructive"
        >
          {loadError}
        </div>
      ) : null}

      {mutationError ? (
        <div
          aria-live="polite"
          className="rounded-[var(--radius-xl)] border border-destructive/20 bg-destructive-soft px-4 py-3 text-sm text-destructive"
        >
          {mutationError}
        </div>
      ) : null}

      {mutationSuccess ? (
        <div
          aria-live="polite"
          className="rounded-[var(--radius-xl)] border border-success-soft bg-success-soft/50 px-4 py-3 text-sm text-success-strong"
        >
          {mutationSuccess}
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[0.82fr_1.18fr]">
        <Card className="gap-4" padding="lg">
          <div className="space-y-1">
            <Badge tone="info">Canonical route</Badge>
            <h2 className="text-lg font-semibold text-foreground">`/equipment` keeps one public contour</h2>
            <p className="text-sm leading-6 text-muted-foreground">
              Внутри одного route пользователь переключается между тремя отдельными registry surfaces и связанными
              journal/archive states без параллельных route families.
            </p>
          </div>
          <div className="grid gap-3">
            {tabMeta.map((tab) => {
              const Icon = tab.icon;
              const isActive = tab.key === activeTab;

              return (
                <button
                  className={`rounded-[var(--radius-xl)] border px-4 py-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/25 focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                    isActive
                      ? "border-accent bg-accent-soft/70 text-foreground"
                      : "border-border bg-card text-foreground hover:border-border-strong hover:bg-muted/60"
                  }`}
                  key={tab.key}
                  onClick={() => handleTabChange(tab.key)}
                  type="button"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex size-10 items-center justify-center rounded-full bg-background text-accent">
                      <Icon aria-hidden="true" className="size-4" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold">{tab.label}</span>
                        <Badge size="sm" tone={isActive ? "interactive" : "neutral"}>
                          {isActive ? "active tab" : "available"}
                        </Badge>
                      </div>
                      <p className="text-sm leading-6 text-muted-foreground">{tab.description}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </Card>

        <Card className="gap-4" padding="lg">
          <div className="flex items-start gap-3 rounded-[var(--radius-lg)] border border-border bg-muted/60 px-4 py-3 text-sm text-muted-foreground">
            <Layers3 aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-accent" />
            <p>
              Separate registries from slice-004 сохранены. Slice-005 только добавляет derived metrology truth, явный
              archive visibility и journal workspaces внутри того же `/equipment` contour.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-lg)] border border-border bg-card px-4 py-3">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge icon={<FileSpreadsheet className="size-4" />} tone={showArchived ? "warning" : "interactive"}>
                  {showArchived ? "Archive visibility enabled" : "Active visibility only"}
                </Badge>
              </div>
              <p className="text-sm leading-6 text-muted-foreground">
                По умолчанию архив скрыт из активных списков и pickers. Включайте его только для explicit archive
                review, не для обычной работы.
              </p>
            </div>
            <Button onClick={handleArchiveVisibilityChange} type="button" variant="secondary">
              {showArchived ? "Скрыть архив" : "Показать архив"}
            </Button>
          </div>
          {loading ? (
            <EmptyState
              detail="Registry records загружаются через public web boundary `/api/equipment*`."
              title="Loading registry contour"
            />
          ) : null}
          {!loading && activeTab === "equipment" ? renderEquipmentTab() : null}
          {!loading && activeTab === "mi" ? renderMeasuringInstrumentTab() : null}
          {!loading && activeTab === "standards" ? renderStandardsTab() : null}
        </Card>
      </div>
    </div>
  );
}
