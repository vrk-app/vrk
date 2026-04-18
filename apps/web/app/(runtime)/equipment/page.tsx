import { DatabaseZap, FileSpreadsheet, Wrench } from "lucide-react";
import { equipmentShell } from "@/shared/api";
import { Badge, Button, Card } from "@/shared/ui";
import { PageHeader } from "@/widgets/OperatorShell";

export default function EquipmentPage() {
  return (
    <>
      <PageHeader
        actions={<Badge tone="interactive">Public route: /equipment</Badge>}
        subtitle="Оборудование уже оформлено как registry shell с точками входа, но без live CRUD, import pipeline и subdivision/unit persistence."
        title="Оборудование и точки входа"
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
            <h2 className="text-xl font-semibold text-foreground">Реестр пока пуст и честно это показывает</h2>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
              Stage 02 поднимает только shell: пользователь видит, что дальше доступны ручное добавление и импорт, но создание оборудования включится только вместе с реальным registry contour.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            <Button disabled>Добавить вручную</Button>
            <Button disabled variant="secondary">
              Импортировать реестр
            </Button>
          </div>
        </Card>

        <Card className="gap-4" padding="lg">
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">Почему requests ещё gated</h2>
            <p className="text-sm leading-6 text-muted-foreground">
              Пока equipment contour не станет live, requests остаются только placeholder route.
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
