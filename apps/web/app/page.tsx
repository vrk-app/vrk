import Link from "next/link";
import { ArrowRight, BookOpenText } from "lucide-react";
import { Badge, Card } from "@/shared/ui";

export default function Home() {
  const publishedStorybookUrl = process.env.NEXT_PUBLIC_STORYBOOK_URL?.trim();
  const storybookHref = publishedStorybookUrl || "#storybook-runbook";
  const hasPublishedStorybookUrl = storybookHref !== "#storybook-runbook";
  const storybookCtaLabel = hasPublishedStorybookUrl ? "Открыть Storybook" : "Как запустить Storybook";
  const storybookHint = hasPublishedStorybookUrl
    ? "CTA открывает опубликованный Storybook preview для этого окружения."
    : "Для этого окружения отдельный Storybook preview не опубликован. Ниже показаны команды локального запуска.";

  return (
    <main className="flex flex-1 bg-background px-5 py-8 text-foreground md:px-8 md:py-10">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl space-y-4">
            <Badge tone="interactive" size="sm">
              Stage 01 • UI-основание через Storybook
            </Badge>
            <div className="space-y-3">
              <h1 className="text-balance text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                Web-контур VRK теперь заякорен на переиспользуемых Storybook-срезах, каркасных композициях и семантических токенах.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">
                Этот контур нужен, чтобы полностью доказать Stage 01 UI-основания до того, как Stage 02 начнет подключать живые интеграции и backend-контур.
              </p>
            </div>
          </div>
          <div className="flex max-w-sm flex-col gap-2 md:items-end">
            <Link
              className="inline-flex h-10 items-center justify-center gap-2 rounded-[var(--radius-lg)] bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-xs transition-colors duration-150 hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/25 focus-visible:ring-offset-2 focus-visible:ring-offset-background [&_svg]:text-primary-foreground"
              href={storybookHref}
              rel={hasPublishedStorybookUrl ? "noreferrer" : undefined}
              target={hasPublishedStorybookUrl ? "_blank" : undefined}
            >
              <span>{storybookCtaLabel}</span>
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
            <p className="text-sm leading-6 text-muted-foreground md:text-right">{storybookHint}</p>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1.45fr_1fr]">
          <Card className="gap-6">
            <div className="space-y-2">
              <p className="text-sm font-medium uppercase tracking-[0.14em] text-muted-foreground">
                Что уже доказано в Stage 01
              </p>
              <h2 className="text-balance text-2xl font-semibold text-foreground">
                Foundation-слой, навигационный каркас, auth-базис и базис списка заявок собраны в один Storybook-first контур.
              </h2>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {[
                "TokenDocs и IconGallery фиксируют foundation-слой через токены, иконки и правила плотного B2B-интерфейса",
                "Button, InputField, Badge и Card закрывают первый batch Wave 1 с обязательными базовыми состояниями",
                "AppShell, SidebarNav, TopBar, Breadcrumbs и PageHeader доказывают спокойный операторский каркас без интеграций Stage 02",
                "AuthPage и RequestsPage showcase-истории собирают auth-базис и список заявок в переиспользуемые UI-срезы",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-xl border border-border bg-card px-4 py-4 text-sm leading-6 text-foreground shadow-xs"
                >
                  {item}
                </div>
              ))}
            </div>
          </Card>

          <Card id="storybook-runbook" tone="muted" className="gap-5 scroll-mt-8">
            <div className="flex items-center gap-3 text-foreground">
              <div className="flex size-10 items-center justify-center rounded-full bg-accent-soft text-accent">
                <BookOpenText aria-hidden="true" className="size-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Команды репозитория</h2>
                <p className="text-sm text-muted-foreground">Запускаются из корня репозитория.</p>
              </div>
            </div>
            <div className="space-y-3 font-mono text-sm text-foreground">
              <div className="rounded-xl border border-border bg-card px-4 py-3 shadow-xs">
                pnpm install
              </div>
              <div className="rounded-xl border border-border bg-card px-4 py-3 shadow-xs">
                pnpm storybook
              </div>
              <div className="rounded-xl border border-border bg-card px-4 py-3 shadow-xs">
                pnpm run web:smoke
              </div>
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
}
