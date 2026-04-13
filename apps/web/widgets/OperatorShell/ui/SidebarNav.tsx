import { useId, type ComponentType, type HTMLAttributes } from "react";
import { PanelLeftClose, PanelLeftOpen, X } from "lucide-react";
import { Badge, Button } from "@/shared/ui";
import { cn } from "@/shared/lib/cn";

export type SidebarNavItem = {
  key: string;
  label: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
  badge?: string;
};

export interface SidebarNavProps extends HTMLAttributes<HTMLElement> {
  items: SidebarNavItem[];
  activeKey: string;
  footerItems?: SidebarNavItem[];
  collapsed?: boolean;
  mobileOpen?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  onMobileOpenChange?: (mobileOpen: boolean) => void;
}

function SidebarLink({
  active,
  collapsed,
  item,
}: {
  active: boolean;
  collapsed?: boolean;
  item: SidebarNavItem;
}) {
  const Icon = item.icon;

  return (
    <a
      className={cn(
        "group flex h-11 items-center gap-3 rounded-[var(--radius-lg)] px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/25 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        active
          ? "bg-muted text-foreground"
          : "text-muted-foreground hover:bg-muted/80 hover:text-foreground",
        collapsed && "lg:justify-center lg:px-0",
      )}
      href={item.href}
      title={collapsed ? item.label : undefined}
    >
      <Icon className="size-5 shrink-0" />
      <span className={cn("min-w-0 flex-1 truncate", collapsed && "lg:hidden")}>
        {item.label}
      </span>
      {item.badge ? (
        <Badge className={cn(collapsed && "lg:hidden")} size="sm" tone={active ? "interactive" : "neutral"}>
          {item.badge}
        </Badge>
      ) : null}
    </a>
  );
}

export function SidebarNav({
  activeKey,
  className,
  collapsed = false,
  footerItems = [],
  id,
  items,
  mobileOpen = false,
  onCollapsedChange,
  onMobileOpenChange,
  ...props
}: SidebarNavProps) {
  const generatedId = useId();
  const navigationId = id ?? generatedId;

  const handleCollapsedToggle = () => {
    onCollapsedChange?.(!collapsed);
  };

  const handleMobileClose = () => {
    onMobileOpenChange?.(false);
  };

  return (
    <>
      {mobileOpen ? (
        onMobileOpenChange ? (
          <button
            aria-controls={navigationId}
            aria-label="Закрыть меню"
            className="fixed inset-0 z-30 bg-foreground/20 backdrop-blur-[1px] touch-manipulation lg:hidden"
            onClick={handleMobileClose}
            tabIndex={-1}
            type="button"
          />
        ) : (
          <div aria-hidden="true" className="fixed inset-0 z-30 bg-foreground/20 backdrop-blur-[1px] lg:hidden" />
        )
      ) : null}
      <aside
        className={cn(
          "flex h-full flex-col gap-6 overflow-y-auto overscroll-contain border-r border-border bg-card px-4 py-5",
          collapsed ? "w-[248px] lg:w-[88px]" : "w-[248px]",
          mobileOpen
            ? "fixed inset-y-0 left-0 z-40 shadow-lg lg:static lg:shadow-none"
            : "hidden lg:flex",
          className,
        )}
        id={navigationId}
        {...props}
      >
        <div className="flex items-center justify-between gap-3">
          <div className={cn("flex items-center gap-3", collapsed && "lg:justify-center")}>
            <div className="flex size-11 items-center justify-center rounded-[var(--radius-lg)] bg-primary text-primary-foreground shadow-xs">
              <span className="text-sm font-semibold tracking-[0.14em]">VRK</span>
            </div>
            <div className={cn("space-y-1", collapsed && "lg:hidden")}>
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                Stage 01
              </p>
              <p className="text-sm font-semibold text-foreground">Сервисный контур</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onCollapsedChange ? (
              <Button
                aria-controls={navigationId}
                aria-expanded={!collapsed}
                aria-label={collapsed ? "Развернуть меню" : "Свернуть меню"}
                className="hidden size-11 px-0 lg:inline-flex"
                onClick={handleCollapsedToggle}
                variant="ghost"
              >
                {collapsed ? (
                  <PanelLeftOpen aria-hidden="true" className="size-5" />
                ) : (
                  <PanelLeftClose aria-hidden="true" className="size-5" />
                )}
              </Button>
            ) : null}
            {mobileOpen && onMobileOpenChange ? (
              <Button
                aria-controls={navigationId}
                aria-expanded={mobileOpen}
                aria-label="Закрыть меню"
                className="size-11 px-0 lg:hidden"
                onClick={handleMobileClose}
                variant="ghost"
              >
                <X aria-hidden="true" className="size-5" />
              </Button>
            ) : null}
          </div>
        </div>

        <div className="flex-1 space-y-1.5">
          {items.map((item) => (
            <SidebarLink
              active={item.key === activeKey}
              collapsed={collapsed}
              item={item}
              key={item.key}
            />
          ))}
        </div>

        {footerItems.length ? (
          <div className="space-y-1.5 border-t border-border pt-5">
            {footerItems.map((item) => (
              <SidebarLink
                active={item.key === activeKey}
                collapsed={collapsed}
                item={item}
                key={item.key}
              />
            ))}
          </div>
        ) : null}
      </aside>
    </>
  );
}
