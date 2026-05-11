import { cookies } from "next/headers";
import { CompanyStructureWorkspace } from "./_components/CompanyStructureWorkspace";
import { SESSION_COOKIE_NAME } from "@/shared/api";
import { fetchSessionSummary } from "@/shared/api/session-server";
import { buttonVariants, Card } from "@/shared/ui";
import { PageHeader } from "@/widgets/OperatorShell";

export const dynamic = "force-dynamic";

function AnonymousCompanyShell() {
  return (
    <>
      <PageHeader title="Компания и профиль площадки" />

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

export default async function CompanyPage() {
  const cookieStore = await cookies();
  const session = await fetchSessionSummary(cookieStore.get(SESSION_COOKIE_NAME)?.value);

  if (!session) {
    return <AnonymousCompanyShell />;
  }

  return (
    <CompanyStructureWorkspace initialSession={session} />
  );
}
