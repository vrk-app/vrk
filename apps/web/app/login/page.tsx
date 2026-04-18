"use client";

import { useTransition, type FormEventHandler } from "react";
import { useRouter } from "next/navigation";
import { AuthAside, loginAsideItems } from "@/app/_components/AuthAside";
import { AuthSplitLayout, ConsentRow, LoginForm } from "@/widgets/Auth";

export default function LoginPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleSubmit: FormEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault();
    startTransition(() => {
      router.push("/company");
    });
  };

  return (
    <AuthSplitLayout
      formSlot={
        <LoginForm
          consent={
            <ConsentRow
              defaultChecked
              label="Я работаю под своей учетной записью и понимаю, что вход пока остается shell-only boundary."
              links={[
                { label: "политикой доступа", href: "#access-policy" },
                { label: "правилами Stage 02", href: "#stage-boundary" },
              ]}
            />
          }
          formError="Live auth/session ещё не подключены. Следующий шаг после входа — company shell без persisted state."
          loading={isPending}
          onSubmit={handleSubmit}
          submitLabel="Открыть company shell"
        />
      }
      illustrationSlot={
        <AuthAside
          badgeLabel="Stage 02 • Login shell"
          description="Экран входа уже ведёт в продуктовый runtime contour, но честно показывает, что role/session logic ещё не активирована."
          items={loginAsideItems}
          title="Вход теперь ведёт в route shell, а не в Storybook landing"
        />
      }
      subtitle="Сначала пользователь проходит контролируемый вход, затем попадает в контур компании и видит следующие маршруты bootstrap-потока."
      title="Открыть рабочий shell customer-admin"
    />
  );
}
