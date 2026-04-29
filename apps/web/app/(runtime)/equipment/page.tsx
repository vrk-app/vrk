import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE_NAME, sessionHasCapability } from "@/shared/api";
import { fetchSessionSummary } from "@/shared/api/session-server";
import { Badge, buttonVariants, Card } from "@/shared/ui";
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
      <PageHeader title="Оборудование, СИ и эталоны" />

      <Card className="max-w-2xl gap-4" padding="lg">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-foreground">Требуется вход</h2>
          <p className="text-sm leading-6 text-muted-foreground">Войдите, чтобы открыть рабочий раздел.</p>
        </div>
        <div>
          <a className={buttonVariants()} href="/login">
            Войти
          </a>
        </div>
      </Card>
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
