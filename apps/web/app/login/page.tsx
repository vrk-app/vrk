"use client";

import { useEffect, useState, useTransition, type FormEventHandler } from "react";
import { useRouter } from "next/navigation";
import { AuthAside, loginAsideItems } from "@/app/_components/AuthAside";
import { AuthSplitLayout, ConsentRow, LoginForm } from "@/widgets/Auth";
import { resolveSessionLandingPath, type ApiEnvelope, type SessionSummaryResponse } from "@/shared/api";

export default function LoginPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get("logout") !== "1") {
      return;
    }

    void fetch("/api/auth/session/current", { method: "DELETE" });
  }, []);

  const handleSubmit: FormEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault();
    setFormError(null);
    const formData = new FormData(event.currentTarget);

    startTransition(() => {
      void fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: String(formData.get("username") ?? ""),
          password: String(formData.get("password") ?? ""),
        }),
      })
        .then(async (response) => {
          const body = (await response.json()) as ApiEnvelope<SessionSummaryResponse>;
          if (!response.ok || !body.success || !body.data) {
            setFormError(body.error ?? "Не удалось выполнить вход.");
            return;
          }

          router.push(resolveSessionLandingPath(body.data));
          router.refresh();
        })
        .catch(() => {
          setFormError("Не удалось выполнить вход.");
        });
    });
  };

  return (
    <AuthSplitLayout
      formSlot={
        <LoginForm
          consent={
            <ConsentRow
              defaultChecked
              label="Я подтверждаю, что вхожу по приглашенной учетной записи и продолжу работу только в своем организационном контуре."
              links={[
                { label: "политикой доступа", href: "#access-policy" },
                { label: "launch wizard", href: "#launch-wizard" },
              ]}
            />
          }
          formError={formError ?? undefined}
          loading={isPending}
          onSubmit={handleSubmit}
          submitLabel="Войти и открыть рабочий contour"
        />
      }
      illustrationSlot={
        <AuthAside
          badgeLabel="Stage 03 • Login"
          description="После acceptance пользователь возвращается через обычный login и попадает либо в launch wizard, либо сразу в свой разрешенный workspace contour."
          items={loginAsideItems}
          title="Вход ведет в живой scoped contour, а не в пустой shell"
        />
      }
      subtitle="Приглашенный пользователь логинится по email и паролю. Если bootstrap еще не завершен, система возвращает администратора в launch wizard; иначе открывает только разрешенный рабочий contour."
      title="Войти в контур организации"
    />
  );
}
