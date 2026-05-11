import {
  cloneElement,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from "react";
import { Building2 } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { Card } from "./Card";

type ClassNameElementProps = {
  className?: string;
};

export type IslandCardProps = {
  action?: ReactNode;
  bodyClassName?: string;
  children: ReactNode;
  className?: string;
  headingLevel?: 2 | 3;
  icon?: ReactNode;
  metric?: ReactNode;
  title: ReactNode;
};

const actionSlotClassName =
  "inline-flex h-[3.25rem] w-14 shrink-0 touch-manipulation items-center justify-center rounded-b-[1.4rem] border border-t-0 border-border bg-muted text-muted-foreground shadow-xs transition-colors duration-150 hover:border-border-strong hover:bg-card hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/25 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:bg-muted disabled:text-text-disabled disabled:shadow-none disabled:hover:border-border disabled:hover:bg-muted motion-reduce:transition-none";

function renderActionSlot(action: ReactNode) {
  if (!action) {
    return null;
  }

  if (isValidElement<ClassNameElementProps>(action)) {
    const actionElement = action as ReactElement<ClassNameElementProps>;

    return cloneElement(actionElement, {
      className: cn(actionSlotClassName, actionElement.props.className),
    });
  }

  return <div className={actionSlotClassName}>{action}</div>;
}

export function IslandCard({
  action,
  bodyClassName,
  children,
  className,
  headingLevel = 3,
  icon,
  metric,
  title,
}: IslandCardProps) {
  const Heading = headingLevel === 2 ? "h2" : "h3";

  return (
    <Card className={cn("relative gap-5 overflow-visible pt-20", className)} padding="lg">
      <div className="absolute inset-x-5 top-0 z-10 flex items-start justify-between gap-3">
        <div
          className={cn(
            "flex h-[3.25rem] min-w-0 items-center gap-3 rounded-b-[1.4rem] border border-t-0 border-border bg-muted px-5 py-3 text-foreground shadow-xs",
            action ? "max-w-[calc(100%-4.25rem)]" : "max-w-full",
          )}
        >
          <span className="flex size-5 shrink-0 items-center justify-center text-accent-strong">
            {icon ?? <Building2 aria-hidden="true" className="size-4" />}
          </span>
          <Heading className="min-w-0 truncate text-lg font-semibold leading-7">{title}</Heading>
          {metric ? (
            <span className="shrink-0 rounded-full bg-accent-soft px-2.5 py-1 text-xs font-semibold tabular-nums text-accent-strong">
              {metric}
            </span>
          ) : null}
        </div>
        {renderActionSlot(action)}
      </div>
      <div className={cn("flex flex-col gap-5", bodyClassName)}>{children}</div>
    </Card>
  );
}
