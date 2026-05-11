import type { ReactNode } from "react";
import { Archive, FileText, ListChecks, MapPin, Network, ShieldCheck, Wrench } from "lucide-react";
import { Badge, Card } from "@/shared/ui";

type GalleryEntity = {
  label: string;
  title: string;
  subtitle: string;
  primaryNumber: {
    label: string;
    value: string;
  };
  secondaryNumber: {
    label: string;
    value: string;
  };
  statusLabel: string;
  statusTone: "success" | "warning" | "neutral";
  scopeLabel: string;
  scopeMeta: string;
  dueLabel: string;
  relationLabel: string;
  relationTone: "interactive" | "neutral";
  journalSummary: string;
  documentLabel: string;
  documentUrl: string;
  description: string;
  facts: Array<{
    label: string;
    value: string;
  }>;
};

const fixtureDateFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "2-digit",
  month: "2-digit",
  timeZone: "UTC",
  year: "numeric",
});

function formatFixtureDate(value: string) {
  return fixtureDateFormatter.format(new Date(`${value}T00:00:00.000Z`));
}

const equipmentEntity: GalleryEntity = {
  label: "Оборудование",
  title: "Автоматизированная компрессорная станция подготовки воздуха KS-12",
  subtitle: "КомпрессорСервис • Компрессорная линия • KS-12",
  primaryNumber: {
    label: "Заводской номер",
    value: "KS12-4420-ALFA-LONG",
  },
  secondaryNumber: {
    label: "Инвентарный номер",
    value: "EQ-2040-2026",
  },
  statusLabel: "Приостановлено",
  statusTone: "warning",
  scopeLabel: "Ремонтное депо",
  scopeMeta: "Восточный дивизион",
  dueLabel: "Метрология не требуется",
  relationLabel: "СИ: 2",
  relationTone: "interactive",
  journalSummary: `Последняя сервисная проверка: ${formatFixtureDate("2026-04-18")}, без метрологического журнала.`,
  documentLabel: "Паспорт оборудования",
  documentUrl: "equipment/ks-12-passport.pdf",
  description:
    "Промышленная станция с длинным названием показывает, как карточка держит переносы без потери ключевых номеров и области учета.",
  facts: [
    { label: "Производитель", value: "КомпрессорСервис" },
    { label: "Классификация", value: "Компрессорная линия" },
    { label: "Юнит", value: "Ремонтное депо" },
    { label: "Дивизион", value: "Восточный дивизион" },
  ],
};

function DetailPair({ label, mono, value }: { label: string; mono?: boolean; value: string }) {
  return (
    <div className="min-w-0 space-y-1">
      <dt className="text-xs font-medium leading-4 text-muted-foreground">{label}</dt>
      <dd
        className={
          mono
            ? "break-words font-mono text-sm font-medium leading-5 text-foreground tabular-nums [overflow-wrap:anywhere]"
            : "break-words text-sm font-medium leading-5 text-foreground [overflow-wrap:anywhere]"
        }
        translate={mono ? "no" : undefined}
      >
        {value}
      </dd>
    </div>
  );
}

function SectionHeading({ children, icon }: { children: ReactNode; icon: ReactNode }) {
  return (
    <div className="flex min-w-0 items-center gap-2 text-sm font-semibold text-foreground">
      <span className="flex size-5 shrink-0 items-center justify-center text-muted-foreground">{icon}</span>
      <span className="min-w-0 break-words">{children}</span>
    </div>
  );
}

function PassportCard({ entity }: { entity: GalleryEntity }) {
  const details = [
    { ...entity.primaryNumber, mono: true },
    { ...entity.secondaryNumber, mono: true },
    ...entity.facts.map((fact) => ({ ...fact, mono: false })),
  ];

  return (
    <Card className="gap-5" padding="md">
      <div className="rounded-[var(--radius-lg)] bg-primary px-4 py-4 text-primary-foreground">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-primary-foreground/10">
              <Wrench aria-hidden="true" className="size-5" />
            </span>
            <div className="min-w-0 space-y-1">
              <p className="text-sm font-medium text-primary-foreground/75">{entity.label}</p>
              <h3 className="text-pretty break-words text-lg font-semibold leading-7">{entity.title}</h3>
            </div>
          </div>
          <Badge size="sm" tone={entity.statusTone}>
            {entity.statusLabel}
          </Badge>
        </div>
      </div>

      <p className="break-words text-sm leading-6 text-muted-foreground">{entity.description}</p>

      <dl className="grid border-y border-border md:grid-cols-2">
        {details.map((detail, index) => (
          <div
            className="min-w-0 border-border py-3 md:px-4 md:odd:border-r [&:not(:first-child)]:border-t md:[&:nth-child(2)]:border-t-0"
            key={`${detail.label}-${index}`}
          >
            <DetailPair label={detail.label} mono={detail.mono} value={detail.value} />
          </div>
        ))}
      </dl>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
        <div className="min-w-0 space-y-2">
          <SectionHeading icon={<ListChecks aria-hidden="true" className="size-4" />}>Журнал</SectionHeading>
          <p className="break-words text-sm leading-6 text-muted-foreground">{entity.journalSummary}</p>
        </div>
        <div className="min-w-0 space-y-2">
          <SectionHeading icon={<FileText aria-hidden="true" className="size-4" />}>{entity.documentLabel}</SectionHeading>
          <p className="break-all font-mono text-sm leading-6 text-foreground" translate="no">
            {entity.documentUrl}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge size="sm" tone={entity.relationTone}>
          {entity.relationLabel}
        </Badge>
        <Badge size="sm" tone="neutral">
          {entity.scopeMeta}
        </Badge>
        <Badge icon={<Archive className="size-3.5" />} size="sm" tone="neutral">
          Архив не показан
        </Badge>
      </div>
    </Card>
  );
}

function CompactPassportCard({ entity }: { entity: GalleryEntity }) {
  return (
    <Card className="gap-4" padding="dense">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-[var(--radius-md)] border border-border bg-muted/70 text-muted-foreground">
            <Wrench aria-hidden="true" className="size-4" />
          </span>
          <div className="min-w-0 space-y-1">
            <p className="text-xs font-medium leading-4 text-muted-foreground">{entity.label}</p>
            <h3 className="break-words text-base font-semibold leading-6 text-foreground">{entity.title}</h3>
            <p className="break-words text-sm leading-5 text-muted-foreground">{entity.subtitle}</p>
          </div>
        </div>
        <Badge size="sm" tone={entity.statusTone}>
          {entity.statusLabel}
        </Badge>
      </div>

      <dl className="grid gap-3 rounded-[var(--radius-lg)] border border-border bg-muted/50 p-3 sm:grid-cols-2">
        <DetailPair label={entity.primaryNumber.label} mono value={entity.primaryNumber.value} />
        <DetailPair label={entity.secondaryNumber.label} mono value={entity.secondaryNumber.value} />
        <DetailPair label="Область учета" value={`${entity.scopeMeta}, ${entity.scopeLabel}`} />
        <DetailPair label="Контроль" value={entity.dueLabel} />
      </dl>

      <div className="grid gap-3 border-y border-border py-3 md:grid-cols-2">
        <div className="min-w-0 space-y-1">
          <SectionHeading icon={<FileText aria-hidden="true" className="size-4" />}>{entity.documentLabel}</SectionHeading>
          <p className="break-all font-mono text-sm leading-5 text-foreground" translate="no">
            {entity.documentUrl}
          </p>
        </div>
        <div className="min-w-0 space-y-1">
          <SectionHeading icon={<ListChecks aria-hidden="true" className="size-4" />}>Журнал</SectionHeading>
          <p className="break-words text-sm leading-5 text-muted-foreground">{entity.journalSummary}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge size="sm" tone={entity.relationTone}>
          {entity.relationLabel}
        </Badge>
        <Badge icon={<Archive className="size-3.5" />} size="sm" tone="neutral">
          Архив не показан
        </Badge>
      </div>
    </Card>
  );
}

function RequisitesPassportCard({ entity }: { entity: GalleryEntity }) {
  return (
    <Card className="gap-5" padding="md">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge size="sm" tone="neutral">
              {entity.label}
            </Badge>
            <Badge size="sm" tone={entity.statusTone}>
              {entity.statusLabel}
            </Badge>
          </div>
          <h3 className="text-pretty break-words text-xl font-semibold leading-7 text-foreground">{entity.title}</h3>
          <p className="break-words text-sm leading-6 text-muted-foreground">{entity.subtitle}</p>
        </div>
        <div className="flex min-w-0 flex-wrap gap-2">
          <Badge icon={<MapPin className="size-3.5" />} size="sm" tone="neutral">
            {entity.scopeLabel}
          </Badge>
          <Badge size="sm" tone={entity.relationTone}>
            {entity.relationLabel}
          </Badge>
        </div>
      </div>

      <dl className="grid overflow-hidden rounded-[var(--radius-lg)] border border-border md:grid-cols-2">
        <div className="min-w-0 border-border bg-muted/60 p-4 md:border-r">
          <DetailPair label={entity.primaryNumber.label} mono value={entity.primaryNumber.value} />
        </div>
        <div className="min-w-0 border-t border-border bg-muted/60 p-4 md:border-t-0">
          <DetailPair label={entity.secondaryNumber.label} mono value={entity.secondaryNumber.value} />
        </div>
        <div className="min-w-0 border-t border-border p-4 md:border-r">
          <DetailPair label="Область учета" value={`${entity.scopeMeta}, ${entity.scopeLabel}`} />
        </div>
        <div className="min-w-0 border-t border-border p-4">
          <DetailPair label="Контроль" value={entity.dueLabel} />
        </div>
      </dl>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="min-w-0 rounded-[var(--radius-lg)] border border-border px-4 py-3">
          <SectionHeading icon={<ListChecks aria-hidden="true" className="size-4" />}>Журнал</SectionHeading>
          <p className="mt-2 break-words text-sm leading-6 text-muted-foreground">{entity.journalSummary}</p>
        </div>
        <div className="min-w-0 rounded-[var(--radius-lg)] border border-border px-4 py-3">
          <SectionHeading icon={<FileText aria-hidden="true" className="size-4" />}>{entity.documentLabel}</SectionHeading>
          <p className="mt-2 break-all font-mono text-sm leading-6 text-foreground" translate="no">
            {entity.documentUrl}
          </p>
        </div>
      </div>
    </Card>
  );
}

function EvidencePassportCard({ entity }: { entity: GalleryEntity }) {
  return (
    <Card className="gap-5" padding="md">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{entity.label}</p>
          <h3 className="break-words text-lg font-semibold leading-7 text-foreground">{entity.title}</h3>
        </div>
        <Badge size="sm" tone={entity.statusTone}>
          {entity.statusLabel}
        </Badge>
      </div>

      <div className="grid gap-4 rounded-[var(--radius-lg)] border border-border bg-muted/50 p-4 lg:grid-cols-2">
        <div className="min-w-0 space-y-2">
          <SectionHeading icon={<ListChecks aria-hidden="true" className="size-4" />}>Журнал операции</SectionHeading>
          <p className="break-words text-sm leading-6 text-foreground">{entity.journalSummary}</p>
          <Badge size="sm" tone="neutral">
            {entity.dueLabel}
          </Badge>
        </div>
        <div className="min-w-0 space-y-2">
          <SectionHeading icon={<FileText aria-hidden="true" className="size-4" />}>{entity.documentLabel}</SectionHeading>
          <p className="break-all font-mono text-sm leading-6 text-foreground" translate="no">
            {entity.documentUrl}
          </p>
          <p className="break-words text-sm leading-6 text-muted-foreground">
            Файл хранится как основание сервисной проверки и сверяется при приемке записи.
          </p>
        </div>
      </div>

      <dl className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <DetailPair label={entity.primaryNumber.label} mono value={entity.primaryNumber.value} />
        <DetailPair label={entity.secondaryNumber.label} mono value={entity.secondaryNumber.value} />
        <DetailPair label="Область учета" value={`${entity.scopeMeta}, ${entity.scopeLabel}`} />
        <DetailPair label="Связи" value={entity.relationLabel} />
      </dl>

      <div className="flex flex-wrap gap-2 border-t border-border pt-4">
        <Badge icon={<Network className="size-3.5" />} size="sm" tone={entity.relationTone}>
          {entity.relationLabel}
        </Badge>
        <Badge icon={<Archive className="size-3.5" />} size="sm" tone="neutral">
          Архив не показан
        </Badge>
      </div>
    </Card>
  );
}

function TwoColumnPassportCard({ entity }: { entity: GalleryEntity }) {
  return (
    <Card className="gap-5" padding="md">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-[var(--radius-lg)] border border-border bg-muted/70 text-muted-foreground">
            <ShieldCheck aria-hidden="true" className="size-5" />
          </span>
          <div className="min-w-0 space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{entity.label}</p>
            <h3 className="break-words text-xl font-semibold leading-7 text-foreground">{entity.title}</h3>
            <p className="break-words text-sm leading-6 text-muted-foreground">{entity.subtitle}</p>
          </div>
        </div>
        <Badge tone={entity.statusTone}>{entity.statusLabel}</Badge>
      </div>

      <div className="grid overflow-hidden rounded-[var(--radius-lg)] border border-border lg:grid-cols-[minmax(0,1.05fr)_minmax(280px,0.75fr)]">
        <div className="min-w-0 space-y-4 p-4">
          <div className="space-y-2">
            <SectionHeading icon={<Wrench aria-hidden="true" className="size-4" />}>Реквизиты записи</SectionHeading>
            <dl className="grid gap-3 sm:grid-cols-2">
              <DetailPair label={entity.primaryNumber.label} mono value={entity.primaryNumber.value} />
              <DetailPair label={entity.secondaryNumber.label} mono value={entity.secondaryNumber.value} />
              {entity.facts.map((fact) => (
                <DetailPair key={fact.label} label={fact.label} value={fact.value} />
              ))}
            </dl>
          </div>

          <div className="border-t border-border pt-4">
            <SectionHeading icon={<MapPin aria-hidden="true" className="size-4" />}>Область учета</SectionHeading>
            <p className="mt-2 break-words text-sm leading-6 text-foreground">
              {entity.scopeMeta}, {entity.scopeLabel}
            </p>
          </div>
        </div>

        <div className="min-w-0 border-t border-border bg-muted/40 p-4 lg:border-l lg:border-t-0">
          <div className="grid gap-4">
            <div className="min-w-0 space-y-2">
              <SectionHeading icon={<ListChecks aria-hidden="true" className="size-4" />}>Журнал</SectionHeading>
              <p className="break-words text-sm leading-6 text-foreground">{entity.journalSummary}</p>
              <Badge size="sm" tone="neutral">
                {entity.dueLabel}
              </Badge>
            </div>

            <div className="min-w-0 border-t border-border pt-4">
              <SectionHeading icon={<FileText aria-hidden="true" className="size-4" />}>{entity.documentLabel}</SectionHeading>
              <p className="mt-2 break-all font-mono text-sm leading-6 text-foreground" translate="no">
                {entity.documentUrl}
              </p>
            </div>

            <div className="flex flex-wrap gap-2 border-t border-border pt-4">
              <Badge icon={<Network className="size-3.5" />} size="sm" tone={entity.relationTone}>
                {entity.relationLabel}
              </Badge>
              <Badge icon={<Archive className="size-3.5" />} size="sm" tone="neutral">
                Архив не показан
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

function VariantSection({
  children,
  description,
  sectionId,
  title,
}: {
  children: ReactNode;
  description: string;
  sectionId: string;
  title: string;
}) {
  return (
    <section className="grid gap-4" aria-labelledby={sectionId}>
      <div className="max-w-3xl space-y-1">
        <h2 className="scroll-mt-24 text-pretty text-xl font-semibold leading-7 text-foreground" id={sectionId}>
          {title}
        </h2>
        <p className="break-words text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
      {children}
    </section>
  );
}

export function EquipmentCardVariantGallery() {
  return (
    <div className="grid max-w-6xl gap-8">
      <VariantSection
        description="Расширенный паспорт для выбранной записи: ключевые реквизиты, журнал, документ и связи остаются в одной читаемой карточке."
        sectionId="variant-base-passport"
        title="Паспорт"
      >
        <div className="max-w-3xl">
          <PassportCard entity={equipmentEntity} />
        </div>
      </VariantSection>

      <VariantSection
        description="Сжатая версия для плотных списков: статус, номера, область учета, документ и журнал видны без лишних блоков."
        sectionId="variant-compact-passport"
        title="Компактный паспорт"
      >
        <div className="max-w-3xl">
          <CompactPassportCard entity={equipmentEntity} />
        </div>
      </VariantSection>

      <VariantSection
        description="Вариант с усиленным блоком реквизитов, когда оператору важнее всего быстро сверить заводской и инвентарный номера."
        sectionId="variant-requisites-passport"
        title="Паспорт с сильным реквизитным блоком"
      >
        <div className="max-w-4xl">
          <RequisitesPassportCard entity={equipmentEntity} />
        </div>
      </VariantSection>

      <VariantSection
        description="Макет для сценариев, где основание записи важнее вторичных атрибутов: журнал и документ стоят в центре карточки."
        sectionId="variant-evidence-passport"
        title="Паспорт с акцентом на журнал и документ"
      >
        <div className="max-w-4xl">
          <EvidencePassportCard entity={equipmentEntity} />
        </div>
      </VariantSection>

      <VariantSection
        description="Структура для рабочего стола: реквизиты и область учета слева, журнал, документ и связи справа."
        sectionId="variant-two-column-passport"
        title="Двухколоночный паспорт"
      >
        <TwoColumnPassportCard entity={equipmentEntity} />
      </VariantSection>
    </div>
  );
}
