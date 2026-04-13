import type { HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/shared/lib/cn";

const cardVariants = cva(
  "flex flex-col rounded-[var(--radius-xl)] bg-card text-card-foreground transition-[border-color,background-color,box-shadow,transform] duration-150 motion-reduce:transition-none",
  {
    variants: {
      padding: {
        dense: "p-4",
        md: "p-5",
        lg: "p-6",
      },
      tone: {
        default: "bg-card",
        muted: "bg-muted/70",
      },
      bordered: {
        true: "border border-border shadow-xs",
        false: "border border-transparent shadow-none",
      },
      elevated: {
        true: "shadow-sm hover:-translate-y-px hover:border-border-strong hover:shadow-md",
        false: "",
      },
    },
    defaultVariants: {
      padding: "md",
      tone: "default",
      bordered: true,
      elevated: false,
    },
  },
);

export interface CardProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

export function Card({
  bordered,
  className,
  children,
  elevated,
  padding,
  tone,
  ...props
}: CardProps) {
  return (
    <div className={cn(cardVariants({ bordered, className, elevated, padding, tone }))} {...props}>
      {children}
    </div>
  );
}
