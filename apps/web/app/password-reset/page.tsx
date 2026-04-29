import type { Metadata } from "next";
import { ArrowLeft, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { Badge, Button, Card, InlineAlert, InputField } from "@/shared/ui";

export const metadata: Metadata = {
  title: "Сброс пароля | VRK",
  description: "Временная страница восстановления доступа VRK.",
};

function BackLink() {
  return (
    <a
      className="inline-flex h-10 items-center justify-center gap-2 rounded-[var(--radius-lg)] border border-border bg-card px-5 text-sm font-medium text-foreground shadow-xs transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/25 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      href="/login"
    >
      <ArrowLeft aria-hidden="true" className="size-4" />
      Вернуться ко входу
    </a>
  );
}

export default function PasswordResetPage() {
  return (
    <>
      <a
        className="sr-only focus:not-sr-only focus:fixed focus:left-5 focus:top-5 focus:z-50 focus:rounded-[var(--radius-lg)] focus:bg-card focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-foreground focus:shadow-md focus:outline-none focus:ring-2 focus:ring-ring/25"
        href="#password-reset-content"
      >
        Перейти к описанию сброса пароля
      </a>
      <main className="min-h-screen bg-background px-5 py-6 text-foreground md:px-8 md:py-8" id="password-reset-content">
        <div className="mx-auto grid w-full max-w-5xl gap-6">
          <section className="space-y-5">
            <BackLink />
            <div className="space-y-3">
              <Badge icon={<LockKeyhole aria-hidden="true" className="size-4" />} tone="warning">
                Временно недоступно
              </Badge>
              <div className="space-y-3">
                <h1 className="text-balance text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                  Сброс пароля
                </h1>
                <p className="max-w-3xl text-base leading-7 text-muted-foreground">
                  Восстановление через письмо пока недоступно.
                </p>
              </div>
            </div>
          </section>

          <InlineAlert
            description="Обратитесь к администратору организации или в поддержку платформы."
            icon={<ShieldCheck aria-hidden="true" className="size-5" />}
            tone="warning"
            title="Сброс пароля временно недоступен"
          />

          <Card className="gap-5" padding="lg">
            <div className="space-y-2">
              <div className="flex size-11 items-center justify-center rounded-[var(--radius-lg)] bg-accent-soft text-accent">
                <Mail aria-hidden="true" className="size-5" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-foreground">Запрос восстановления</h2>
              <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                Поле оставлено неактивным, пока отправка инструкций не подключена.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
              <InputField
                disabled
                hint="Пока обратитесь к администратору организации для восстановления доступа."
                label="Корпоративная почта"
                leftIcon={<Mail aria-hidden="true" className="size-4" />}
                name="email"
                placeholder="name@company.ru"
                type="email"
              />
              <Button disabled type="button">
                Отправить инструкцию
              </Button>
            </div>
          </Card>
        </div>
      </main>
    </>
  );
}
