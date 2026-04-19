import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { DatabaseZap, FileSpreadsheet, Wrench } from "lucide-react";
import { SESSION_COOKIE_NAME, equipmentShell } from "@/shared/api";
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
        actions={<Badge tone="interactive">Public route: /equipment</Badge>}
        subtitle="Публичный contour без сессии остается truthful shell: он показывает раздельные registry entry points, но не раскрывает live scoped records."
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
            <h2 className="text-xl font-semibold text-foreground">Анонимный contour не выдает scoped registry access</h2>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
              Live registry surface доступен только после invite/session activation. Без сессии `/equipment` остается
              честным shell без create/list contracts.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            <Button disabled>Открыть equipment registry</Button>
            <Button disabled variant="secondary">
              Переключить registry tab
            </Button>
          </div>
        </Card>

        <Card className="gap-4" padding="lg">
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">Почему contour разделен на три registry tabs</h2>
            <p className="text-sm leading-6 text-muted-foreground">
              Stage 03 держит оборудование, СИ и эталоны как отдельные сущности, поэтому даже public shell заранее
              показывает три entry points, а не одну mega-form.
            </p>
          </div>
          <div className="grid gap-3">
            {equipmentShell.boundaries.map((boundary) => (
              <div className="rounded-[var(--radius-lg)] border border-border bg-card px-4 py-3" key={boundary.label}>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-foreground">{boundary.label}</p>
                  <Badge size="sm" tone={boundary.tone}>
                    {boundary.tone}
                  </Badge>
                </div>
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
          actions={<Badge tone="warning">Contractor workspace</Badge>}
          subtitle="Equipment / MI / standards registry остается customer-side contour Stage 03. Contractor workspace продолжает жить на `/contracts`."
          title="Оборудование недоступно в текущем workspace"
        />

        <Card className="gap-4" padding="lg">
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">Контур не расширяется в contractor workspace</h2>
            <p className="text-sm leading-6 text-muted-foreground">
              Текущий пользователь авторизован как contractor. Реестр master data не раскрывается за пределами customer
              contour и не дублирует `/contracts`.
            </p>
          </div>
        </Card>
      </>
    );
  }

  const activeTab = resolveTab(resolvedSearchParams?.tab);
  const initialShowArchived = resolveArchiveVisibility(resolvedSearchParams?.archived);
  const canManageRegistry =
    session.grant?.roleTemplate === "organization_admin" && session.workspace.scopeType === "organization";

  return (
    <>
      <PageHeader
        actions={
          <Badge tone={canManageRegistry ? "interactive" : "warning"}>
            Stage 03 • {session.workspace.scopeType} scope
          </Badge>
        }
        subtitle={
          canManageRegistry
            ? "Под customer session `/equipment` становится live contour с тремя отдельными registry tabs, journal-driven metrology truth и archive-only lifecycle без hard delete."
            : "Текущий пользователь видит только разрешенный registry contour, journal/archive history в своем scope и не получает broader organization leak или mutate surface."
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
