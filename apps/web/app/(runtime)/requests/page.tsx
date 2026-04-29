import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ArrowRight, LockKeyhole } from "lucide-react";
import { SESSION_COOKIE_NAME, requestsShell } from "@/shared/api";
import { fetchSessionSummary } from "@/shared/api/session-server";
import { Badge, Card } from "@/shared/ui";
import { PageHeader } from "@/widgets/OperatorShell";

function ActionLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      className="inline-flex h-10 items-center justify-center rounded-[var(--radius-lg)] border border-border bg-card px-5 text-sm font-medium text-foreground shadow-xs transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/25 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      href={href}
    >
      {label}
    </a>
  );
}

export default async function RequestsPage() {
  const cookieStore = await cookies();
  const session = await fetchSessionSummary(cookieStore.get(SESSION_COOKIE_NAME)?.value);
  if (session?.requiresLaunchWizard) {
    redirect("/company/setup");
  }

  return (
    <>
      <PageHeader
        actions={<Badge tone="warning">Недоступно</Badge>}
        subtitle="Создание и сопровождение заявок пока закрыты."
        title="Заявки"
      />

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="items-center gap-4 py-10 text-center" padding="lg">
          <div className="flex size-14 items-center justify-center rounded-full bg-warning-soft text-warning-strong">
            <LockKeyhole aria-hidden="true" className="size-6" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">Раздел заявок пока закрыт</h2>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
              {requestsShell.summary}
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            <ActionLink href="/company" label="Вернуться к компании" />
            <ActionLink href="/contracts" label="Открыть договоры" />
          </div>
        </Card>

        <Card className="gap-4" padding="lg">
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">Перед созданием заявки</h2>
            <p className="text-sm leading-6 text-muted-foreground">
              Проверьте данные, которые понадобятся для работы с заявками.
            </p>
          </div>
          <div className="grid gap-3">
            {requestsShell.prerequisites.map((item) => (
              <div className="rounded-[var(--radius-lg)] border border-border bg-card px-4 py-3" key={item}>
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
                    <ArrowRight aria-hidden="true" className="size-4" />
                  </div>
                  <p className="text-sm leading-6 text-muted-foreground">{item}</p>
                </div>
              </div>
            ))}
            {requestsShell.boundaries.map((boundary) => (
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
