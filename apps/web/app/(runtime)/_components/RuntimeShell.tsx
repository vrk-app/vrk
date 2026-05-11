"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { Building2, ClipboardList, LogOut, Wrench } from "lucide-react";
import { AppShell, SidebarNav, TopBar } from "@/widgets/OperatorShell";

const runtimeNavItems = [
  { key: "company", label: "Компания", href: "/company", icon: Building2 },
  { key: "equipment", label: "Оборудование", href: "/equipment", icon: Wrench },
  { key: "contracts", label: "Договоры", href: "/contracts", icon: ClipboardList, badge: "Скоро" },
  { key: "requests", label: "Заявки", href: "/requests", icon: ClipboardList, badge: "Скоро" },
] as const;

const runtimeFooterItems = [{ key: "logout", label: "Выйти", href: "/login?logout=1", icon: LogOut }] as const;

const runtimeMetaByPath = {
  "/company": {
    activeKey: "company",
    breadcrumbs: [{ label: "Рабочая область", href: "/company" }, { label: "Компания" }],
  },
  "/equipment": {
    activeKey: "equipment",
    breadcrumbs: [{ label: "Рабочая область", href: "/company" }, { label: "Оборудование" }],
  },
  "/equipment/card-variants": {
    activeKey: "equipment",
    breadcrumbs: [
      { label: "Рабочая область", href: "/company" },
      { label: "Оборудование", href: "/equipment" },
      { label: "Варианты карточек" },
    ],
  },
  "/contracts": {
    activeKey: "contracts",
    breadcrumbs: [{ label: "Рабочая область", href: "/company" }, { label: "Договоры" }],
  },
  "/requests": {
    activeKey: "requests",
    breadcrumbs: [{ label: "Рабочая область", href: "/company" }, { label: "Заявки" }],
  },
} as const;

function resolveRuntimeMeta(pathname: string) {
  if (pathname.startsWith("/equipment/card-variants")) {
    return runtimeMetaByPath["/equipment/card-variants"];
  }

  if (pathname.startsWith("/equipment")) {
    return runtimeMetaByPath["/equipment"];
  }

  return runtimeMetaByPath[pathname as keyof typeof runtimeMetaByPath] ?? runtimeMetaByPath["/company"];
}

export interface RuntimeShellProps {
  children: ReactNode;
  viewer?: {
    name: string;
    role: string;
  };
  eyebrow?: string;
  workspaceTitle?: string;
}

const runtimeNavigationId = "runtime-primary-navigation";

export function RuntimeShell({ children, eyebrow = "Рабочая область", viewer, workspaceTitle }: RuntimeShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const currentMeta = resolveRuntimeMeta(pathname);
  const isCompanyWorkspace = currentMeta.activeKey === "company";

  return (
    <AppShell
      header={
        <TopBar
          breadcrumbs={currentMeta.breadcrumbs}
          contextTitle={viewer ? workspaceTitle : undefined}
          contextTitleAsHeading={Boolean(viewer && workspaceTitle && isCompanyWorkspace)}
          eyebrow={eyebrow}
          mobileMenuId={runtimeNavigationId}
          mobileMenuOpen={mobileOpen}
          notificationsCount={0}
          onMobileMenuOpenChange={setMobileOpen}
          searchPlaceholder={viewer ? "Поиск по разделам" : "Войдите для поиска"}
          searchValue=""
          user={
            viewer
              ? {
                  name: viewer.name,
                  role: viewer.role,
                  initials: viewer.name
                    .split(" ")
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((part) => part[0]?.toUpperCase() ?? "")
                    .join(""),
                }
              : {
                  name: "Пилотный администратор заказчика",
                  role: "демо-область без входа",
                  initials: "VR",
                }
          }
        />
      }
      sidebar={
        <SidebarNav
          activeKey={currentMeta.activeKey}
          footerItems={runtimeFooterItems}
          id={runtimeNavigationId}
          items={runtimeNavItems}
          metaLabel={viewer ? "VRK" : "Демо"}
          metaTitle={viewer ? "Рабочая область" : "Обзор продукта"}
          mobileOpen={mobileOpen}
          onMobileOpenChange={setMobileOpen}
        />
      }
    >
      {children}
    </AppShell>
  );
}
