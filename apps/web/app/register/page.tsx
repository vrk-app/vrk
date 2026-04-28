"use client";

import { Building2, ShieldCheck, UserRound } from "lucide-react";
import { AuthAside, type AuthAsideProps } from "@/app/_components/AuthAside";
import { PlatformAdminInviteForm } from "@/features/Stage03Bootstrap";
import { AuthSplitLayout } from "@/widgets/Auth";

const inviteAsideItems: AuthAsideProps["items"] = [
  {
    title: "Organization shell",
    detail: "Платформенный админ создает только оболочку и не заполняет все реквизиты вместо клиента.",
    icon: <Building2 aria-hidden="true" className="size-5" />,
  },
  {
    title: "Одноразовый invite",
    detail: "Первый администратор задает пароль только после перехода по персональной ссылке.",
    icon: <ShieldCheck aria-hidden="true" className="size-5" />,
  },
  {
    title: "Launch wizard",
    detail: "После acceptance пользователь попадает не в пустой кабинет, а в мастер запуска организации.",
    icon: <UserRound aria-hidden="true" className="size-5" />,
  },
];

export default function RegisterPage() {
  return (
    <AuthSplitLayout
      formSlot={<PlatformAdminInviteForm />}
      illustrationSlot={
        <AuthAside
          badgeLabel="Stage 03 • Invite issuance"
          description="Маршрут `/register` больше не обещает self-service регистрацию. Он служит управляемым входом для платформенного админа, который выпускает first-admin invite."
          items={inviteAsideItems}
          title="Сначала shell и invite, потом активация по ссылке"
        />
      }
      subtitle="Платформенный админ создает организацию-заготовку и отправляет одноразовое приглашение. Полная настройка организации живет уже в launch wizard приглашенного администратора."
      title="Выдать first-admin приглашение"
    />
  );
}
