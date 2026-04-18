import { CloudOff, RefreshCcw, ShieldCheck, Smartphone } from "lucide-react";
import { getFieldEnv } from "@/shared/config/env";

const statusCards = [
  {
    title: "Черновики офлайн",
    detail: "Инженер сможет собирать заметки и чек-листы локально, но полноценный offline engine остается на Stage 06.",
    tone: "warning",
    icon: CloudOff,
  },
  {
    title: "Ручная синхронизация",
    detail: "После восстановления связи пользователь увидит очередь и запустит retry вручную вместо скрытого background sync.",
    tone: "interactive",
    icon: RefreshCcw,
  },
  {
    title: "Серверный контроль",
    detail: "Backend остается source of truth для подтвержденных изменений, приемки и итоговых статусов.",
    tone: "success",
    icon: ShieldCheck,
  },
] as const;

const checklist = [
  "PWA manifest уже отдается и фиксирует manifest-backed contour.",
  "API boundary видна через общий platform backend без live auth/session.",
  "Полевой контур пока показывает только scaffold, а не рабочий request lifecycle.",
] as const;

export const dynamic = "force-dynamic";

export default function FieldHomePage() {
  const env = getFieldEnv();

  return (
    <main
      id="field-main"
      className="min-h-screen px-5 py-6 md:px-8 md:py-8"
      style={{
        paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))",
        paddingLeft: "max(1.25rem, env(safe-area-inset-left))",
        paddingRight: "max(1.25rem, env(safe-area-inset-right))",
        paddingTop: "max(1.5rem, env(safe-area-inset-top))",
      }}
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <section className="overflow-hidden rounded-[var(--radius-xl)] border border-border bg-surface shadow-[var(--shadow-sm)]">
          <div className="border-b border-border bg-surface-muted/70 px-5 py-4 md:px-6">
            <div className="flex items-center gap-3 text-sm font-medium text-foreground/80">
              <span className="flex size-10 items-center justify-center rounded-2xl bg-interactive-soft text-interactive">
                <Smartphone aria-hidden="true" className="size-5" />
              </span>
              <div className="flex flex-col">
                <span className="text-xs uppercase tracking-[0.12em] text-foreground/45">
                  Stage 02 platform baseline
                </span>
                <span>Инженерный контур</span>
              </div>
            </div>
          </div>

          <div className="grid gap-6 px-5 py-6 md:grid-cols-[minmax(0,1.5fr)_minmax(18rem,1fr)] md:px-6">
            <div className="space-y-4">
              <div className="space-y-3">
                <h1 className="max-w-2xl text-balance text-3xl font-semibold tracking-tight text-foreground">
                  PWA-first scaffold для полевого режима без ранней имитации Stage 06
                </h1>
                <p className="max-w-2xl text-base leading-7 text-foreground/70">
                  Этот contour доказывает только platform floor: manifest-backed shell, понятные offline/sync boundaries
                  и подключение к общему backend baseline. Реальные draft-storage и conflict flows остаются следующими
                  slices.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-[var(--radius-lg)] border border-border bg-surface-muted px-4 py-3 shadow-[var(--shadow-xs)]">
                  <div className="text-xs font-medium uppercase tracking-[0.08em] text-foreground/45">API</div>
                  <div className="mt-2 break-all font-mono text-sm text-foreground" translate="no">
                    {env.apiBaseUrl}
                  </div>
                </div>
                <div className="rounded-[var(--radius-lg)] border border-border bg-surface-muted px-4 py-3 shadow-[var(--shadow-xs)]">
                  <div className="text-xs font-medium uppercase tracking-[0.08em] text-foreground/45">Sync mode</div>
                  <div className="mt-2 text-sm font-medium text-foreground" translate="no">
                    {env.manualSyncMode}
                  </div>
                </div>
                <div className="rounded-[var(--radius-lg)] border border-border bg-surface-muted px-4 py-3 shadow-[var(--shadow-xs)]">
                  <div className="text-xs font-medium uppercase tracking-[0.08em] text-foreground/45">Manifest</div>
                  <div className="mt-2 font-mono text-sm font-medium text-foreground" translate="no">
                    /manifest.webmanifest
                  </div>
                </div>
              </div>
            </div>

            <aside className="rounded-[var(--radius-xl)] border border-border bg-surface-muted/80 p-5 shadow-[var(--shadow-xs)]">
              <div className="text-sm font-medium text-foreground/70">Что уже доказано этим scaffold</div>
              <ul className="mt-4 flex flex-col gap-3">
                {checklist.map((item) => (
                  <li key={item} className="rounded-[var(--radius-lg)] border border-border bg-surface px-4 py-3 text-sm leading-6 text-foreground/75">
                    {item}
                  </li>
                ))}
              </ul>
            </aside>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {statusCards.map(({ detail, icon: Icon, title, tone }) => {
            const toneClassName = tone === "success"
              ? "bg-success-soft text-success-strong"
              : tone === "warning"
                ? "bg-warning-soft text-warning-strong"
                : "bg-interactive-soft text-interactive";

            return (
              <article
                key={title}
                className="rounded-[var(--radius-xl)] border border-border bg-surface p-5 shadow-[var(--shadow-xs)]"
              >
                <div className={`inline-flex size-11 items-center justify-center rounded-2xl ${toneClassName}`}>
                  <Icon aria-hidden="true" className="size-5" />
                </div>
                <h2 className="mt-4 text-xl font-semibold tracking-tight text-foreground">{title}</h2>
                <p className="mt-3 text-sm leading-6 text-foreground/70">{detail}</p>
              </article>
            );
          })}
        </section>
      </div>
    </main>
  );
}
