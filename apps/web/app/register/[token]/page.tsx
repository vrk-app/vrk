import { ArrowUpRight, LockKeyhole, ShieldCheck } from "lucide-react";
import { AuthAside } from "@/app/_components/AuthAside";
import { FirstAdminActivationForm } from "@/features/Stage03Bootstrap";
import { AuthSplitLayout } from "@/widgets/Auth";
import { BackendError, fetchBackend } from "@/shared/api/backend";
import type { PublicInviteInspectionResponse } from "@/shared/api";

type Props = {
  params: Promise<{ token: string }>;
};

export default async function RegisterInvitePage({ params }: Props) {
  const { token } = await params;

  try {
    const invite = (await fetchBackend<PublicInviteInspectionResponse>(`/api/v1/invites/${token}`)).data;

    const isFirstAdmin = invite.inviteKind === "first_admin";

    return (
      <AuthSplitLayout
        formSlot={<FirstAdminActivationForm invite={invite} inviteToken={token} />}
        illustrationSlot={
          <AuthAside
            badgeLabel={isFirstAdmin ? "Stage 03 • Invite activation" : "Stage 03 • Employee activation"}
            description={
              isFirstAdmin
                ? "Ссылка приглашения одноразовая. После успешного acceptance система открывает launch wizard и больше не разрешает вторую активацию тем же токеном."
                : "Сотрудник подключается по одноразовой ссылке, получает membership и scoped grant, а затем попадает только в свой разрешенный workspace."
            }
            items={[
              {
                title: "Password setup",
                detail: "Пароль задается только после открытия персональной ссылки.",
                icon: <LockKeyhole aria-hidden="true" className="size-5" />,
              },
              {
                title: "Membership + grant",
                detail: isFirstAdmin
                  ? "Backend создает membership и organization-admin grant в момент acceptance."
                  : "Backend создает или связывает account, выдает membership и scoped grant по целевому scope.",
                icon: <ShieldCheck aria-hidden="true" className="size-5" />,
              },
              {
                title: isFirstAdmin ? "Launch next" : "Scoped landing",
                detail: isFirstAdmin
                  ? "Следующий экран после acceptance — wizard запуска организации."
                  : "После acceptance и login пользователь попадает только в разрешенный contour без расширения вверх.",
                icon: <ArrowUpRight aria-hidden="true" className="size-5" />,
              },
            ]}
            title={isFirstAdmin ? "Примите приглашение и завершите запуск" : "Примите приглашение и откройте рабочий contour"}
          />
        }
        subtitle={
          isFirstAdmin
            ? "Эта ссылка выдана платформенным администратором. После задания пароля вы сразу продолжите запуск организации."
            : "Эта ссылка выдана администратором организации. После задания пароля вы увидите только свой разрешенный рабочий контур."
        }
        title={isFirstAdmin ? "Активация первого администратора" : "Подключение сотрудника"}
      />
    );
  } catch (error) {
    const message =
      error instanceof BackendError
        ? error.message
        : "Не удалось открыть приглашение. Возможно, ссылка больше недействительна.";

    return (
      <AuthSplitLayout
        formSlot={
          <div className="rounded-[var(--radius-xl)] border border-border bg-card p-6 text-sm leading-6 text-muted-foreground shadow-xs">
            <p className="text-base font-semibold text-foreground">Приглашение недоступно</p>
            <p className="mt-3">{message}</p>
          </div>
        }
        illustrationSlot={null}
        subtitle="Если приглашение уже было использовано или срок ссылки истек, platform admin должен выдать новое."
        title="Одноразовая ссылка больше не активна"
      />
    );
  }
}
