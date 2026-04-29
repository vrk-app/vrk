import { cookies } from "next/headers";
import { Building2, MapPinned, ShieldCheck } from "lucide-react";
import { CompanyStructureWorkspace } from "./_components/CompanyStructureWorkspace";
import { SESSION_COOKIE_NAME, companyShell } from "@/shared/api";
import { fetchSessionSummary } from "@/shared/api/session-server";
import { Badge, Button, Card } from "@/shared/ui";
import { PageHeader } from "@/widgets/OperatorShell";

export const dynamic = "force-dynamic";

function AnonymousCompanyShell() {
  return (
    <>
      <PageHeader
        actions={<Badge tone="interactive">Открытый просмотр</Badge>}
        subtitle="Войдите по приглашению, чтобы открыть реквизиты, структуру и управление доступом."
        title="Компания и профиль площадки"
      />

      <div className="grid gap-4 xl:grid-cols-3">
        {companyShell.steps.map((step, index) => {
          const icons = [Building2, MapPinned, ShieldCheck];
          const Icon = icons[index] ?? Building2;

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

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="gap-4" padding="lg">
          <div className="space-y-2">
            <Badge tone="info">Подготовка доступа</Badge>
            <h2 className="text-xl font-semibold text-foreground">Вход открывает рабочие данные</h2>
            <p className="text-sm leading-6 text-muted-foreground">
              После входа открываются профиль организации, подразделения, юниты и приглашения сотрудников.
            </p>
          </div>
          <div className="grid gap-3 rounded-[var(--radius-xl)] border border-border bg-muted/60 p-4 text-sm text-muted-foreground">
            <div>Реквизиты организации</div>
            <div>Подразделения и юниты</div>
            <div>Приглашения сотрудников</div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button disabled>Открыть профиль</Button>
            <Button disabled variant="secondary">
              Создать подразделение
            </Button>
          </div>
        </Card>

        <Card className="gap-4" id="boundary-notes" padding="lg">
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">Что доступно сейчас</h2>
            <p className="text-sm leading-6 text-muted-foreground">{companyShell.summary}</p>
          </div>
          <div className="grid gap-3">
            {companyShell.boundaries.map((boundary) => (
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

export default async function CompanyPage() {
  const cookieStore = await cookies();
  const session = await fetchSessionSummary(cookieStore.get(SESSION_COOKIE_NAME)?.value);

  if (!session) {
    return <AnonymousCompanyShell />;
  }

  const isOrganizationWorkspace = session.workspace.scopeType === "organization";

  return (
    <>
      <PageHeader
        actions={
          <Badge tone={isOrganizationWorkspace ? "interactive" : "warning"}>
            {isOrganizationWorkspace ? "Вся организация" : "Ограниченный доступ"}
          </Badge>
        }
        subtitle={
          isOrganizationWorkspace
            ? "Управляйте профилем, подразделениями, юнитами и доступом сотрудников в одном постоянном разделе."
            : `${session.workspace.landingSubtitle} Организация: ${session.organization.name}.`
        }
        title={session.workspace.landingTitle}
      />

      <CompanyStructureWorkspace initialSession={session} />
    </>
  );
}
