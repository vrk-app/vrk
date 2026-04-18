import { Building2, MapPinned, ShieldCheck } from "lucide-react";
import { companyShell, getRuntimeBootstrap } from "@/shared/api";
import { Badge, Button, Card } from "@/shared/ui";
import { PageHeader } from "@/widgets/OperatorShell";

export const dynamic = "force-dynamic";

export default function CompanyPage() {
  const runtimeBootstrap = getRuntimeBootstrap();

  return (
    <>
      <PageHeader
        actions={<Badge tone="interactive">Public route: /company</Badge>}
        subtitle="Онбординг и профиль компании уже собраны в product-shaped shell, но пока не записывают org/branch model в persisted storage."
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
              Создать филиал
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
