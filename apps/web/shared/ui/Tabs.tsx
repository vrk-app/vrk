"use client";

import {
  forwardRef,
  useId,
  useRef,
  type ButtonHTMLAttributes,
  type ComponentType,
  type HTMLAttributes,
  type KeyboardEvent,
} from "react";
import { cn } from "@/shared/lib/cn";

export type TabItem<TKey extends string = string> = {
  badge?: string;
  disabled?: boolean;
  icon?: ComponentType<{ className?: string }>;
  key: TKey;
  label: string;
};

export interface TabsProps<TKey extends string = string>
  extends Omit<HTMLAttributes<HTMLDivElement>, "onChange"> {
  activeKey: TKey;
  ariaLabel: string;
  fullWidth?: boolean;
  getPanelId?: (key: TKey) => string | undefined;
  idPrefix?: string;
  items: readonly TabItem<TKey>[];
  onChange: (key: TKey) => void;
}

type TabButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  active: boolean;
  item: TabItem<string>;
};

const TabButton = forwardRef<HTMLButtonElement, TabButtonProps>(function TabButton(
  { active, className, item, ...props },
  ref,
) {
  const Icon = item.icon;

  return (
    <button
      ref={ref}
      aria-selected={active}
      className={cn(
        "inline-flex h-11 min-w-0 items-center justify-center gap-2 rounded-[var(--radius-md)] border px-3.5 text-sm font-medium transition-[background-color,border-color,color,box-shadow] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/25 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-55",
        active
          ? "border-accent bg-accent-soft text-accent-strong shadow-xs"
          : "border-transparent text-muted-foreground hover:bg-card hover:text-foreground",
        className,
      )}
      disabled={item.disabled}
      role="tab"
      type="button"
      {...props}
    >
      {Icon ? <Icon aria-hidden="true" className="size-4 shrink-0" /> : null}
      <span className="min-w-0 truncate">{item.label}</span>
      {item.badge ? (
        <span className="shrink-0 rounded-full bg-card px-2 py-0.5 text-xs tabular-nums text-muted-foreground">
          {item.badge}
        </span>
      ) : null}
    </button>
  );
});

export function Tabs<TKey extends string>({
  activeKey,
  ariaLabel,
  className,
  fullWidth = false,
  getPanelId,
  idPrefix,
  items,
  onChange,
  ...props
}: TabsProps<TKey>) {
  const generatedId = useId();
  const baseId = idPrefix ?? `tabs-${generatedId.replace(/:/g, "")}`;
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const enabledItems = items.filter((item) => !item.disabled);
  const activeIndex = Math.max(
    0,
    items.findIndex((item) => item.key === activeKey),
  );

  const focusTab = (nextItem: TabItem<TKey> | undefined) => {
    if (!nextItem || nextItem.disabled) {
      return;
    }

    const nextIndex = items.findIndex((item) => item.key === nextItem.key);
    onChange(nextItem.key);
    window.requestAnimationFrame(() => tabRefs.current[nextIndex]?.focus());
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!enabledItems.length) {
      return;
    }

    const enabledIndex = enabledItems.findIndex((item) => item.key === activeKey);
    const currentEnabledIndex = enabledIndex >= 0 ? enabledIndex : 0;

    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      focusTab(enabledItems[(currentEnabledIndex + 1) % enabledItems.length]);
    }

    if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      focusTab(enabledItems[(currentEnabledIndex - 1 + enabledItems.length) % enabledItems.length]);
    }

    if (event.key === "Home") {
      event.preventDefault();
      focusTab(enabledItems[0]);
    }

    if (event.key === "End") {
      event.preventDefault();
      focusTab(enabledItems[enabledItems.length - 1]);
    }
  };

  return (
    <div
      aria-label={ariaLabel}
      className={cn(
        "flex gap-1 overflow-x-auto rounded-[var(--radius-lg)] border border-border bg-muted/70 p-1",
        fullWidth && "w-full",
        className,
      )}
      onKeyDown={handleKeyDown}
      role="tablist"
      {...props}
    >
      {items.map((item, index) => (
        <TabButton
          active={item.key === activeKey}
          aria-controls={getPanelId?.(item.key)}
          className={cn(fullWidth && "flex-1")}
          id={`${baseId}-${item.key}`}
          item={item}
          key={item.key}
          onClick={() => onChange(item.key)}
          ref={(node) => {
            tabRefs.current[index] = node;
          }}
          tabIndex={index === activeIndex ? 0 : -1}
        />
      ))}
    </div>
  );
}
