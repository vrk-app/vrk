import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { RuntimeShell } from "./_components/RuntimeShell";
import { roleTemplateLabel, SESSION_COOKIE_NAME } from "@/shared/api";
import { fetchSessionSummary } from "@/shared/api/session-server";

export default async function RuntimeLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const cookieStore = await cookies();
  const session = await fetchSessionSummary(cookieStore.get(SESSION_COOKIE_NAME)?.value);

  return (
    <RuntimeShell
      eyebrow={session ? "Рабочая область организации" : "Обзор без входа"}
      viewer={
        session
          ? {
              name: session.account.fullName,
              role: session.requiresLaunchWizard
                ? "организация запускается"
                : roleTemplateLabel(session.grant?.roleTemplate ?? "organization_admin").toLocaleLowerCase("ru-RU"),
            }
          : undefined
      }
    >
      {children}
    </RuntimeShell>
  );
}
