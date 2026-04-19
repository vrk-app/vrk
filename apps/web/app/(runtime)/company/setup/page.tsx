import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Badge } from "@/shared/ui";
import { PageHeader } from "@/widgets/OperatorShell";
import { SESSION_COOKIE_NAME } from "@/shared/api";
import { fetchSessionSummary } from "@/shared/api/session-server";
import { LaunchWizardForm } from "@/features/Stage03Bootstrap";

export const dynamic = "force-dynamic";

export default async function CompanySetupPage() {
  const cookieStore = await cookies();
  const session = await fetchSessionSummary(cookieStore.get(SESSION_COOKIE_NAME)?.value);

  if (!session) {
    redirect("/login");
  }

  if (!session.requiresLaunchWizard) {
    redirect("/company");
  }

  return (
    <>
      <PageHeader
        actions={<Badge tone="warning">Stage 03 • Launch wizard</Badge>}
        subtitle="Первый администратор завершает запуск организации, сохраняет core fields и создает первую рабочую структуру."
        title="Первичный запуск организации"
      />

      <LaunchWizardForm session={session} />
    </>
  );
}
