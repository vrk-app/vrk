import type { HTMLAttributes, ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/shared/lib/cn";

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

export interface BreadcrumbsProps
  extends Omit<HTMLAttributes<HTMLElement>, "children"> {
  items: BreadcrumbItem[];
  separator?: ReactNode;
}

export function Breadcrumbs({
  className,
  items,
  separator = <ChevronRight aria-hidden="true" className="size-3.5 text-muted-foreground" />,
  ...props
}: BreadcrumbsProps) {
  return (
    <nav
      aria-label="Навигационная цепочка"
      className={cn("flex items-center text-sm text-muted-foreground", className)}
      {...props}
    >
      <ol className="flex flex-wrap items-center gap-2">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li className="flex items-center gap-2" key={`${item.label}-${index}`}>
              {item.href && !isLast ? (
                <a className="transition-colors hover:text-foreground" href={item.href}>
                  {item.label}
                </a>
              ) : (
                <span
                  aria-current={isLast ? "page" : undefined}
                  className={cn(isLast && "font-medium text-foreground")}
                >
                  {item.label}
                </span>
              )}
              {!isLast ? separator : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
