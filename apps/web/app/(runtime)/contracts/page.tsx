import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ContractsRegistry } from "@/features/Stage03Contracts";
import {
  SESSION_COOKIE_NAME,
  fetchContractRegistry,
  fetchContractorOptions,
  sessionHasCapability,
} from "@/shared/api";
import { fetchSessionSummary } from "@/shared/api/session-server";
import { Badge, buttonVariants, Card } from "@/shared/ui";
import { PageHeader } from "@/widgets/OperatorShell";

function AnonymousContractsShell() {
  return (
    <>
      <PageHeader title="Договоры и подрядчики" />

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
  const canManageContracts = session.organization.roleTitle === "customer" && sessionHasCapability(session, "manage_contracts");
  const contractorOptions = canManageContracts ? await fetchContractorOptions(session.sessionToken) : [];
  const contourLabel =
    session.organization.roleTitle === "contractor" ? "Договоры подрядчика" : "Реестр договоров заказчика";

  return (
    <>
      <PageHeader
        actions={
          <Badge tone={session.organization.roleTitle === "contractor" ? "warning" : "interactive"}>
            {contourLabel}
          </Badge>
        }
        subtitle={
          session.organization.roleTitle === "contractor"
            ? "Показаны договоры заказчиков, доступные вашей организации."
            : "Создавайте договоры, привязывайте подрядчиков и проверяйте подходящий маршрут."
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
