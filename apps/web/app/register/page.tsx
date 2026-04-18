"use client";

import { useTransition, type FormEventHandler } from "react";
import { useRouter } from "next/navigation";
import { AuthAside, registerAsideItems } from "@/app/_components/AuthAside";
import { RegisterForm } from "@/features/AuthRegister";
import { AuthSplitLayout, ConsentRow } from "@/widgets/Auth";

export default function RegisterPage() {
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
        <RegisterForm
          consent={
            <ConsentRow
              defaultChecked
              label="Я подтверждаю, что регистрация в этом slice создает только shell-профиль без live contractor/company activation."
              links={[
                { label: "контуром Stage 02", href: "#stage-02" },
                { label: "будущим Stage 03", href: "#stage-03" },
              ]}
            />
          }
          formError="Регистрация сохраняет только route intent: после неё пользователь должен продолжить заполнение company shell."
          loading={isPending}
          onSubmit={handleSubmit}
        />
      }
      illustrationSlot={
        <AuthAside
          badgeLabel="Stage 02 • Register shell"
          description="Регистрация делает contour product-shaped: уже видно, как пользователь переходит из входа в company/equipment/contracts, но без преждевременной доменной активации."
          items={registerAsideItems}
          title="Первый вход компании теперь зафиксирован как публичный runtime route"
        />
      }
      subtitle="Экран собирает минимальный набор полей, чтобы зафиксировать следующий шаг customer-admin bootstrap flow и не смешать его с живым master data."
      title="Зарегистрировать компанию в runtime shell"
    />
  );
}
