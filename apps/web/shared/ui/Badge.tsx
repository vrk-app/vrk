import type { HTMLAttributes, ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/shared/lib/cn";

const badgeVariants = cva(
  "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-medium transition-colors",
  {
    variants: {
      tone: {
        neutral: "border-foreground/35 bg-muted text-foreground",
        success: "border-success-strong/35 bg-success-soft text-success-strong",
        warning: "border-warning-strong/35 bg-warning-soft text-warning-strong",
        danger: "border-destructive-strong/35 bg-destructive-soft text-destructive-strong",
        info: "border-info-strong/35 bg-info-soft text-info-strong",
        interactive: "border-accent-strong/35 bg-accent-soft text-accent-strong",
        violet: "border-violet/35 bg-violet-soft text-violet",
      },
      size: {
        sm: "px-2.5 py-1 text-xs",
        md: "px-3 py-1.5 text-sm",
      },
    },
    defaultVariants: {
      tone: "neutral",
      size: "md",
    },
  },
);

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  icon?: ReactNode;
}

export function Badge({ className, icon, tone, size, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ className, size, tone }))} {...props}>
      {icon ? (
        <span aria-hidden="true" className="flex size-4 items-center justify-center">
          {icon}
        </span>
      ) : null}
      <span>{children}</span>
    </span>
  );
}
