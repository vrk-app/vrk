"use client";

import { Info } from "lucide-react";
import {
  useId,
  type ButtonHTMLAttributes,
  type ReactNode,
} from "react";
import { cn } from "@/shared/lib/cn";

export type TooltipVariant = "dark" | "light" | "info";

export interface TooltipProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children" | "title"> {
  contentClassName?: string;
  description?: ReactNode;
  icon?: ReactNode;
  title?: ReactNode;
  triggerClassName?: string;
  variant?: TooltipVariant;
}

const tooltipVariantClasses: Record<TooltipVariant, string> = {
  dark: "border-primary bg-primary text-primary-foreground shadow-xl",
  info: "border-info/20 bg-info-soft text-info-strong shadow-lg",
  light: "border-border bg-card text-foreground shadow-lg",
};

const tooltipTitleClasses: Record<TooltipVariant, string> = {
  dark: "text-primary-foreground",
  info: "text-info-strong",
  light: "text-foreground",
};

const tooltipDescriptionClasses: Record<TooltipVariant, string> = {
  dark: "text-primary-foreground/80",
  info: "text-info-strong/80",
  light: "text-muted-foreground",
};

export function Tooltip({
  "aria-label": ariaLabel,
  className,
  contentClassName,
  description,
  icon,
  id,
  title,
  triggerClassName,
  variant = "dark",
  ...props
}: TooltipProps) {
  const autoId = useId();
  const tooltipId = id ?? `${autoId}-tooltip`;
  const hasTitle = Boolean(title);
  const hasDescription = Boolean(description);
  const fallbackLabel =
    typeof title === "string"
      ? title
      : typeof description === "string"
        ? description
        : "Пояснение";

  return (
    <button
      aria-describedby={hasTitle || hasDescription ? tooltipId : undefined}
      aria-label={ariaLabel ?? fallbackLabel}
      className={cn(
        "group/help relative inline-flex size-6 shrink-0 touch-manipulation items-center justify-center rounded-full text-accent-strong opacity-[0.45] transition-opacity duration-150 hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/25 motion-reduce:transition-none",
        triggerClassName,
        className,
      )}
      type="button"
      {...props}
    >
      {icon ?? <Info aria-hidden="true" className="size-4" />}
      {hasTitle || hasDescription ? (
        <span
          className={cn(
            "pointer-events-none invisible absolute bottom-[calc(100%+0.5rem)] left-0 z-30 w-72 max-w-[min(18rem,calc(100vw-2rem))] -translate-x-8 rounded-[var(--radius-md)] border px-3 py-2.5 text-left text-xs font-medium leading-5 opacity-0 transition-opacity duration-150 group-hover/help:visible group-hover/help:opacity-100 group-focus-visible/help:visible group-focus-visible/help:opacity-100 motion-reduce:transition-none sm:left-1/2 sm:-translate-x-1/2",
            tooltipVariantClasses[variant],
            contentClassName,
          )}
          id={tooltipId}
          role="tooltip"
        >
          <span className="grid gap-1.5">
            {hasTitle ? (
              <span
                className={cn(
                  "text-sm font-semibold leading-5",
                  tooltipTitleClasses[variant],
                )}
              >
                {title}
              </span>
            ) : null}
            {hasDescription ? (
              <span className={tooltipDescriptionClasses[variant]}>{description}</span>
            ) : null}
          </span>
        </span>
      ) : null}
    </button>
  );
}
