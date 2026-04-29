import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

export interface AppShellProps extends HTMLAttributes<HTMLDivElement> {
  sidebar: ReactNode;
  header: ReactNode;
}

export function AppShell({
  children,
  className,
  header,
  sidebar,
  ...props
}: AppShellProps) {
  return (
    <div className={cn("min-h-screen bg-background text-foreground", className)} {...props}>
      <a
        className="sr-only rounded-[var(--radius-lg)] bg-card px-4 py-2 text-sm font-medium text-foreground shadow-sm focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/25 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        href="#main-content"
      >
        Перейти к основному контенту
      </a>
      <div className="flex min-h-screen">
        <div className="shrink-0 lg:sticky lg:top-0 lg:h-dvh lg:max-h-dvh">{sidebar}</div>
        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          {header}
          <main className="flex-1 px-4 py-5 md:px-6 md:py-6" id="main-content">
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
