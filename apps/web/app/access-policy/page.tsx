import type { Metadata } from "next";
import { ArrowLeft, Building2, FileText, LockKeyhole, ShieldCheck } from "lucide-react";
import { Badge, Card } from "@/shared/ui";

export const metadata: Metadata = {
  title: "Политика доступа | VRK",
  description: "Правила доступа для приглашенных учетных записей VRK.",
};

const policySections = [
  {
    title: "1. Назначение",
    paragraphs: [
      "Эта политика описывает базовые правила входа и работы пользователя, который получил доступ в VRK по приглашению организации.",
      "Подтверждение на странице входа означает согласие работать только в назначенной области доступа.",
    ],
  },
  {
    title: "2. Приглашенная учетная запись",
    paragraphs: [
      "Пользователь входит в систему только под своей персональной учетной записью, созданной или активированной через приглашение.",
      "Передача логина, пароля, ссылки приглашения или активной сессии другому человеку не допускается в рабочем контуре продукта.",
    ],
  },
  {
    title: "3. Организационный контур",
    paragraphs: [
      "После входа пользователь работает только в назначенной организации, дивизионе, юните или подрядной области.",
      "Если пользователь видит данные, заявки, договоры, оборудование или настройки, которые не относятся к его рабочему контуру, он должен прекратить работу с этими данными и сообщить ответственному администратору.",
    ],
  },
  {
    title: "4. Действия пользователя",
    paragraphs: [
      "Пользователь подтверждает, что будет выполнять операции только в рамках своей роли и текущих рабочих задач.",
      "Создание, изменение, архивирование, передача или выгрузка данных допустимы только тогда, когда это соответствует выданным правам и операционному процессу организации.",
    ],
  },
  {
    title: "5. Аудит и отзыв доступа",
    paragraphs: [
      "VRK может фиксировать входы, действия в системе, изменения данных и технические события, связанные с безопасностью и поддержкой продукта.",
      "Организация или платформа может ограничить, отозвать или пересобрать доступ, если приглашение выдано ошибочно, роль изменилась, сотрудник больше не участвует в процессе или обнаружен риск некорректного доступа.",
    ],
  },
];

const commitments = [
  "входить только под собственной приглашенной учетной записью;",
  "не использовать чужие приглашения, пароли или сессии;",
  "работать только с данными своего разрешенного контура;",
  "не пытаться расширять доступ обходными действиями;",
  "сообщать администратору о чужих данных или подозрительных событиях.",
];

const policyUpdatedAt = new Intl.DateTimeFormat("ru-RU", {
  dateStyle: "long",
}).format(new Date(Date.UTC(2026, 3, 29)));

function ActionLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      className="inline-flex h-10 items-center justify-center gap-2 rounded-[var(--radius-lg)] border border-border bg-card px-5 text-sm font-medium text-foreground shadow-xs transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/25 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      href={href}
    >
      <ArrowLeft aria-hidden="true" className="size-4" />
      {label}
    </a>
  );
}

export default function AccessPolicyPage() {
  return (
    <>
      <a
        className="sr-only focus:not-sr-only focus:fixed focus:left-5 focus:top-5 focus:z-50 focus:rounded-[var(--radius-lg)] focus:bg-card focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-foreground focus:shadow-md focus:outline-none focus:ring-2 focus:ring-ring/25"
        href="#policy-content"
      >
        Перейти к документу
      </a>
      <main className="min-h-screen bg-background px-5 py-6 text-foreground md:px-8 md:py-8" id="policy-content">
        <div className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[minmax(0,0.78fr)_minmax(280px,0.32fr)]">
          <section className="space-y-6">
            <div className="space-y-4">
              <ActionLink href="/login" label="Вернуться ко входу" />
              <div className="space-y-3">
                <Badge icon={<FileText aria-hidden="true" className="size-4" />} tone="warning">
                  Правила доступа
                </Badge>
                <div className="space-y-3">
                  <h1 className="break-words text-balance text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                    Политика доступа приглашенной учетной записи
                  </h1>
                  <p className="max-w-3xl break-words text-base leading-7 text-muted-foreground">
                    Пользователь входит по приглашению и работает только в назначенной области доступа.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-4">
              {policySections.map((section) => (
                <Card className="gap-3" key={section.title} padding="lg">
                  <h2 className="text-xl font-semibold text-foreground">{section.title}</h2>
                  <div className="space-y-3">
                    {section.paragraphs.map((paragraph) => (
                      <p className="break-words text-sm leading-6 text-muted-foreground" key={paragraph}>
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          </section>

          <aside className="space-y-4 lg:sticky lg:top-8 lg:self-start">
            <Card className="gap-4" padding="lg">
              <div className="flex size-11 items-center justify-center rounded-[var(--radius-lg)] bg-accent-soft text-accent">
                <ShieldCheck aria-hidden="true" className="size-5" />
              </div>
              <div className="min-w-0 space-y-2">
                <h2 className="text-lg font-semibold text-foreground">Подтверждение при входе</h2>
                <p className="break-words text-sm leading-6 text-muted-foreground">
                  Нажимая чекбокс на странице логина, пользователь подтверждает базовые рабочие правила:
                </p>
              </div>
              <ul className="space-y-3">
                {commitments.map((commitment) => (
                  <li className="flex items-start gap-3 text-sm leading-6 text-muted-foreground" key={commitment}>
                    <LockKeyhole aria-hidden="true" className="mt-1 size-4 shrink-0 text-accent" />
                    <span className="min-w-0 break-words">{commitment}</span>
                  </li>
                ))}
              </ul>
            </Card>

            <Card className="gap-3" padding="lg" tone="muted">
              <div className="flex items-center gap-2">
                <Building2 aria-hidden="true" className="size-5 text-accent" />
                <h2 className="text-lg font-semibold text-foreground">Версия правил</h2>
              </div>
              <dl className="grid gap-2 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted-foreground">Статус</dt>
                  <dd className="font-medium text-foreground">Действует</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted-foreground">Обновлено</dt>
                  <dd className="text-right font-medium text-foreground">{policyUpdatedAt}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted-foreground">Назначение</dt>
                  <dd className="font-medium text-foreground">Вход по приглашению</dd>
                </div>
              </dl>
            </Card>
          </aside>
        </div>
      </main>
    </>
  );
}
