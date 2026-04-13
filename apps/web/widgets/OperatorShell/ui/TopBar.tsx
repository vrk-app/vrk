import type { HTMLAttributes } from "react";
import { Bell, ChevronDown, Menu, Search, X } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { Breadcrumbs, type BreadcrumbItem } from "./Breadcrumbs";

export type TopBarUser = {
  name: string;
  role: string;
  initials: string;
};

export interface TopBarProps extends HTMLAttributes<HTMLDivElement> {
  searchValue: string;
  notificationsCount: number;
  user: TopBarUser;
  breadcrumbs: BreadcrumbItem[];
  mobileMenuOpen?: boolean;
  mobileMenuId?: string;
  onSearch?: (value: string) => void;
  onMobileMenuOpenChange?: (mobileMenuOpen: boolean) => void;
  onNotificationsClick?: () => void;
  onUserMenu?: () => void;
}

export function TopBar({
  breadcrumbs,
  className,
  mobileMenuId,
  mobileMenuOpen = false,
  notificationsCount,
  onMobileMenuOpenChange,
  onNotificationsClick,
  onSearch,
  onUserMenu,
  searchValue,
  user,
  ...props
}: TopBarProps) {
  const isSearchInteractive = typeof onSearch === "function";

  const handleMobileMenuToggle = () => {
    onMobileMenuOpenChange?.(!mobileMenuOpen);
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-20 border-b border-border bg-card/95 px-4 py-4 backdrop-blur md:px-6",
        className,
      )}
      {...props}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          {onMobileMenuOpenChange ? (
            <button
              aria-controls={mobileMenuId}
              aria-expanded={mobileMenuOpen}
              aria-label={mobileMenuOpen ? "Закрыть навигацию" : "Открыть навигацию"}
              className="inline-flex size-11 items-center justify-center rounded-[var(--radius-lg)] border border-border bg-card text-foreground shadow-xs transition-colors hover:bg-muted lg:hidden"
              onClick={handleMobileMenuToggle}
              type="button"
            >
              {mobileMenuOpen ? (
                <X aria-hidden="true" className="size-5" />
              ) : (
                <Menu aria-hidden="true" className="size-5" />
              )}
            </button>
          ) : null}
          <div className="space-y-2">
            <Breadcrumbs items={breadcrumbs} />
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.16em] text-muted-foreground">
                Оперативная работа
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label
            className={cn(
              "flex h-11 min-w-0 flex-1 items-center gap-3 rounded-[var(--radius-lg)] border border-border bg-muted/70 px-3.5 text-sm text-foreground shadow-xs transition-[border-color,box-shadow,background-color] duration-150 sm:w-[320px]",
              isSearchInteractive
                ? "focus-within:border-accent focus-within:bg-card focus-within:ring-2 focus-within:ring-ring/15"
                : "cursor-not-allowed bg-muted text-muted-foreground",
            )}
          >
            <Search aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
            <input
              aria-label="Поиск по заявкам и оборудованию"
              autoComplete="off"
              className="w-full border-none bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:text-muted-foreground"
              disabled={!isSearchInteractive}
              name="global-search"
              onChange={isSearchInteractive ? (event) => onSearch(event.target.value) : undefined}
              placeholder="Поиск по номеру, подрядчику или оборудованию…"
              spellCheck={false}
              type="search"
              value={searchValue}
            />
          </label>

          <div className="flex items-center gap-3">
            <button
              aria-label="Уведомления"
              className="relative inline-flex size-11 items-center justify-center rounded-[var(--radius-lg)] border border-border bg-card text-foreground shadow-xs transition-colors hover:bg-muted"
              onClick={onNotificationsClick}
              type="button"
            >
              <Bell aria-hidden="true" className="size-5" />
              {notificationsCount > 0 ? (
                <span className="absolute right-2 top-2 inline-flex min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-[11px] font-semibold leading-none text-destructive-foreground">
                  {notificationsCount > 99 ? "99+" : notificationsCount}
                </span>
              ) : null}
            </button>

            <button
              className="inline-flex min-h-11 items-center gap-3 rounded-[var(--radius-lg)] border border-border bg-card px-3 py-2 text-left shadow-xs transition-colors hover:bg-muted"
              onClick={onUserMenu}
              type="button"
            >
              <span className="flex size-9 items-center justify-center rounded-full bg-accent-soft text-sm font-semibold text-accent">
                {user.initials}
              </span>
              <span className="hidden min-w-0 flex-col sm:flex">
                <span className="truncate text-sm font-semibold text-foreground">{user.name}</span>
                <span className="truncate text-xs text-muted-foreground">{user.role}</span>
              </span>
              <ChevronDown aria-hidden="true" className="size-4 text-muted-foreground" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
