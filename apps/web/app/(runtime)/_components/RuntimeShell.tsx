"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { Building2, ClipboardList, LogOut, ShieldCheck, Wrench } from "lucide-react";
import { AppShell, SidebarNav, TopBar } from "@/widgets/OperatorShell";

const runtimeNavItems = [
  { key: "company", label: "Компания", href: "/company", icon: Building2 },
  { key: "equipment", label: "Оборудование", href: "/equipment", icon: Wrench },
  { key: "contracts", label: "Договоры", href: "/contracts", icon: ClipboardList },
  { key: "requests", label: "Заявки", href: "/requests", icon: ClipboardList, badge: "Stage 04" },
] as const;

const runtimeFooterItems = [
  { key: "support", label: "Boundary notes", href: "#boundary-notes", icon: ShieldCheck },
  { key: "logout", label: "Выйти", href: "/login?logout=1", icon: LogOut },
] as const;

const runtimeMetaByPath = {
  "/company": {
    activeKey: "company",
    breadcrumbs: [{ label: "Runtime shell", href: "/company" }, { label: "Компания" }],
  },
  "/equipment": {
    activeKey: "equipment",
    breadcrumbs: [{ label: "Runtime shell", href: "/company" }, { label: "Оборудование" }],
  },
  "/contracts": {
    activeKey: "contracts",
    breadcrumbs: [{ label: "Runtime shell", href: "/company" }, { label: "Договоры" }],
  },
  "/requests": {
    activeKey: "requests",
    breadcrumbs: [{ label: "Runtime shell", href: "/company" }, { label: "Заявки" }],
  },
} as const;

function resolveRuntimeMeta(pathname: string) {
  return runtimeMetaByPath[pathname as keyof typeof runtimeMetaByPath] ?? runtimeMetaByPath["/company"];
}

export interface RuntimeShellProps {
  children: ReactNode;
  viewer?: {
    name: string;
    role: string;
  };
  eyebrow?: string;
}

export function RuntimeShell({ children, eyebrow = "Stage 02 • Runtime shell", viewer }: RuntimeShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const currentMeta = resolveRuntimeMeta(pathname);

  return (
    <AppShell
      header={
        <TopBar
          breadcrumbs={currentMeta.breadcrumbs}
          eyebrow={eyebrow}
          mobileMenuOpen={mobileOpen}
          notificationsCount={0}
          onMobileMenuOpenChange={setMobileOpen}
          searchPlaceholder={viewer ? "Поиск появится в следующих slices Stage 03" : "Поиск и фильтры включатся после Stage 03"}
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
                  name: "Пилотный customer-admin",
                  role: "shell-only bootstrap contour",
                  initials: "VR",
                }
          }
        />
      }
      sidebar={
        <SidebarNav
          activeKey={currentMeta.activeKey}
          footerItems={runtimeFooterItems}
          items={runtimeNavItems}
          metaLabel={viewer ? "Stage 03" : "Stage 02"}
          metaTitle={viewer ? "Organization launch" : "Runtime shell"}
          mobileOpen={mobileOpen}
          onMobileOpenChange={setMobileOpen}
        />
      }
    >
      {children}
    </AppShell>
  );
}
