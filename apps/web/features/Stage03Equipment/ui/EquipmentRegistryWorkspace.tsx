"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  Archive,
  Cable,
  ClipboardList,
  FileText,
  Gauge,
  ImageIcon,
  ImagePlus,
  ListChecks,
  MapPin,
  Network,
  Pencil,
  Plus,
  RotateCcw,
  Save,
  Trash2,
  Wrench,
} from "lucide-react";
import type {
  ApiEnvelope,
  ApiMeta,
  EquipmentPhotoRecord,
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
type JournalTargetKind = "technical" | "diagnostic";
type JournalTargetValue = `${JournalTargetKind}:${string}`;
type JournalTarget =
  | {
      kind: "technical";
      id: string;
      value: JournalTargetValue;
      label: string;
      record: EquipmentRecord;
      archivedAt?: string;
    }
  | {
      kind: "diagnostic";
      id: string;
      value: JournalTargetValue;
      label: string;
      record: MeasuringInstrumentRecord;
      archivedAt?: string;
    };

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
  targetValue: string;
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
      photos: EquipmentPhotoRecord[];
      photoDraft: PhotoDraftState;
    }
  | {
      kind: "measuringInstrument";
      recordId: string;
      recordLabel: string;
      form: MeasuringInstrumentFormState;
      photos: EquipmentPhotoRecord[];
      photoDraft: PhotoDraftState;
      standards: LinkedStandardRecord[];
      standardDrafts: DiagnosticStandardDraft[];
      removedStandardIds: string[];
    };

type PhotoSubjectKind = JournalTargetKind;

type PhotoDraftUpload = {
  localId: string;
  file: File;
  previewUrl: string;
};

type PhotoDraftState = {
  uploads: PhotoDraftUpload[];
  deletedPhotoIds: string[];
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

const equipmentPhotoAccept = "image/jpeg,image/png,image/webp";
const equipmentPhotoContentTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const equipmentPhotoMaxCount = 10;
const equipmentPhotoMaxSizeBytes = 5 * 1024 * 1024;
const technicalEquipmentFallbackImage = "/brand/illustrations/equipment/technical-wagon-lift.png";
const diagnosticEquipmentFallbackImage = "/brand/illustrations/equipment/diagnostic-ultrasonic-detector.png";

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

function defaultJournalForm(targetValue = ""): JournalFormState {
  return {
    targetValue,
    operationType: "verification",
    operationDate: new Date().toISOString().slice(0, 10),
    documentNumber: "",
    validUntil: "",
    executorOrganization: "",
    attachmentUrl: "",
    comment: "",
  };
}

function emptyPhotoDraft(): PhotoDraftState {
  return {
    uploads: [],
    deletedPhotoIds: [],
  };
}

function createLocalPhotoId() {
  return globalThis.crypto?.randomUUID() ?? `equipment-photo-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function revokePhotoDrafts(draft: PhotoDraftState) {
  for (const upload of draft.uploads) {
    URL.revokeObjectURL(upload.previewUrl);
  }
}

function activePhotoCount(photos: EquipmentPhotoRecord[], draft: PhotoDraftState) {
  return photos.filter((photo) => !draft.deletedPhotoIds.includes(photo.id)).length + draft.uploads.length;
}

function validatePhotoFiles(
  files: File[],
  availableSlots: number,
): { uploads: PhotoDraftUpload[]; errors: string[] } {
  const uploads: PhotoDraftUpload[] = [];
  const errors: string[] = [];

  for (const file of files) {
    if (!equipmentPhotoContentTypes.has(file.type)) {
      errors.push(`${file.name}: поддерживаются только JPEG, PNG или WebP.`);
      continue;
    }
    if (file.size > equipmentPhotoMaxSizeBytes) {
      errors.push(`${file.name}: файл больше 5 MB.`);
      continue;
    }
    if (uploads.length >= availableSlots) {
      errors.push(`Можно прикрепить не больше ${equipmentPhotoMaxCount} фото к одной записи.`);
      break;
    }
    uploads.push({
      localId: createLocalPhotoId(),
      file,
      previewUrl: URL.createObjectURL(file),
    });
  }

  return { uploads, errors };
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

function isJournalFormReady(form: JournalFormState) {
  return Boolean(
    form.targetValue &&
      form.operationDate &&
      form.documentNumber.trim() &&
      form.executorOrganization.trim(),
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

function formatOperationType(value: JournalRecord["operationType"]) {
  return journalOperationOptions.find((item) => item.value === value)?.label ?? value;
}

function normalizeMeasuringInstrument(item: MeasuringInstrumentRecord): MeasuringInstrumentRecord {
  return {
    ...item,
    photos: Array.isArray(item.photos) ? item.photos : [],
    standards: Array.isArray(item.standards) ? item.standards : [],
  };
}

function normalizeEquipmentRecord(item: EquipmentRecord): EquipmentRecord {
  return {
    ...item,
    journalCount: typeof item.journalCount === "number" ? item.journalCount : 0,
    photos: Array.isArray(item.photos) ? item.photos : [],
  };
}

function journalTargetValue(kind: JournalTargetKind, id: string): JournalTargetValue {
  return `${kind}:${id}`;
}

function journalEndpoint(target: Pick<JournalTarget, "id" | "kind">) {
  return target.kind === "technical"
    ? `/api/equipment/${target.id}/journals`
    : `/api/equipment/measuring-instruments/${target.id}/journals`;
}

function buildEquipmentRoute(showArchived: boolean) {
  const search = new URLSearchParams();
  if (showArchived) {
    search.set("archived", "1");
  }
  const query = search.toString();
  return query ? `/equipment?${query}` : "/equipment";
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

function EquipmentPhotoGallery({
  fallbackSrc,
  photos,
  title,
}: {
  fallbackSrc: string;
  photos: EquipmentPhotoRecord[];
  title: string;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [brokenUrls, setBrokenUrls] = useState<string[]>([]);
  const usablePhotos = photos.filter((photo) => !brokenUrls.includes(photo.url));
  const activePhoto = usablePhotos[activeIndex] ?? usablePhotos[0];
  const activeSrc = activePhoto?.url ?? fallbackSrc;
  const activeAlt = activePhoto ? `${title}: ${activePhoto.fileName}` : `${title}: иллюстрация оборудования`;
  const activePhotoIndex = activePhoto ? usablePhotos.findIndex((photo) => photo.id === activePhoto.id) : -1;
  const activePhotoPosition = activePhotoIndex >= 0 ? activePhotoIndex + 1 : 0;
  const hasMultiplePhotos = usablePhotos.length > 1;

  useEffect(() => {
    setActiveIndex(0);
    setBrokenUrls([]);
  }, [photos]);

  const markBrokenActivePhoto = () => {
    if (activePhoto) {
      setBrokenUrls((current) => Array.from(new Set([...current, activePhoto.url])));
    }
  };

  const renderActiveImage = (className?: string) => (
    <img
      alt={activeAlt}
      className={cn("h-full min-h-48 w-full bg-muted object-cover", className)}
      height={480}
      loading="lazy"
      onError={markBrokenActivePhoto}
      src={activeSrc}
      width={640}
    />
  );

  const renderPhotoCountBadge = () =>
    hasMultiplePhotos && activePhotoPosition ? (
      <Badge className="bg-card/95 tabular-nums" icon={<ImageIcon className="size-3.5" />} size="sm" tone="neutral">
        {activePhotoPosition}/{usablePhotos.length}
      </Badge>
    ) : null;

  const renderThumbnailButton = (
    photo: EquipmentPhotoRecord,
    index: number,
    className: string,
    imageClassName = "h-full w-full object-cover",
  ) => {
    const active = activePhoto?.id === photo.id;

    return (
      <button
        aria-current={active ? "true" : undefined}
        aria-label={`Показать фото ${index + 1}: ${photo.fileName}`}
        className={cn(
          "relative min-w-0 touch-manipulation overflow-hidden bg-muted transition-colors focus-visible:z-10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
          className,
        )}
        key={photo.id}
        onClick={() => setActiveIndex(index)}
        type="button"
      >
        <img
          alt=""
          className={imageClassName}
          height={160}
          loading="lazy"
          onError={() => {
            setBrokenUrls((current) => Array.from(new Set([...current, photo.url])));
          }}
          src={photo.url}
          width={160}
        />
        {active ? <span aria-hidden="true" className="absolute inset-0 ring-2 ring-inset ring-ring" /> : null}
      </button>
    );
  };

  return (
    <div
      className="relative h-full min-h-64 min-w-0 overflow-hidden bg-muted"
      data-testid={photos.length ? "equipment-photo-gallery" : "equipment-photo-fallback"}
    >
      {renderActiveImage("min-h-64")}
      {hasMultiplePhotos ? <div className="absolute left-3 top-3">{renderPhotoCountBadge()}</div> : null}

      {hasMultiplePhotos ? (
        <div
          aria-label={`Фотографии ${title}`}
          className="absolute bottom-3 left-1/2 flex max-w-[calc(100%-1.5rem)] -translate-x-1/2 gap-1.5 overflow-x-auto rounded-[var(--radius-md)] border border-slate-200/20 bg-slate-700/75 p-1.5 shadow-lg"
        >
          {usablePhotos.map((photo, index) =>
            renderThumbnailButton(
              photo,
              index,
              "h-[60px] w-20 flex-none rounded-[var(--radius-sm)] border border-border/80",
            ),
          )}
        </div>
      ) : null}
    </div>
  );
}

function EquipmentPhotoDraftField({
  disabled,
  draft,
  idPrefix,
  onAddFiles,
  onMarkDeleted,
  onRemoveUpload,
  onRestoreDeleted,
  photos,
}: {
  disabled: boolean;
  draft: PhotoDraftState;
  idPrefix: string;
  onAddFiles: (files: File[]) => void;
  onMarkDeleted?: (photoId: string) => void;
  onRemoveUpload: (localId: string) => void;
  onRestoreDeleted?: (photoId: string) => void;
  photos?: EquipmentPhotoRecord[];
}) {
  const currentPhotos = photos ?? [];
  const total = activePhotoCount(currentPhotos, draft);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="grid gap-3 rounded-[var(--radius-lg)] border border-border bg-muted/30 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-foreground">Фото оборудования</p>
            <Badge size="sm" tone="neutral">
              {total}/{equipmentPhotoMaxCount}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">JPEG, PNG или WebP до 5&nbsp;MB.</p>
        </div>
        <Button
          disabled={disabled}
          leftIcon={<ImagePlus className="size-4" />}
          onClick={() => inputRef.current?.click()}
          size="sm"
          type="button"
          variant="secondary"
        >
          Добавить фото
        </Button>
        <input
          accept={equipmentPhotoAccept}
          aria-label="Добавить фото"
          className="sr-only"
          disabled={disabled}
          multiple
          name={`${idPrefix}-photos`}
          onChange={(event) => {
            onAddFiles(Array.from(event.target.files ?? []));
            event.currentTarget.value = "";
          }}
          ref={inputRef}
          tabIndex={-1}
          type="file"
        />
      </div>

      {currentPhotos.length || draft.uploads.length ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {currentPhotos.map((photo) => {
            const pendingDelete = draft.deletedPhotoIds.includes(photo.id);
            return (
              <div
                className={cn(
                  "grid gap-2 rounded-[var(--radius-md)] border bg-card p-2",
                  pendingDelete ? "border-destructive/40 bg-destructive-soft/40" : "border-border",
                )}
                key={photo.id}
              >
                <img
                  alt={photo.fileName}
                  className={cn(
                    "aspect-[4/3] w-full rounded-[var(--radius-sm)] bg-muted object-cover",
                    pendingDelete && "opacity-45 grayscale",
                  )}
                  height={240}
                  loading="lazy"
                  src={photo.url}
                  width={320}
                />
                <div className="flex min-w-0 items-center justify-between gap-2">
                  <div className="min-w-0">
                    <span className="block truncate text-sm font-medium text-foreground">{photo.fileName}</span>
                    {pendingDelete ? (
                      <Badge className="mt-1" size="sm" tone="danger">
                        Будет удалено
                      </Badge>
                    ) : null}
                  </div>
                  {pendingDelete ? (
                    <Button
                      aria-label={`Вернуть фото ${photo.fileName}`}
                      leftIcon={<RotateCcw className="size-4" />}
                      onClick={() => onRestoreDeleted?.(photo.id)}
                      size="sm"
                      type="button"
                      variant="secondary"
                    >
                      Вернуть
                    </Button>
                  ) : (
                    <Button
                      aria-label={`Удалить фото ${photo.fileName}`}
                      leftIcon={<Trash2 className="size-4" />}
                      onClick={() => onMarkDeleted?.(photo.id)}
                      size="sm"
                      type="button"
                      variant="ghost"
                    >
                      Удалить
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
          {draft.uploads.map((upload) => (
            <div
              className="grid gap-2 rounded-[var(--radius-md)] border border-ring/30 bg-card p-2"
              key={upload.localId}
            >
              <img
                alt={upload.file.name}
                className="aspect-[4/3] w-full rounded-[var(--radius-sm)] bg-muted object-cover"
                height={240}
                loading="lazy"
                src={upload.previewUrl}
                width={320}
              />
              <div className="flex min-w-0 items-center justify-between gap-2">
                <div className="min-w-0">
                  <span className="block truncate text-sm font-medium text-foreground">{upload.file.name}</span>
                  <Badge className="mt-1" size="sm" tone="interactive">
                    Новое
                  </Badge>
                </div>
                <Button
                  aria-label={`Убрать новое фото ${upload.file.name}`}
                  leftIcon={<Trash2 className="size-4" />}
                  onClick={() => onRemoveUpload(upload.localId)}
                  size="sm"
                  type="button"
                  variant="ghost"
                >
                  Убрать
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState detail="Карточку можно сохранить без фото." title="Фото пока не добавлены" />
      )}
    </div>
  );
}

function EquipmentPassportCard({
  actions,
  badges,
  fullWidthSections,
  icon,
  intrinsicClassName,
  label,
  media,
  primarySections,
  secondarySections,
  subtitle,
  title,
}: {
  actions?: ReactNode;
  badges: ReactNode;
  fullWidthSections?: EquipmentPassportSection[];
  icon?: ReactNode;
  intrinsicClassName: string;
  label: string;
  media: ReactNode;
  primarySections: EquipmentPassportSection[];
  secondarySections?: EquipmentPassportSection[];
  subtitle: string;
  title: string;
}) {
  const hasSecondarySections = Boolean(secondarySections?.length);
  const hasFullWidthSections = Boolean(fullWidthSections?.length);

  return (
    <Card className={cn("equipment-passport-card gap-5 [content-visibility:auto]", intrinsicClassName)} padding="md" tone="muted">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          {icon ? (
            <span className="flex size-14 shrink-0 items-center justify-center rounded-[var(--radius-lg)] border border-border bg-muted/70 text-muted-foreground">
              {icon}
            </span>
          ) : null}
          <div className="min-w-0 space-y-1">
            <h3 className="break-words text-pretty text-xl font-semibold leading-7 text-foreground">{title}</h3>
            <p className="break-words text-sm leading-6 text-muted-foreground">{subtitle}</p>
          </div>
        </div>
        <div className="flex min-w-0 flex-wrap gap-2">
          <Badge tone="neutral">{label}</Badge>
          {badges}
        </div>
      </div>

      <div
        className={cn(
          "equipment-passport-layout equipment-passport-layout--with-media",
          hasSecondarySections && "equipment-passport-layout--split",
        )}
      >
        <div className="equipment-passport-media min-w-0">{media}</div>
        <div className="equipment-passport-main space-y-4 p-4">{renderPassportSections(primarySections)}</div>
        {hasSecondarySections ? (
          <div className="equipment-passport-aside p-4">
            <div className="grid gap-4">{renderPassportSections(secondarySections ?? [])}</div>
          </div>
        ) : null}
        {hasFullWidthSections ? (
          <div className="equipment-passport-full p-4">{renderPassportSections(fullWidthSections ?? [])}</div>
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
  onAddPhotoFiles,
  onCancel,
  onChange,
  onMarkPhotoDeleted,
  onRemovePhotoUpload,
  onRestorePhotoDeleted,
  onSubmit,
  session,
}: {
  editor: EditDialogState | null;
  loading: boolean;
  onAddPhotoFiles: (files: File[]) => void;
  onCancel: () => void;
  onChange: (next: EditDialogState) => void;
  onMarkPhotoDeleted: (photoId: string) => void;
  onRemovePhotoUpload: (localId: string) => void;
  onRestorePhotoDeleted: (photoId: string) => void;
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
          required
          value={state.form.unitId}
        />
        <SelectField
          label="Статус оборудования"
          name="edit-equipment-status"
          onChange={(event) => updateEquipmentForm({ status: event.target.value as RegistryStatus })}
          options={registryStatusOptions}
          required
          value={state.form.status}
        />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <InputField
          autoComplete={defaultAutoComplete("text")}
          label="Производитель"
          name="edit-equipment-manufacturer"
          onChange={(event) => updateEquipmentForm({ manufacturer: event.target.value })}
          required
          value={state.form.manufacturer}
        />
        <InputField
          autoComplete={defaultAutoComplete("text")}
          label="Класс / тип"
          name="edit-equipment-classification"
          onChange={(event) => updateEquipmentForm({ classification: event.target.value })}
          required
          value={state.form.classification}
        />
        <InputField
          autoComplete={defaultAutoComplete("text")}
          label="Модель"
          name="edit-equipment-model"
          onChange={(event) => updateEquipmentForm({ model: event.target.value })}
          required
          value={state.form.model}
        />
        <InputField
          autoComplete={defaultAutoComplete("number")}
          inputMode="numeric"
          label="Год выпуска"
          name="edit-equipment-manufacture-year"
          onChange={(event) => updateEquipmentForm({ manufactureYear: event.target.value })}
          required
          type="number"
          value={state.form.manufactureYear}
        />
        <InputField
          autoComplete={defaultAutoComplete("text")}
          label="Полное наименование"
          name="edit-equipment-full-name"
          onChange={(event) => updateEquipmentForm({ fullName: event.target.value })}
          required
          value={state.form.fullName}
        />
        <InputField
          autoComplete={defaultAutoComplete("text")}
          label="Заводской номер"
          name="edit-equipment-factory-number"
          onChange={(event) => updateEquipmentForm({ factoryNumber: event.target.value })}
          required
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
      <EquipmentPhotoDraftField
        disabled={loading}
        draft={state.photoDraft}
        idPrefix="edit-equipment"
        onAddFiles={onAddPhotoFiles}
        onMarkDeleted={onMarkPhotoDeleted}
        onRemoveUpload={onRemovePhotoUpload}
        onRestoreDeleted={onRestorePhotoDeleted}
        photos={state.photos}
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
        required
        value={state.form.unitId}
      />
      <div className="grid gap-4 md:grid-cols-2">
        <InputField
          autoComplete={defaultAutoComplete("text")}
          label="Наименование"
          name="edit-measuring-instrument-name"
          onChange={(event) => updateMeasuringInstrumentForm({ name: event.target.value })}
          required
          value={state.form.name}
        />
        <InputField
          autoComplete={defaultAutoComplete("text")}
          label="Тип / класс"
          name="edit-measuring-instrument-type"
          onChange={(event) => updateMeasuringInstrumentForm({ instrumentType: event.target.value })}
          required
          value={state.form.instrumentType}
        />
        <InputField
          autoComplete={defaultAutoComplete("text")}
          label="Модель"
          name="edit-measuring-instrument-model"
          onChange={(event) => updateMeasuringInstrumentForm({ model: event.target.value })}
          required
          value={state.form.model}
        />
        <InputField
          autoComplete={defaultAutoComplete("text")}
          label="ФИФ"
          name="edit-measuring-instrument-registration-number"
          onChange={(event) => updateMeasuringInstrumentForm({ registrationNumber: event.target.value })}
          required
          spellCheck={false}
          translate="no"
          value={state.form.registrationNumber}
        />
        <InputField
          autoComplete={defaultAutoComplete("text")}
          label="Серийный номер"
          name="edit-measuring-instrument-serial-number"
          onChange={(event) => updateMeasuringInstrumentForm({ serialNumber: event.target.value })}
          required
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
                    required
                    value={draft.standardType}
                  />
                  <InputField
                    autoComplete={defaultAutoComplete("text")}
                    label="Модель"
                    name={`edit-diagnostic-standard-model-${draft.localId}`}
                    onChange={(event) => updateEditStandardDraft(draft.localId, { model: event.target.value })}
                    required
                    value={draft.model}
                  />
                  <InputField
                    autoComplete={defaultAutoComplete("text")}
                    label="Идентификатор"
                    name={`edit-diagnostic-standard-identifier-${draft.localId}`}
                    onChange={(event) => updateEditStandardDraft(draft.localId, { identifier: event.target.value })}
                    required
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
                  required
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
      <EquipmentPhotoDraftField
        disabled={loading}
        draft={state.photoDraft}
        idPrefix="edit-measuring-instrument"
        onAddFiles={onAddPhotoFiles}
        onMarkDeleted={onMarkPhotoDeleted}
        onRemoveUpload={onRemovePhotoUpload}
        onRestoreDeleted={onRestorePhotoDeleted}
        photos={state.photos}
      />
    </div>
  );

  return (
    <Dialog
      description={editor.recordLabel}
      dismissible={!loading}
      footer={
        <div className="flex flex-wrap justify-end gap-3">
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
    <ol className="grid gap-3">
      {journals.map((journal) => (
        <li className="rounded-[var(--radius-md)] border border-border bg-card/70 px-3 py-3" key={journal.id}>
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
          <dl className="mt-3 grid gap-3 sm:grid-cols-2">
            {passportDetail("Исполнитель", journal.executorOrganization)}
            {passportDetail("Вложение", journal.attachmentUrl, true)}
          </dl>
          {journal.comment ? (
            <p className="mt-3 border-t border-border pt-3 text-sm leading-6 text-foreground">
              {journal.comment}
            </p>
          ) : null}
        </li>
      ))}
    </ol>
  );
}

function buildDiagnosticPrimarySections(
  item: MeasuringInstrumentRecord,
  {
    extraSections = [],
    includeDueDate = false,
  }: {
    extraSections?: EquipmentPassportSection[];
    includeDueDate?: boolean;
  } = {},
): EquipmentPassportSection[] {
  return [
    {
      id: "diagnostic-requisites",
      title: "Реквизиты записи",
      icon: <ClipboardList aria-hidden="true" className="size-4" />,
      children: (
        <dl className="grid gap-3 sm:grid-cols-2">
          {passportDetail("ФИФ", item.registrationNumber, true)}
          {passportDetail("Серийный номер", item.serialNumber, true)}
          {passportDetail("Тип", item.instrumentType)}
          {passportDetail("Модель", item.model)}
          {passportDetail("Юнит", item.unit.name)}
          {passportDetail("Связанное оборудование", item.equipment?.fullName)}
          {includeDueDate
            ? passportDetail("Действует до", item.nextDueDate ? formatDate(item.nextDueDate) : undefined)
            : null}
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
    ...extraSections,
  ];
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
  const [createPhotoDraft, setCreatePhotoDraft] = useState<PhotoDraftState>(() => emptyPhotoDraft());
  const [diagnosticStandardDrafts, setDiagnosticStandardDrafts] = useState<DiagnosticStandardDraft[]>([]);
  const [journalForm, setJournalForm] = useState(defaultJournalForm);
  const [selectedJournalTargetValue, setSelectedJournalTargetValue] = useState("");
  const [journalEntries, setJournalEntries] = useState<JournalRecord[]>([]);
  const [loadingJournalEntries, setLoadingJournalEntries] = useState(false);
  const [loading, setLoading] = useState(true);
  const hasLoadedRegistriesRef = useRef(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [archiveConfirmation, setArchiveConfirmation] = useState<ArchiveConfirmation | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [journalCreateDialogOpen, setJournalCreateDialogOpen] = useState(false);
  const [editDialog, setEditDialog] = useState<EditDialogState | null>(null);
  const [mutationInFlight, setMutationInFlight] = useState(false);
  const [isPending, startTransition] = useTransition();
  const createPhotoDraftRef = useRef(createPhotoDraft);
  const editDialogRef = useRef(editDialog);

  const canManageRegistry = sessionHasCapability(session, "manage_equipment");
  const journalTargets = useMemo<JournalTarget[]>(
    () => [
      ...equipmentRecords.map((item) => ({
        kind: "technical" as const,
        id: item.id,
        value: journalTargetValue("technical", item.id),
        label: `Техническое • ${item.fullName} • ${item.factoryNumber}`,
        record: item,
        archivedAt: item.archivedAt,
      })),
      ...measuringInstruments.map((item) => ({
        kind: "diagnostic" as const,
        id: item.id,
        value: journalTargetValue("diagnostic", item.id),
        label: `Диагностическое • ${item.name} • ${item.registrationNumber}`,
        record: item,
        archivedAt: item.archivedAt,
      })),
    ],
    [equipmentRecords, measuringInstruments],
  );
  const activeJournalTargets = journalTargets.filter((item) => !item.archivedAt);
  const selectedJournalTarget = journalTargets.find((item) => item.value === selectedJournalTargetValue) ?? null;
  const isMutating = isPending || mutationInFlight;
  const unifiedEquipmentCount = equipmentRecords.length + measuringInstruments.length;
  const canCreateJournalEntry =
    canManageRegistry &&
    Boolean(selectedJournalTarget && !selectedJournalTarget.archivedAt && activeJournalTargets.length);

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

  useEffect(() => {
    createPhotoDraftRef.current = createPhotoDraft;
  }, [createPhotoDraft]);

  useEffect(() => {
    editDialogRef.current = editDialog;
  }, [editDialog]);

  useEffect(
    () => () => {
      revokePhotoDrafts(createPhotoDraftRef.current);
      if (editDialogRef.current) {
        revokePhotoDrafts(editDialogRef.current.photoDraft);
      }
    },
    [],
  );

  const reportPhotoDraftErrors = useCallback((errors: string[]) => {
    if (!errors.length) {
      return;
    }
    showToast({
      dedupeKey: "equipment-photo-draft-error",
      description: errors.slice(0, 3).join(" "),
      title: "Фото не добавлено.",
      tone: "error",
    });
  }, [showToast]);

  function appendCreatePhotoFiles(files: File[]) {
    if (!files.length) {
      return;
    }
    setCreatePhotoDraft((current) => {
      const availableSlots = equipmentPhotoMaxCount - activePhotoCount([], current);
      const { uploads, errors } = validatePhotoFiles(files, Math.max(availableSlots, 0));
      reportPhotoDraftErrors(errors);
      return uploads.length ? { ...current, uploads: [...current.uploads, ...uploads] } : current;
    });
  }

  function removeCreatePhotoUpload(localId: string) {
    setCreatePhotoDraft((current) => {
      const upload = current.uploads.find((item) => item.localId === localId);
      if (upload) {
        URL.revokeObjectURL(upload.previewUrl);
      }
      return {
        ...current,
        uploads: current.uploads.filter((item) => item.localId !== localId),
      };
    });
  }

  function resetCreatePhotoDraft() {
    revokePhotoDrafts(createPhotoDraftRef.current);
    setCreatePhotoDraft(emptyPhotoDraft());
  }

  function closeCreateDialog() {
    resetCreatePhotoDraft();
    setCreateDialogOpen(false);
  }

  function closeEditDialog() {
    if (editDialogRef.current) {
      revokePhotoDrafts(editDialogRef.current.photoDraft);
    }
    setEditDialog(null);
  }

  function appendEditPhotoFiles(files: File[]) {
    if (!files.length || !editDialogRef.current) {
      return;
    }
    setEditDialog((current) => {
      if (!current) {
        return current;
      }
      const availableSlots = equipmentPhotoMaxCount - activePhotoCount(current.photos, current.photoDraft);
      const { uploads, errors } = validatePhotoFiles(files, Math.max(availableSlots, 0));
      reportPhotoDraftErrors(errors);
      return uploads.length
        ? { ...current, photoDraft: { ...current.photoDraft, uploads: [...current.photoDraft.uploads, ...uploads] } }
        : current;
    });
  }

  function removeEditPhotoUpload(localId: string) {
    setEditDialog((current) => {
      if (!current) {
        return current;
      }
      const upload = current.photoDraft.uploads.find((item) => item.localId === localId);
      if (upload) {
        URL.revokeObjectURL(upload.previewUrl);
      }
      return {
        ...current,
        photoDraft: {
          ...current.photoDraft,
          uploads: current.photoDraft.uploads.filter((item) => item.localId !== localId),
        },
      };
    });
  }

  function markEditPhotoDeleted(photoId: string) {
    setEditDialog((current) => {
      if (!current || current.photoDraft.deletedPhotoIds.includes(photoId)) {
        return current;
      }
      return {
        ...current,
        photoDraft: {
          ...current.photoDraft,
          deletedPhotoIds: [...current.photoDraft.deletedPhotoIds, photoId],
        },
      };
    });
  }

  function restoreEditPhotoDeleted(photoId: string) {
    setEditDialog((current) => {
      if (!current) {
        return current;
      }
      return {
        ...current,
        photoDraft: {
          ...current.photoDraft,
          deletedPhotoIds: current.photoDraft.deletedPhotoIds.filter((id) => id !== photoId),
        },
      };
    });
  }

  async function uploadEquipmentPhoto(subject: PhotoSubjectKind, recordId: string, file: File) {
    const body = new FormData();
    body.append("photo", file);
    const basePath =
      subject === "technical"
        ? `/api/equipment/${recordId}/photos`
        : `/api/equipment/measuring-instruments/${recordId}/photos`;

    const response = await fetch(basePath, {
      method: "POST",
      body,
    });

    return parseEnvelope<EquipmentPhotoRecord>(response, "Не удалось загрузить фото оборудования.");
  }

  async function deleteEquipmentPhoto(subject: PhotoSubjectKind, recordId: string, photoId: string) {
    const basePath =
      subject === "technical"
        ? `/api/equipment/${recordId}/photos/${photoId}`
        : `/api/equipment/measuring-instruments/${recordId}/photos/${photoId}`;

    const response = await fetch(basePath, {
      method: "DELETE",
    });

    await parseEnvelope<EquipmentPhotoRecord>(response, "Не удалось удалить фото оборудования.");
  }

  async function applyPhotoDraft(subject: PhotoSubjectKind, recordId: string, draft: PhotoDraftState) {
    for (const photoId of draft.deletedPhotoIds) {
      await deleteEquipmentPhoto(subject, recordId, photoId);
    }
    for (const upload of draft.uploads) {
      await uploadEquipmentPhoto(subject, recordId, upload.file);
    }
  }

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

      setEquipmentRecords(equipmentData.map(normalizeEquipmentRecord));
      setMeasuringInstruments(measuringInstrumentData.map(normalizeMeasuringInstrument));
      hasLoadedRegistriesRef.current = true;
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Не удалось загрузить данные реестров.");
    } finally {
      setLoading(false);
    }
  }, [showArchived]);

  const loadJournalEntries = useCallback(async (target: JournalTarget) => {
    setLoadingJournalEntries(true);
    try {
      const journals = await fetch(journalEndpoint(target), {
        cache: "no-store",
      }).then((response) => parseEnvelope<JournalRecord[]>(response, "Не удалось загрузить журнал оборудования."));
      setJournalEntries(journals);
    } catch (error) {
      showErrorToast("Не удалось загрузить журнал оборудования.", error, "equipment-journals-load-error");
    } finally {
      setLoadingJournalEntries(false);
    }
  }, [showErrorToast]);

  useEffect(() => {
    setShowArchived(initialShowArchived);
  }, [initialShowArchived]);

  useEffect(() => {
    void loadRegistries();
  }, [loadRegistries]);

  useEffect(() => {
    if (!journalTargets.length) {
      if (selectedJournalTargetValue !== "") {
        setSelectedJournalTargetValue("");
      }
      return;
    }

    if (!journalTargets.some((item) => item.value === selectedJournalTargetValue)) {
      setSelectedJournalTargetValue(journalTargets[0]?.value ?? "");
    }
  }, [journalTargets, selectedJournalTargetValue]);

  useEffect(() => {
    if (selectedJournalTarget) {
      void loadJournalEntries(selectedJournalTarget);
    } else {
      setJournalEntries([]);
    }
  }, [loadJournalEntries, selectedJournalTarget]);

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

    const created = await parseEnvelope<EquipmentRecord>(response, "Не удалось создать карточку оборудования.");
    await applyPhotoDraft("technical", created.id, createPhotoDraft);
    setEquipmentForm(defaultEquipmentForm(session));
    resetCreatePhotoDraft();
    await loadRegistries();
    setSelectedJournalTargetValue(journalTargetValue("technical", created.id));
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
    await applyPhotoDraft("diagnostic", created.id, createPhotoDraft);

    setMeasuringInstrumentForm(defaultMeasuringInstrumentForm(session));
    resetCreatePhotoDraft();
    setDiagnosticStandardDrafts([]);
    await loadRegistries();
    setSelectedJournalTargetValue(journalTargetValue("diagnostic", created.id));
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
      photos: record.photos ?? [],
      photoDraft: emptyPhotoDraft(),
    });
  }

  function openMeasuringInstrumentEditor(record: MeasuringInstrumentRecord) {
    setEditDialog({
      kind: "measuringInstrument",
      recordId: record.id,
      recordLabel: record.name,
      form: measuringInstrumentFormFromRecord(record),
      photos: record.photos ?? [],
      photoDraft: emptyPhotoDraft(),
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
      await applyPhotoDraft("technical", editDialog.recordId, editDialog.photoDraft);
      await loadRegistries();
      closeEditDialog();
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
      await applyPhotoDraft("diagnostic", updated.id, editDialog.photoDraft);
      await loadRegistries();
      setSelectedJournalTargetValue(journalTargetValue("diagnostic", updated.id));
      closeEditDialog();
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
    const selectedValue = journalTargetValue("diagnostic", id);
    if (selectedJournalTargetValue === selectedValue) {
      const selected = journalTargets.find((item) => item.value === selectedValue);
      if (selected) {
        await loadJournalEntries(selected);
      }
    }
    showSuccessToast(
      "Диагностическое оборудование переведено в архив и убрано из активного списка.",
      "equipment-mi-archive-success",
    );
  }

  async function createJournalEntry() {
    const target = activeJournalTargets.find((item) => item.value === journalForm.targetValue);

    if (!target) {
      throw new Error("Сначала выберите оборудование для журнала.");
    }

    const response = await fetch(journalEndpoint(target), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        operationType: journalForm.operationType,
        operationDate: journalForm.operationDate,
        documentNumber: journalForm.documentNumber,
        validUntil: optionalString(journalForm.validUntil),
        executorOrganization: journalForm.executorOrganization,
        attachmentUrl: optionalString(journalForm.attachmentUrl),
        comment: optionalString(journalForm.comment),
      }),
    });

    await parseEnvelope<JournalRecord>(response, "Не удалось добавить запись в журнал оборудования.");
    setJournalForm(defaultJournalForm(target.value));
    setSelectedJournalTargetValue(target.value);
    setJournalCreateDialogOpen(false);
    await loadRegistries();
    await loadJournalEntries(target);
    showSuccessToast(
      "Запись журнала сохранена. Производный статус и ближайшая дата пересчитаны.",
      "equipment-journal-create-success",
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

  function openJournalCreateDialog() {
    const targetValue =
      selectedJournalTarget && !selectedJournalTarget.archivedAt
        ? selectedJournalTarget.value
        : activeJournalTargets[0]?.value ?? "";

    setJournalForm(defaultJournalForm(targetValue));
    setJournalCreateDialogOpen(true);
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
            required
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
            required
            value={equipmentForm.status}
          />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <InputField
            autoComplete={defaultAutoComplete("text")}
            label="Производитель"
            name="equipment-manufacturer"
            onChange={(event) => setEquipmentForm((current) => ({ ...current, manufacturer: event.target.value }))}
            required
            value={equipmentForm.manufacturer}
          />
          <InputField
            autoComplete={defaultAutoComplete("text")}
            label="Класс / тип"
            name="equipment-classification"
            onChange={(event) => setEquipmentForm((current) => ({ ...current, classification: event.target.value }))}
            required
            value={equipmentForm.classification}
          />
          <InputField
            autoComplete={defaultAutoComplete("text")}
            label="Модель"
            name="equipment-model"
            onChange={(event) => setEquipmentForm((current) => ({ ...current, model: event.target.value }))}
            required
            value={equipmentForm.model}
          />
          <InputField
            autoComplete={defaultAutoComplete("number")}
            inputMode="numeric"
            label="Год выпуска"
            name="equipment-manufacture-year"
            onChange={(event) => setEquipmentForm((current) => ({ ...current, manufactureYear: event.target.value }))}
            required
            type="number"
            value={equipmentForm.manufactureYear}
          />
          <InputField
            autoComplete={defaultAutoComplete("text")}
            label="Полное наименование"
            name="equipment-full-name"
            onChange={(event) => setEquipmentForm((current) => ({ ...current, fullName: event.target.value }))}
            required
            value={equipmentForm.fullName}
          />
          <InputField
            autoComplete={defaultAutoComplete("text")}
            label="Заводской номер"
            name="equipment-factory-number"
            onChange={(event) => setEquipmentForm((current) => ({ ...current, factoryNumber: event.target.value }))}
            required
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
        <EquipmentPhotoDraftField
          disabled={isMutating}
          draft={createPhotoDraft}
          idPrefix="equipment-create"
          onAddFiles={appendCreatePhotoFiles}
          onRemoveUpload={removeCreatePhotoUpload}
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
            required
            value={measuringInstrumentForm.unitId}
          />
          <InputField
            autoComplete={defaultAutoComplete("text")}
            label="Наименование"
            name="measuring-instrument-name"
            onChange={(event) => setMeasuringInstrumentForm((current) => ({ ...current, name: event.target.value }))}
            required
            value={measuringInstrumentForm.name}
          />
          <InputField
            autoComplete={defaultAutoComplete("text")}
            label="Тип / класс"
            name="measuring-instrument-type"
            onChange={(event) =>
              setMeasuringInstrumentForm((current) => ({ ...current, instrumentType: event.target.value }))
            }
            required
            value={measuringInstrumentForm.instrumentType}
          />
          <InputField
            autoComplete={defaultAutoComplete("text")}
            label="Модель"
            name="measuring-instrument-model"
            onChange={(event) => setMeasuringInstrumentForm((current) => ({ ...current, model: event.target.value }))}
            required
            value={measuringInstrumentForm.model}
          />
          <InputField
            autoComplete={defaultAutoComplete("text")}
            label="ФИФ"
            name="measuring-instrument-registration-number"
            onChange={(event) =>
              setMeasuringInstrumentForm((current) => ({ ...current, registrationNumber: event.target.value }))
            }
            required
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
            required
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
        <EquipmentPhotoDraftField
          disabled={isMutating}
          draft={createPhotoDraft}
          idPrefix="measuring-instrument-create"
          onAddFiles={appendCreatePhotoFiles}
          onRemoveUpload={removeCreatePhotoUpload}
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
                      required
                      value={draft.standardType}
                    />
                    <InputField
                      autoComplete={defaultAutoComplete("text")}
                      label="Модель"
                      name={`diagnostic-standard-model-${draft.localId}`}
                      onChange={(event) => updateDiagnosticStandardDraft(draft.localId, { model: event.target.value })}
                      required
                      value={draft.model}
                    />
                    <InputField
                      autoComplete={defaultAutoComplete("text")}
                      label="Идентификатор"
                      name={`diagnostic-standard-identifier-${draft.localId}`}
                      onChange={(event) => updateDiagnosticStandardDraft(draft.localId, { identifier: event.target.value })}
                      required
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
                    required
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
          <div className="flex flex-wrap justify-end gap-3">
            <Button disabled={isMutating} onClick={closeCreateDialog} type="button" variant="secondary">
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
        }
        headerIcon={<Wrench aria-hidden="true" className="size-4" />}
        headerVariant="muted"
        onOpenChange={(open) => {
          if (!open && !isMutating) {
            closeCreateDialog();
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
          onChange={(event) => {
            resetCreatePhotoDraft();
            setEquipmentFormKind(event.target.value as EquipmentFormKind);
          }}
          options={equipmentFormKindOptions}
          required
          value={equipmentFormKind}
        />
        {equipmentFormKind === "technical" ? renderTechnicalEquipmentFields() : renderDiagnosticEquipmentFields()}
      </Dialog>
    );
  }

  function renderJournalCreateDialog() {
    if (!canManageRegistry) {
      return null;
    }

    const canSubmit =
      isJournalFormReady(journalForm) &&
      activeJournalTargets.some((item) => item.value === journalForm.targetValue);

    return (
      <Dialog
        bodyClassName="grid gap-5"
        dismissible={!isMutating}
        footer={
          <div className="flex flex-wrap justify-end gap-3">
            <Button
              disabled={isMutating}
              onClick={() => setJournalCreateDialogOpen(false)}
              type="button"
              variant="secondary"
            >
              Отмена
            </Button>
            <Button
              disabled={!canSubmit}
              leftIcon={<Plus className="size-4" />}
              loading={isMutating}
              onClick={() =>
                runMutation(
                  createJournalEntry,
                  "Не удалось добавить запись в журнал оборудования.",
                  "equipment-journal-create-error",
                )
              }
              type="button"
            >
              Добавить запись журнала
            </Button>
          </div>
        }
        headerIcon={<ListChecks aria-hidden="true" className="size-4" />}
        headerVariant="muted"
        onOpenChange={(open) => {
          if (!open && !isMutating) {
            setJournalCreateDialogOpen(false);
          }
        }}
        open={journalCreateDialogOpen}
        showClose={!isMutating}
        size="lg"
        title="Новая запись журнала"
      >
        <SelectField
          label="Оборудование"
          name="equipment-journal-target-id"
          onChange={(event) =>
            setJournalForm((current) => ({
              ...current,
              targetValue: event.target.value,
            }))
          }
          options={activeJournalTargets.map((item) => ({
            label: item.label,
            value: item.value,
          }))}
          placeholder="Выберите запись…"
          required
          value={journalForm.targetValue}
        />
        <div className="grid gap-4 md:grid-cols-2">
          <SelectField
            label="Тип операции"
            name="equipment-journal-operation-type"
            onChange={(event) =>
              setJournalForm((current) => ({
                ...current,
                operationType: event.target.value as JournalRecord["operationType"],
              }))
            }
            options={journalOperationOptions}
            required
            value={journalForm.operationType}
          />
          <InputField
            autoComplete={defaultAutoComplete("text")}
            label="Дата операции"
            name="equipment-journal-operation-date"
            onChange={(event) =>
              setJournalForm((current) => ({ ...current, operationDate: event.target.value }))
            }
            required
            type="date"
            value={journalForm.operationDate}
          />
          <InputField
            autoComplete={defaultAutoComplete("text")}
            label="Документ"
            name="equipment-journal-document-number"
            onChange={(event) =>
              setJournalForm((current) => ({ ...current, documentNumber: event.target.value }))
            }
            required
            spellCheck={false}
            translate="no"
            value={journalForm.documentNumber}
          />
          <InputField
            autoComplete={defaultAutoComplete("text")}
            label="Действует до"
            name="equipment-journal-valid-until"
            onChange={(event) =>
              setJournalForm((current) => ({ ...current, validUntil: event.target.value }))
            }
            type="date"
            value={journalForm.validUntil}
          />
          <InputField
            autoComplete={defaultAutoComplete("text")}
            label="Организация-исполнитель"
            name="equipment-journal-executor"
            onChange={(event) =>
              setJournalForm((current) => ({ ...current, executorOrganization: event.target.value }))
            }
            required
            value={journalForm.executorOrganization}
          />
          <InputField
            autoComplete={defaultAutoComplete("url")}
            label="Вложение / ссылка"
            name="equipment-journal-attachment"
            onChange={(event) =>
              setJournalForm((current) => ({ ...current, attachmentUrl: event.target.value }))
            }
            type="url"
            value={journalForm.attachmentUrl}
          />
        </div>
        <TextareaField
          label="Комментарий"
          name="equipment-journal-comment"
          onChange={(event) =>
            setJournalForm((current) => ({ ...current, comment: event.target.value }))
          }
          value={journalForm.comment}
        />
      </Dialog>
    );
  }

  function renderDiagnosticPassportCard({
    actions,
    cardKey,
    fullWidthSections,
    includeDueDate,
    intrinsicClassName = "[contain-intrinsic-size:1px_520px]",
    item,
    primaryExtraSections,
    secondarySections,
  }: {
    actions?: ReactNode;
    cardKey?: string;
    fullWidthSections?: EquipmentPassportSection[];
    includeDueDate?: boolean;
    intrinsicClassName?: string;
    item: MeasuringInstrumentRecord;
    primaryExtraSections?: EquipmentPassportSection[];
    secondarySections?: EquipmentPassportSection[];
  }) {
    return (
      <EquipmentPassportCard
        actions={actions}
        badges={
          <>
            <Badge tone={statusToneMap[item.status]}>{statusLabelMap[item.status]}</Badge>
            {item.archivedAt ? <Badge tone="neutral">В архиве</Badge> : null}
          </>
        }
        fullWidthSections={fullWidthSections}
        icon={<Gauge aria-hidden="true" className="size-7" />}
        intrinsicClassName={intrinsicClassName}
        key={cardKey}
        label="Диагностическое"
        media={
          <EquipmentPhotoGallery
            fallbackSrc={diagnosticEquipmentFallbackImage}
            photos={item.photos ?? []}
            title={item.name}
          />
        }
        primarySections={buildDiagnosticPrimarySections(item, {
          extraSections: primaryExtraSections,
          includeDueDate,
        })}
        secondarySections={secondarySections}
        subtitle={`${item.instrumentType} • ${item.model}`}
        title={item.name}
      />
    );
  }

  function buildJournalSummarySection(
    id: string,
    journalCount: number,
    nextDueDate: string | undefined,
    latestJournal: JournalRecord | undefined,
  ): EquipmentPassportSection {
    return {
      id,
      title: "Журнал",
      icon: <ListChecks aria-hidden="true" className="size-4" />,
      children: (
        <>
          {latestJournal ? (
            <p className="break-words text-sm leading-6 text-foreground">
              Последняя запись:{" "}
              <span className="font-medium text-foreground">{formatOperationType(latestJournal.operationType)}</span> от{" "}
              <span className="font-medium text-foreground">{formatDate(latestJournal.operationDate)}</span>, документ{" "}
              <span className="font-medium text-foreground" translate="no">
                {latestJournal.documentNumber}
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
              {journalCount ? `${journalCount} записей` : "журнал пуст"}
            </Badge>
            <Badge size="sm" tone="neutral">
              {nextDueDate ? `Действует до ${formatDate(nextDueDate)}` : "срок не рассчитан"}
            </Badge>
          </div>
        </>
      ),
    };
  }

  function renderTechnicalEquipmentCard(
    item: EquipmentRecord,
    options: {
      actions?: ReactNode;
      cardKey?: string;
      fullWidthSections?: EquipmentPassportSection[];
      includeDefaultSecondary?: boolean;
      intrinsicClassName?: string;
      primaryExtraSections?: EquipmentPassportSection[];
      secondarySections?: EquipmentPassportSection[];
    } = {},
  ) {
    const secondarySections: EquipmentPassportSection[] =
      options.includeDefaultSecondary === false
        ? []
        : [buildJournalSummarySection("technical-journal", item.journalCount, item.nextDueDate, item.latestJournal)];

    if (options.includeDefaultSecondary !== false && (item.documentUrl || item.comment)) {
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
        actions={options.actions ?? (
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
        )}
        badges={
          <>
            <Badge tone={statusToneMap[item.status]}>{statusLabelMap[item.status]}</Badge>
            {item.archivedAt ? <Badge tone="neutral">В архиве</Badge> : null}
          </>
        }
        fullWidthSections={options.fullWidthSections}
        icon={<Wrench aria-hidden="true" className="size-7" />}
        intrinsicClassName={options.intrinsicClassName ?? "[contain-intrinsic-size:1px_420px]"}
        key={options.cardKey ?? `technical:${item.id}`}
        label="Техническое"
        media={
          <EquipmentPhotoGallery
            fallbackSrc={technicalEquipmentFallbackImage}
            photos={item.photos ?? []}
            title={item.fullName}
          />
        }
        primarySections={[
          {
            id: "technical-requisites",
            title: "Реквизиты записи",
            icon: <ClipboardList aria-hidden="true" className="size-4" />,
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
          ...(options.primaryExtraSections ?? []),
        ]}
        secondarySections={[...secondarySections, ...(options.secondarySections ?? [])]}
        subtitle={[item.manufacturer, item.classification, item.model].filter(Boolean).join(" • ")}
        title={item.fullName}
      />
    );
  }

  function renderDiagnosticEquipmentCard(item: MeasuringInstrumentRecord) {
    const secondarySections: EquipmentPassportSection[] = [
      buildJournalSummarySection("diagnostic-journal", item.journalCount, item.nextDueDate, item.latestJournal),
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

    return renderDiagnosticPassportCard({
      actions:
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
        ) : null,
      cardKey: `diagnostic:${item.id}`,
      item,
      secondarySections,
    });
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
    if (!selectedJournalTarget) {
      return (
        <EmptyState
          detail="Техническое и диагностическое оборудование пока не зарегистрировано в текущей области доступа."
          title="Журнал еще не выбран"
        />
      );
    }

    const journalTimeline = loadingJournalEntries ? (
      <EmptyState detail="История операций оборудования загружается." title="Загрузка журнала" />
    ) : (
      <JournalTimeline
        emptyDetail="Для выбранного оборудования еще нет операций. После первой записи статус и срок станут производными."
        emptyTitle="Журнал пока пуст"
        journals={journalEntries}
      />
    );

    if (selectedJournalTarget.kind === "technical") {
      const item = selectedJournalTarget.record;

      return renderTechnicalEquipmentCard(item, {
        actions:
          canManageRegistry && !item.archivedAt ? (
            <Button
              aria-label="Архивировать выбранное оборудование"
              className="sm:col-span-2"
              fullWidth
              leftIcon={<Archive className="size-4" />}
              loading={isMutating}
              onClick={() =>
                requestArchive(
                  () => archiveEquipment(item.id),
                  "Не удалось архивировать оборудование.",
                  `оборудование «${item.fullName}»`,
                  "equipment-selected-archive-error",
                )
              }
              size="sm"
              type="button"
              variant="ghost"
            >
              Архивировать
            </Button>
        ) : null,
        cardKey: `technical-journal:${item.id}`,
        fullWidthSections: [
          {
            id: "technical-journal-history",
            title: "Хронология операций",
            icon: <ListChecks aria-hidden="true" className="size-4" />,
            trailing: loadingJournalEntries ? undefined : journalEntries.length,
            children: <div className="min-w-0">{journalTimeline}</div>,
          },
        ],
        includeDefaultSecondary: false,
        intrinsicClassName: "[contain-intrinsic-size:1px_760px]",
      });
    }

    const selectedMeasuringInstrument = selectedJournalTarget.record;

    return renderDiagnosticPassportCard({
      actions:
        canManageRegistry && !selectedMeasuringInstrument.archivedAt ? (
          <Button
            aria-label="Архивировать выбранное оборудование"
            className="sm:col-span-2"
            fullWidth
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
        ) : null,
      fullWidthSections: [
        {
          id: "diagnostic-journal-history",
          title: "Хронология операций",
          icon: <ListChecks aria-hidden="true" className="size-4" />,
          trailing: loadingJournalEntries ? undefined : journalEntries.length,
          children: <div className="min-w-0">{journalTimeline}</div>,
        },
      ],
      includeDueDate: true,
      intrinsicClassName: "[contain-intrinsic-size:1px_760px]",
      item: selectedMeasuringInstrument,
    });
  }

  function renderUnifiedJournal() {
    return (
      <IslandCard
        action={
          canCreateJournalEntry ? (
            <button
              aria-label="Добавить запись журнала"
              onClick={openJournalCreateDialog}
              title="Добавить запись журнала"
              type="button"
            >
              <Plus aria-hidden="true" className="size-4" />
            </button>
          ) : null
        }
        headingLevel={2}
        icon={<Cable aria-hidden="true" className="size-4" />}
        title="Журнал операций по оборудованию"
      >
        <div className="flex flex-wrap justify-start gap-3">
          <div className="min-w-64">
            <SelectField
              label="Оборудование"
              name="selected-equipment-journal-record"
              onChange={(event) => setSelectedJournalTargetValue(event.target.value)}
              options={journalTargets.map((item) => ({
                label: item.label,
                value: item.value,
              }))}
              placeholder="Выберите запись…"
              value={selectedJournalTargetValue}
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
      {renderJournalCreateDialog()}
      <EditRegistryDialog
        editor={editDialog}
        loading={isMutating}
        onAddPhotoFiles={appendEditPhotoFiles}
        onCancel={closeEditDialog}
        onChange={setEditDialog}
        onMarkPhotoDeleted={markEditPhotoDeleted}
        onRemovePhotoUpload={removeEditPhotoUpload}
        onRestorePhotoDeleted={restoreEditPhotoDeleted}
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
        aria-hidden={createDialogOpen || journalCreateDialogOpen || archiveConfirmation || editDialog ? true : undefined}
        className="grid min-w-0 gap-4"
        inert={createDialogOpen || journalCreateDialogOpen || archiveConfirmation || editDialog ? true : undefined}
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
