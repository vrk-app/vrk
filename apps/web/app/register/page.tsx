"use client";

import { AuthIllustration } from "@/app/_components/AuthIllustration";
import { PlatformAdminInviteForm } from "@/features/Stage03Bootstrap";
import { AuthSplitLayout } from "@/widgets/Auth";

export default function RegisterPage() {
  return (
    <AuthSplitLayout
      formSlot={<PlatformAdminInviteForm />}
      fullBleedIllustration
      illustrationSlot={<AuthIllustration />}
      showAuthBadge={false}
      subtitle="Заполните данные организации и первого администратора, чтобы сформировать ссылку доступа."
      title="Пригласить администратора"
    />
  );
}
