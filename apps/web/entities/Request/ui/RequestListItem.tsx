import type { HTMLAttributes } from "react";
import { FileText } from "lucide-react";
import { Card } from "@/shared/ui";
import { cn } from "@/shared/lib/cn";
import { RequestStatusBadge, type RequestStatusValue } from "./RequestStatusBadge";

const currency = new Intl.NumberFormat("ru-RU", {
  style: "currency",
  currency: "RUB",
  maximumFractionDigits: 0,
});

export interface RequestListItemProps extends HTMLAttributes<HTMLDivElement> {
  requestNumber: string;
  createdAt: string;
  title: string;
  enterprise: string;
  contractor: string;
  contract: string;
  sum: number;
  status: RequestStatusValue;
  progressPercent: number;
  selected?: boolean;
  note?: string;
}

export function RequestListItem({
  className,
  contract,
  contractor,
  createdAt,
  enterprise,
  note,
  progressPercent,
  requestNumber,
  selected = false,
  status,
  sum,
  title,
  ...props
}: RequestListItemProps) {
  const normalizedProgress = Math.min(Math.max(progressPercent, 0), 100);

  return (
    <Card
      className={cn(
        "gap-4",
        selected && "border-border-strong bg-accent-soft/40 shadow-sm",
        className,
      )}
      elevated
      padding="md"
      {...props}
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <p className="font-mono text-sm font-semibold text-foreground">{requestNumber}</p>
            <span className="text-sm text-muted-foreground">{createdAt}</span>
            <RequestStatusBadge size="sm" status={status} />
          </div>
          <div className="space-y-2">
            <h3 className="break-words text-lg font-semibold leading-7 text-foreground">{title}</h3>
            <div className="grid gap-2 text-sm text-muted-foreground md:grid-cols-3">
              <p className="break-words">{enterprise}</p>
              <p className="break-words">{contractor}</p>
              <p className="break-words">{contract}</p>
            </div>
          </div>
        </div>

        <div className="grid min-w-[180px] gap-3 rounded-[var(--radius-lg)] bg-muted/80 px-4 py-3 text-sm">
          <div className="space-y-1">
            <p className="text-muted-foreground">Сумма</p>
            <p className="text-base font-semibold text-foreground">{currency.format(sum)}</p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Готовность</span>
              <span className="font-medium text-foreground">{normalizedProgress}%</span>
            </div>
            <div className="h-2 rounded-full bg-card">
              <div
                className="h-full rounded-full bg-accent transition-[width] duration-300"
                style={{ width: `${normalizedProgress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4 text-sm">
        <div className="inline-flex items-center gap-2 text-muted-foreground">
          <FileText aria-hidden="true" className="size-4" />
          <span>Документы и статусы уже читаемы в UI, но живая интеграция остаётся задачей Stage 02.</span>
        </div>
        {note ? (
          <p className="inline-flex items-center gap-2 font-medium text-foreground">
            <span className="text-muted-foreground">Примечание:</span>
            <span>{note}</span>
          </p>
        ) : null}
      </div>
    </Card>
  );
}
