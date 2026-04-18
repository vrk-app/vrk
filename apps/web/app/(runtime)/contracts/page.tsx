import { BadgeCheck, FileCheck2, UserRoundPlus } from "lucide-react";
import { contractsShell, getRuntimeBootstrap } from "@/shared/api";
import { Badge, Button, Card } from "@/shared/ui";
import { PageHeader } from "@/widgets/OperatorShell";

export default function ContractsPage() {
  const runtimeBootstrap = getRuntimeBootstrap();

  return (
    <>
      <PageHeader
        actions={<Badge tone="interactive">Public route: /contracts</Badge>}
        subtitle="Договоры и приглашение подрядчика уже присутствуют в runtime shell, но не выполняют persisted create/invite flow."
        title="Договоры и подрядчики"
      />

      <div className="grid gap-4 lg:grid-cols-3">
        {contractsShell.steps.map((step, index) => {
          const icons = [FileCheck2, UserRoundPlus, BadgeCheck];
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

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="gap-4" padding="lg">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">Normalized web boundary</h2>
            <p className="text-sm leading-6 text-muted-foreground">
              Публичный runtime route называется contracts, а shared API boundary уже фиксирует, что backend resource пока живет под названием agreements.
            </p>
          </div>
          <div className="rounded-[var(--radius-xl)] border border-border bg-muted/60 p-4 font-mono text-sm text-foreground">
            <div>Web route: /contracts</div>
            <div>Backend resource: {runtimeBootstrap.resources.contracts}</div>
            <div>Mode: adapter-only, no live invite workflow</div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button disabled>Создать договор</Button>
            <Button disabled variant="secondary">
              Пригласить подрядчика
            </Button>
          </div>
        </Card>

        <Card className="gap-4" padding="lg">
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">Boundary notes</h2>
            <p className="text-sm leading-6 text-muted-foreground">{contractsShell.summary}</p>
          </div>
          <div className="grid gap-3">
            {contractsShell.boundaries.map((boundary) => (
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
