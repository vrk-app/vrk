import { AuthIllustration } from "@/app/_components/AuthIllustration";
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
        illustrationSlot={<AuthIllustration />}
        subtitle={
          isFirstAdmin
            ? "Задайте пароль, чтобы открыть профиль компании и управление структурой."
            : "Задайте пароль, чтобы подключиться к рабочему пространству организации."
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
        subtitle="Если приглашение уже было использовано или срок ссылки истек, запросите новую ссылку."
        title="Одноразовая ссылка больше не активна"
      />
    );
  }
}
