import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Building2, MapPinned, ShieldCheck } from "lucide-react";
import { SESSION_COOKIE_NAME, companyShell, getRuntimeBootstrap } from "@/shared/api";
import { fetchSessionSummary } from "@/shared/api/session-server";
import { Badge, Button, Card } from "@/shared/ui";
import { EmployeeInviteManager } from "@/features/Stage03Access";
import { PageHeader } from "@/widgets/OperatorShell";

export const dynamic = "force-dynamic";

function AnonymousCompanyShell() {
  const runtimeBootstrap = getRuntimeBootstrap();

  return (
    <>
      <PageHeader
        actions={<Badge tone="interactive">Public route: /company</Badge>}
        subtitle="Онбординг и профиль компании уже собраны в product-shaped shell, но пока не записывают org/subdivision/unit model в persisted storage."
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
            <Badge tone="info">Bootstrap boundary</Badge>
            <h2 className="text-xl font-semibold text-foreground">Shared API / auth skeleton</h2>
            <p className="text-sm leading-6 text-muted-foreground">
              Web runtime уже знает, где позже появятся API и auth/session контракты, но пока использует только truthful stub и seed-read assumptions.
            </p>
          </div>
          <div className="grid gap-3 rounded-[var(--radius-xl)] border border-border bg-muted/60 p-4 font-mono text-sm text-foreground">
            <div>API base: {runtimeBootstrap.apiBaseUrl}</div>
            <div>Organizations: {runtimeBootstrap.resources.organizations}</div>
            <div>Contracts adapter: /contracts → {runtimeBootstrap.resources.contracts}</div>
            <div>Mode: {runtimeBootstrap.runtimeDataMode}</div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button disabled>Завершить онбординг</Button>
            <Button disabled variant="secondary">
              Создать подразделение
            </Button>
          </div>
        </Card>

        <Card className="gap-4" id="boundary-notes" padding="lg">
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">Truthful boundaries</h2>
            <p className="text-sm leading-6 text-muted-foreground">{companyShell.summary}</p>
          </div>
          <div className="grid gap-3">
            {companyShell.boundaries.map((boundary) => (
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

export default async function CompanyPage() {
  const cookieStore = await cookies();
  const session = await fetchSessionSummary(cookieStore.get(SESSION_COOKIE_NAME)?.value);

  if (!session) {
    return <AnonymousCompanyShell />;
  }

  if (session.requiresLaunchWizard) {
    redirect("/company/setup");
  }

  const isOrganizationWorkspace = session.workspace.scopeType === "organization";
  const canManageEmployeeInvites = session.workspace.canManageEmployeeInvites;

  return (
    <>
      <PageHeader
        actions={
          <Badge tone={isOrganizationWorkspace ? "interactive" : "warning"}>
            Stage 03 • {session.workspace.scopeType} workspace
          </Badge>
        }
        subtitle={
          isOrganizationWorkspace
            ? "Организация уже прошла initial launch wizard. Ниже отображаются сохраненные реквизиты, структура и lifecycle приглашений сотрудников."
            : `${session.workspace.landingSubtitle} Организация: ${session.organization.name}.`
        }
        title={session.workspace.landingTitle}
      />

      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="gap-4" padding="lg">
          <div className="space-y-2">
            <Badge tone={isOrganizationWorkspace ? "info" : "warning"}>
              {isOrganizationWorkspace ? "Organization profile" : "Allowed workspace"}
            </Badge>
            <h2 className="text-xl font-semibold text-foreground">
              {isOrganizationWorkspace ? "Сохраненные core fields" : "Контур доступа после login"}
            </h2>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-[var(--radius-lg)] border border-border bg-muted/50 px-4 py-3 text-sm">
              <div className="text-muted-foreground">Workspace scope</div>
              <div className="mt-1 font-semibold text-foreground">{session.workspace.scopeType}</div>
            </div>
            <div className="rounded-[var(--radius-lg)] border border-border bg-muted/50 px-4 py-3 text-sm">
              <div className="text-muted-foreground">Scope target</div>
              <div className="mt-1 font-semibold text-foreground">{session.workspace.scopeName}</div>
            </div>
            <div className="rounded-[var(--radius-lg)] border border-border bg-muted/50 px-4 py-3 text-sm">
              <div className="text-muted-foreground">Membership / grant</div>
              <div className="mt-1 font-semibold text-foreground">
                {session.membershipStatus} / {session.grant?.roleTemplate ?? "organization_admin"}
              </div>
            </div>
            <div className="rounded-[var(--radius-lg)] border border-border bg-muted/50 px-4 py-3 text-sm">
              <div className="text-muted-foreground">Пользователь</div>
              <div className="mt-1 font-semibold text-foreground">{session.account.fullName}</div>
              <div className="text-muted-foreground">{session.account.email}</div>
            </div>
            {isOrganizationWorkspace ? (
              <>
                <div className="rounded-[var(--radius-lg)] border border-border bg-muted/50 px-4 py-3 text-sm">
                  <div className="text-muted-foreground">ОПФ</div>
                  <div className="mt-1 font-semibold text-foreground">{session.organization.propertyType}</div>
                </div>
                <div className="rounded-[var(--radius-lg)] border border-border bg-muted/50 px-4 py-3 text-sm">
                  <div className="text-muted-foreground">Краткое наименование</div>
                  <div className="mt-1 font-semibold text-foreground">{session.organization.shortName ?? "—"}</div>
                </div>
                <div className="rounded-[var(--radius-lg)] border border-border bg-muted/50 px-4 py-3 text-sm">
                  <div className="text-muted-foreground">ИНН / КПП</div>
                  <div className="mt-1 font-semibold text-foreground">
                    {session.organization.inn} / {session.organization.kpp}
                  </div>
                </div>
                <div className="rounded-[var(--radius-lg)] border border-border bg-muted/50 px-4 py-3 text-sm">
                  <div className="text-muted-foreground">Контакты</div>
                  <div className="mt-1 font-semibold text-foreground">{session.organization.contactEmail}</div>
                  <div className="text-muted-foreground">{session.organization.contactPhone}</div>
                </div>
              </>
            ) : null}
          </div>
          {isOrganizationWorkspace ? (
            <div className="rounded-[var(--radius-lg)] border border-border bg-card px-4 py-3 text-sm">
              <div className="text-muted-foreground">Юридический адрес</div>
              <div className="mt-1 font-semibold text-foreground">{session.organization.legalAddress}</div>
            </div>
          ) : (
            <div className="rounded-[var(--radius-lg)] border border-dashed border-border px-4 py-3 text-sm text-muted-foreground">
              Контур intentionally сужен до разрешенного scope. Organization-wide invite management и broader registry
              blocks скрыты для этого пользователя.
            </div>
          )}
        </Card>

        <Card className="gap-4" data-testid="scope-graph" padding="lg">
          <div className="space-y-2">
            <Badge tone="interactive">Visible graph</Badge>
            <h2 className="text-lg font-semibold text-foreground">Подразделения и юниты в текущем scope</h2>
          </div>
          <div className="grid gap-3">
            {session.subdivisions.length ? (
              session.subdivisions.map((subdivision) => (
                <div className="rounded-[var(--radius-lg)] border border-border bg-card px-4 py-3" key={subdivision.id}>
                  <p className="text-sm font-semibold text-foreground">{subdivision.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{subdivision.type}</p>
                </div>
              ))
            ) : (
              <div className="rounded-[var(--radius-lg)] border border-dashed border-border px-4 py-3 text-sm text-muted-foreground">
                {session.workspace.scopeType === "unit"
                  ? "Подразделение не раскрывается для unit-scope пользователя."
                  : "Подразделений в текущем контуре нет."}
              </div>
            )}
            {session.units.map((unit) => (
              <div className="rounded-[var(--radius-lg)] border border-border bg-card px-4 py-3" key={unit.id}>
                <p className="text-sm font-semibold text-foreground">{unit.name}</p>
                <p className="mt-1 text-sm text-muted-foreground">{unit.type}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {unit.subdivisionId ? "Привязан к подразделению" : "Подчинен напрямую организации"}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {canManageEmployeeInvites ? <EmployeeInviteManager session={session} /> : null}
    </>
  );
}
