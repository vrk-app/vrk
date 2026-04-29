import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { DatabaseZap, FileSpreadsheet, Wrench } from "lucide-react";
import { SESSION_COOKIE_NAME, equipmentShell, sessionHasCapability } from "@/shared/api";
import { fetchSessionSummary } from "@/shared/api/session-server";
import { Badge, Button, Card } from "@/shared/ui";
import { EquipmentRegistryWorkspace } from "@/features/Stage03Equipment";
import { PageHeader } from "@/widgets/OperatorShell";

export const dynamic = "force-dynamic";

type EquipmentPageProps = {
  searchParams?: Promise<{
    tab?: string | string[];
    archived?: string | string[];
  }>;
};

function resolveTab(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw === "mi" || raw === "standards" ? raw : "equipment";
}

function resolveArchiveVisibility(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw === "1" || raw === "true";
}

function AnonymousEquipmentShell() {
  return (
    <>
      <PageHeader
        actions={<Badge tone="interactive">Открытый просмотр</Badge>}
        subtitle="Войдите, чтобы открыть рабочие записи оборудования, средств измерения и эталонов."
        title="Оборудование, СИ и эталоны"
      />

      <div className="grid gap-4 lg:grid-cols-3">
        {equipmentShell.steps.map((step, index) => {
          const icons = [Wrench, FileSpreadsheet, DatabaseZap];
          const Icon = icons[index] ?? Wrench;

          return (
            <Card className="gap-4" key={step.title} padding="lg">
              <div className="flex size-11 items-center justify-center rounded-[var(--radius-lg)] bg-accent-soft text-accent">
                <Icon aria-hidden="true" className="size-5" />
              </div>
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-semibold text-foreground">{step.title}</h2>
                  <Badge size="sm" tone={index === 2 ? "warning" : "interactive"}>
                    {step.status}
                  </Badge>
                </div>
                <p className="text-sm leading-6 text-muted-foreground">{step.detail}</p>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="items-center gap-4 py-10 text-center" padding="lg">
          <div className="flex size-14 items-center justify-center rounded-full bg-accent-soft text-accent">
            <Wrench aria-hidden="true" className="size-6" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">Рабочие реестры доступны после входа</h2>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
              Данные показываются только пользователям с выданным доступом.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            <Button disabled>Открыть реестр</Button>
            <Button disabled variant="secondary">
              Переключить раздел
            </Button>
          </div>
        </Card>

        <Card className="gap-4" padding="lg">
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">Доступные реестры</h2>
            <p className="text-sm leading-6 text-muted-foreground">
              В разделе собраны оборудование, средства измерения и эталоны.
            </p>
          </div>
          <div className="grid gap-3">
            {equipmentShell.boundaries.map((boundary) => (
              <div className="rounded-[var(--radius-lg)] border border-border bg-card px-4 py-3" key={boundary.label}>
                <p className="text-sm font-semibold text-foreground">{boundary.label}</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{boundary.detail}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}

export default async function EquipmentPage({ searchParams }: EquipmentPageProps) {
  const cookieStore = await cookies();
  const session = await fetchSessionSummary(cookieStore.get(SESSION_COOKIE_NAME)?.value);
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  if (session?.requiresLaunchWizard) {
    redirect("/company/setup");
  }

  if (!session) {
    return <AnonymousEquipmentShell />;
  }

  if (session.organization.roleTitle !== "customer") {
    return (
      <>
        <PageHeader
          actions={<Badge tone="warning">Доступ подрядчика</Badge>}
          subtitle="Реестр оборудования ведет заказчик. Для подрядчика рабочим разделом остаются договоры."
          title="Оборудование недоступно в текущей области"
        />

        <Card className="gap-4" padding="lg">
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">Раздел закрыт для подрядчика</h2>
            <p className="text-sm leading-6 text-muted-foreground">
              Текущий пользователь работает как подрядчик. Данные оборудования заказчика не раскрываются за пределами
              выданных договоров.
            </p>
          </div>
        </Card>
      </>
    );
  }

  const activeTab = resolveTab(resolvedSearchParams?.tab);
  const initialShowArchived = resolveArchiveVisibility(resolvedSearchParams?.archived);
  const canManageRegistry = sessionHasCapability(session, "manage_equipment");

  return (
    <>
      <PageHeader
        actions={
          <Badge tone={canManageRegistry ? "interactive" : "warning"}>
            {canManageRegistry ? "Управление реестрами" : "Только просмотр"}
          </Badge>
        }
          subtitle={
            canManageRegistry
            ? "Создавайте записи, ведите журналы операций и переносите неактуальные записи в архив."
            : "Вам доступны записи, журналы и архив в назначенной области."
        }
        title="Оборудование, средства измерения и эталоны"
      />

      <EquipmentRegistryWorkspace
        initialShowArchived={initialShowArchived}
        initialTab={activeTab}
        session={session}
      />
    </>
  );
}
