import type { HTMLAttributes, ReactNode } from "react";
import Image from "next/image";
import { ArrowUpRight, FileCheck2, ShieldCheck, Sparkles } from "lucide-react";
import { WEB_BRAND_COMPACT_MARK_SRC } from "@/shared/config/brand";
import { Badge, Card } from "@/shared/ui";
import { cn } from "@/shared/lib/cn";

export interface AuthSplitLayoutProps extends HTMLAttributes<HTMLDivElement> {
  formSlot: ReactNode;
  fullBleedIllustration?: boolean;
  illustrationSlot?: ReactNode;
  showAuthBadge?: boolean;
  title: string;
  subtitle: string;
}

function DefaultIllustration() {
  return (
    <div className="grid h-full gap-4 rounded-[var(--radius-2xl)] border border-border/70 bg-accent-soft/55 p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="inline-flex items-center gap-2 rounded-[var(--radius-full)] border border-border bg-card px-2.5 py-1 text-xs font-semibold text-foreground shadow-xs">
          <Image
            alt=""
            aria-hidden="true"
            className="size-6 rounded-[var(--radius-xs)] object-contain"
            height={24}
            src={WEB_BRAND_COMPACT_MARK_SRC}
            width={24}
          />
          <span translate="no">VRK</span>
        </div>
        <Sparkles aria-hidden="true" className="size-5 text-accent" />
      </div>
      <div className="space-y-3">
        <h3 className="text-balance text-2xl font-bold tracking-tight text-foreground">
          Безопасный вход в VRK
        </h3>
        <p className="text-sm leading-6 text-muted-foreground">
          Доступ открывается после проверки учетной записи.
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {[
          {
            icon: ShieldCheck,
            title: "Доступ",
            value: "Работа только под своей учетной записью",
          },
          {
            icon: FileCheck2,
            title: "Порядок",
            value: "Понятный вход без лишних шагов",
          },
          {
            icon: ArrowUpRight,
            title: "Продолжение",
            value: "После входа открывается рабочая область",
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
  fullBleedIllustration = false,
  illustrationSlot,
  showAuthBadge = true,
  subtitle,
  title,
  ...props
}: AuthSplitLayoutProps) {
  const hasIllustration = illustrationSlot !== null;
  const illustration = illustrationSlot ?? <DefaultIllustration />;

  return (
    <section
      className={cn(
        "grid min-h-screen bg-background text-foreground",
        fullBleedIllustration ? "gap-0" : "gap-6 px-5 py-6 md:px-8 md:py-8",
        hasIllustration
          ? "lg:grid-cols-[minmax(0,0.94fr)_minmax(320px,0.86fr)] lg:items-stretch"
          : "mx-auto w-full max-w-[560px]",
        className,
      )}
      {...props}
    >
      <div className={cn("flex items-center justify-center", fullBleedIllustration && "px-5 py-6 md:px-8 md:py-8")}>
        <div className="w-full max-w-[480px] space-y-6">
          <div className="space-y-3">
            {showAuthBadge ? <Badge tone="neutral">Авторизация VRK</Badge> : null}
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
          <div
            className={cn(
              "mx-auto min-h-[320px] w-full max-w-[480px] lg:min-h-[560px] lg:max-w-none",
              fullBleedIllustration && "max-w-none lg:h-full lg:min-h-screen",
            )}
          >
            {illustration}
          </div>
        </div>
      ) : null}
    </section>
  );
}
