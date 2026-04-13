import type { ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

type StoryFrameProps = {
  title: string;
  description: string;
  children: ReactNode;
  className?: string;
};

export function StoryFrame({
  title,
  description,
  children,
  className,
}: StoryFrameProps) {
  return (
    <div className="story-shell">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <div className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Основание Storybook VRK
          </p>
          <div className="space-y-2">
            <h1 className="text-balance text-3xl font-bold tracking-tight text-foreground">{title}</h1>
            <p className="max-w-3xl text-base leading-7 text-muted-foreground">{description}</p>
          </div>
        </div>
        <div className={cn("story-card p-5 md:p-6", className)}>{children}</div>
      </div>
    </div>
  );
}
