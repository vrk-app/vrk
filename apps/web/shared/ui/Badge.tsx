import type { HTMLAttributes, ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/shared/lib/cn";

const badgeVariants = cva(
  "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-medium transition-colors",
  {
    variants: {
      tone: {
        neutral: "border-foreground/75 bg-muted text-foreground",
        success: "border-success-strong/75 bg-success-soft text-success-strong",
        warning: "border-warning-strong/75 bg-warning-soft text-warning-strong",
        danger: "border-destructive-strong/75 bg-destructive-soft text-destructive-strong",
        info: "border-info-strong/75 bg-info-soft text-info-strong",
        interactive: "border-accent-strong/75 bg-accent-soft text-accent-strong",
        violet: "border-violet/75 bg-violet-soft text-violet",
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
