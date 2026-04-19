import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { FileCheck2, Route, UserRoundPlus } from "lucide-react";
import { ContractsRegistry } from "@/features/Stage03Contracts";
import {
  SESSION_COOKIE_NAME,
  contractsShell,
  fetchContractRegistry,
  fetchContractorOptions,
  getRuntimeBootstrap,
} from "@/shared/api";
import { fetchSessionSummary } from "@/shared/api/session-server";
import { Badge, Card } from "@/shared/ui";
import { PageHeader } from "@/widgets/OperatorShell";

function AnonymousContractsShell() {
  const runtimeBootstrap = getRuntimeBootstrap();

  return (
    <>
      <PageHeader
        actions={<Badge tone="interactive">Public route: /contracts</Badge>}
        subtitle="Анонимный пользователь по-прежнему видит truthful shell boundary. Живой contracts registry появляется только после Stage 03 auth/session projection."
        title="Договоры и подрядчики"
      />

      <div className="grid gap-4 lg:grid-cols-3">
        {contractsShell.steps.map((step, index) => {
          const icons = [FileCheck2, UserRoundPlus, Route];
          const Icon = icons[index] ?? FileCheck2;

          return (
            <Card className="gap-4" key={step.title} padding="lg">
              <div className="flex size-11 items-center justify-center rounded-[var(--radius-lg)] bg-accent-soft text-accent">
                <Icon aria-hidden="true" className="size-5" />
              </div>
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-semibold text-foreground">{step.title}</h2>
                  <Badge size="sm" tone={index === 1 ? "warning" : "interactive"}>
                    {step.status}
                  </Badge>
                </div>
                <p className="text-sm leading-6 text-muted-foreground">{step.detail}</p>
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="mt-4 gap-4" id="boundary-notes" padding="lg">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-foreground">Normalized web boundary</h2>
          <p className="text-sm leading-6 text-muted-foreground">
            Публичный runtime route называется contracts, а backend resource пока остается agreements внутри explicit
            adapter boundary.
          </p>
        </div>
        <div className="rounded-[var(--radius-xl)] border border-border bg-muted/60 p-4 font-mono text-sm text-foreground">
          <div>Web route: /contracts</div>
          <div>Backend resource: {runtimeBootstrap.resources.contracts}</div>
          <div>Mode: anonymous shell before session</div>
        </div>
      </Card>
    </>
  );
}

export default async function ContractsPage() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const session = await fetchSessionSummary(sessionToken);
  if (!session) {
    return <AnonymousContractsShell />;
  }
  if (session.requiresLaunchWizard) {
    redirect("/company/setup");
  }

  const initialContracts = await fetchContractRegistry(session.sessionToken);
  const canManageContracts =
    session.organization.roleTitle === "customer" &&
    session.grant?.roleTemplate === "organization_admin" &&
    session.workspace.scopeType === "organization";
  const contractorOptions = canManageContracts ? await fetchContractorOptions(session.sessionToken) : [];
  const contourLabel =
    session.organization.roleTitle === "contractor" ? "Contractor contracts workspace" : "Customer contracts registry";

  return (
    <>
      <PageHeader
        actions={
          <Badge tone={session.organization.roleTitle === "contractor" ? "warning" : "interactive"}>
            Stage 03 • {contourLabel}
          </Badge>
        }
        subtitle={
          session.organization.roleTitle === "contractor"
            ? "Подрядчик видит только customer contracts, привязанные к своей организации, без доступа к customer org graph."
            : "Customer organization admin управляет contracts registry, contractor binding и routing eligibility preview внутри реального Stage 03 contour."
        }
        title="Договоры и маршрутизация"
      />

      <ContractsRegistry
        contractorOptions={contractorOptions}
        initialContracts={initialContracts}
        session={session}
      />
    </>
  );
}
