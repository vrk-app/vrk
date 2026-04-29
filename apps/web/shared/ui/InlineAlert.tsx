import type { HTMLAttributes, ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { CheckCircle2, Info, TriangleAlert, X, XCircle } from "lucide-react";
import { cn } from "@/shared/lib/cn";

const inlineAlertVariants = cva(
  "flex items-start gap-3 rounded-[var(--radius-xl)] border px-4 py-3 text-sm shadow-xs",
  {
    variants: {
      tone: {
        info: "border-info-soft bg-info-soft/70 text-info-strong",
        warning: "border-warning/30 bg-warning-soft/80 text-warning-strong",
        error: "border-destructive/20 bg-destructive-soft/80 text-destructive-strong",
        success: "border-success-soft bg-success-soft/80 text-success-strong",
      },
    },
    defaultVariants: {
      tone: "info",
    },
  },
);

const defaultIcons = {
  info: Info,
  warning: TriangleAlert,
  error: XCircle,
  success: CheckCircle2,
};

export interface InlineAlertProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "title">,
    VariantProps<typeof inlineAlertVariants> {
  action?: ReactNode;
  description?: ReactNode;
  dismissible?: boolean;
  icon?: ReactNode;
  onDismiss?: () => void;
  title: ReactNode;
}

export function InlineAlert({
  action,
  className,
  description,
  dismissible = false,
  icon,
  onDismiss,
  role = "status",
  tone = "info",
  title,
  ...props
}: InlineAlertProps) {
  const Icon = defaultIcons[tone ?? "info"];
  const hasStackedContent = Boolean(description || action);

  return (
    <div
      className={cn(inlineAlertVariants({ tone }), !hasStackedContent && "items-center", className)}
      role={role}
      {...props}
    >
      <div
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-[var(--radius-lg)] bg-card/80",
          hasStackedContent && "mt-0.5",
        )}
      >
        {icon ?? <Icon aria-hidden="true" className="size-5" />}
      </div>

      <div className="min-w-0 flex-1 space-y-2">
        <div className="space-y-1">
          <p className="break-words font-semibold">{title}</p>
          {description ? <div className="break-words leading-6 opacity-90">{description}</div> : null}
        </div>
        {action ? <div className="pt-1">{action}</div> : null}
      </div>

      {dismissible && onDismiss ? (
        <button
          aria-label="Закрыть уведомление"
          className="-mr-1 flex size-8 shrink-0 items-center justify-center rounded-[var(--radius-md)] transition-colors hover:bg-card/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/25 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          onClick={onDismiss}
          type="button"
        >
          <X aria-hidden="true" className="size-4" />
        </button>
      ) : null}
    </div>
  );
}
