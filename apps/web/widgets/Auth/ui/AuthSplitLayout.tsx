import type { HTMLAttributes, ReactNode } from "react";
import { ArrowUpRight, FileCheck2, ShieldCheck, Sparkles } from "lucide-react";
import { Badge, Card } from "@/shared/ui";
import { cn } from "@/shared/lib/cn";

export interface AuthSplitLayoutProps extends HTMLAttributes<HTMLDivElement> {
  formSlot: ReactNode;
  illustrationSlot?: ReactNode;
  title: string;
  subtitle: string;
}

function DefaultIllustration() {
  return (
    <div className="grid h-full gap-4 rounded-[var(--radius-3xl)] border border-border/70 bg-[linear-gradient(180deg,rgba(47,107,255,0.12),rgba(255,255,255,0.92))] p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <Badge tone="interactive">Stage 01 • Auth-базис</Badge>
        <Sparkles aria-hidden="true" className="size-5 text-accent" />
      </div>
      <div className="space-y-3">
        <h3 className="text-2xl font-bold tracking-tight text-foreground">
          Лёгкая авторизация без потери audit-friendly характера.
        </h3>
        <p className="text-sm leading-6 text-muted-foreground">
          Правый блок остаётся спокойным: он показывает, что пользователь входит не в
          маркетинговый экран, а в контролируемый сервисный контур.
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {[
          {
            icon: ShieldCheck,
            title: "Роль и доступ",
            value: "RBAC с маршрутизацией по роли",
          },
          {
            icon: FileCheck2,
            title: "Документы",
            value: "Согласование и след действий видны сразу",
          },
          {
            icon: ArrowUpRight,
            title: "Следующий шаг",
            value: "Живая интеграция осознанно переносится в Stage 02",
          },
        ].map((item) => (
          <Card className="gap-3 bg-card/80" key={item.title} padding="md">
            <div className="flex size-10 items-center justify-center rounded-[var(--radius-lg)] bg-accent-soft text-accent">
              <item.icon aria-hidden="true" className="size-5" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">{item.title}</p>
              <p className="text-sm leading-6 text-muted-foreground">{item.value}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function AuthSplitLayout({
  className,
  formSlot,
  illustrationSlot,
  subtitle,
  title,
  ...props
}: AuthSplitLayoutProps) {
  const hasIllustration = illustrationSlot !== null;
  const illustration = illustrationSlot ?? <DefaultIllustration />;

  return (
    <section
      className={cn(
        "grid min-h-screen gap-6 bg-background px-5 py-6 text-foreground md:px-8 md:py-8",
        hasIllustration
          ? "lg:grid-cols-[minmax(0,0.94fr)_minmax(320px,0.86fr)] lg:items-stretch"
          : "mx-auto w-full max-w-[560px]",
        className,
      )}
      {...props}
    >
      <div className="flex items-center justify-center">
        <div className="w-full max-w-[480px] space-y-6">
          <div className="space-y-3">
            <Badge tone="neutral">Авторизация VRK</Badge>
            <div className="space-y-3">
              <h1 className="text-balance text-4xl font-bold tracking-tight text-foreground">
                {title}
              </h1>
              <p className="text-base leading-7 text-muted-foreground">{subtitle}</p>
            </div>
          </div>
          {formSlot}
        </div>
      </div>

      {illustrationSlot !== null ? (
        <div className="w-full">
          <div className="mx-auto min-h-[320px] w-full max-w-[480px] lg:min-h-[560px] lg:max-w-none">
            {illustration}
          </div>
        </div>
      ) : null}
    </section>
  );
}
