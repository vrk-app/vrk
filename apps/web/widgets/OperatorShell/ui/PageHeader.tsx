import type { HTMLAttributes, ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/shared/lib/cn";

export type PageHeaderLink = {
  label: string;
  href: string;
};

export interface PageHeaderProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  backLink?: PageHeaderLink;
}

export function PageHeader({
  actions,
  backLink,
  className,
  subtitle,
  title,
  ...props
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 rounded-[var(--radius-xl)] border border-border bg-card px-5 py-5 shadow-xs md:px-6",
        className,
      )}
      {...props}
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          {backLink ? (
            <a
              className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              href={backLink.href}
            >
              <ArrowLeft aria-hidden="true" className="size-4" />
              <span>{backLink.label}</span>
            </a>
          ) : null}
          <div className="space-y-2">
            <h1 className="text-balance text-2xl font-bold tracking-tight text-foreground md:text-3xl">
              {title}
            </h1>
            {subtitle ? (
              <p className="max-w-3xl text-sm leading-6 text-muted-foreground md:text-base">
                {subtitle}
              </p>
            ) : null}
          </div>
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
      </div>
    </div>
  );
}
