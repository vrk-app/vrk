import type { ReactNode } from "react";
import { ArrowUpRight, Building2, ShieldCheck, Wrench } from "lucide-react";
import { Badge, Card } from "@/shared/ui";

type AsideItem = {
  title: string;
  detail: string;
  icon: ReactNode;
};

export interface AuthAsideProps {
  badgeLabel: string;
  title: string;
  description: string;
  items: readonly AsideItem[];
}

export function AuthAside({
  badgeLabel,
  description,
  items,
  title,
}: AuthAsideProps) {
  return (
    <div className="grid h-full gap-4 rounded-[var(--radius-3xl)] border border-border/70 bg-[linear-gradient(180deg,rgba(47,107,255,0.1),rgba(255,255,255,0.94))] p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <Badge tone="interactive">{badgeLabel}</Badge>
        <ArrowUpRight aria-hidden="true" className="size-5 text-accent" />
      </div>
      <div className="space-y-3">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">{title}</h2>
        <p className="text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {items.map((item) => (
          <Card className="gap-3 bg-card/80" key={item.title} padding="md">
            <div className="flex size-10 items-center justify-center rounded-[var(--radius-lg)] bg-accent-soft text-accent">
              {item.icon}
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">{item.title}</p>
              <p className="text-sm leading-6 text-muted-foreground">{item.detail}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

export const loginAsideItems = [
  {
    title: "Приглашенная учетная запись",
    detail: "Любой приглашенный пользователь входит только после invite acceptance и получает только свой разрешенный контур.",
    icon: <ShieldCheck aria-hidden="true" className="size-5" />,
  },
  {
    title: "Launch или workspace",
    detail: "Если организация еще не запущена, login возвращает администратора в wizard; иначе открывает конкретный workspace.",
    icon: <Building2 aria-hidden="true" className="size-5" />,
  },
  {
    title: "Границы stage-а",
    detail: "Equipment, contracts и requests не расширяются этим slice вне разрешенного scope и следующего stage-order.",
    icon: <Wrench aria-hidden="true" className="size-5" />,
  },
] as const;

export const registerAsideItems = [
  {
    title: "Company shell",
    detail: "Регистрация сразу объясняет, что профиль компании будет заполнен дальше без persisted storage в этом slice.",
    icon: <Building2 aria-hidden="true" className="size-5" />,
  },
  {
    title: "Audit-friendly path",
    detail: "Каждый следующий контур маршрутизирован явно: company, equipment, contracts, requests.",
    icon: <ShieldCheck aria-hidden="true" className="size-5" />,
  },
  {
    title: "Truthful handoff",
    detail: "Shell подсказывает будущий workflow, но не маскирует отсутствие Stage 03 activation.",
    icon: <Wrench aria-hidden="true" className="size-5" />,
  },
] as const;
