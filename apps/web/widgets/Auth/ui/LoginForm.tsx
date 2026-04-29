import type { ChangeEventHandler, FormEventHandler, HTMLAttributes, ReactNode } from "react";
import { ArrowRight, Check, LockKeyhole, Mail } from "lucide-react";
import { Button, Card, InputField } from "@/shared/ui";
import { cn } from "@/shared/lib/cn";

export type LoginFormFields = {
  loginLabel?: string;
  loginPlaceholder?: string;
  passwordLabel?: string;
  passwordPlaceholder?: string;
  rememberLabel?: string;
  forgotPasswordLabel?: string;
};

export type LoginFormFieldErrors = {
  login?: string;
  password?: string;
};

export type LoginWorkspaceHint = {
  organizationName: string;
  scopeType: string;
  scopeName: string;
  landingPath: string;
};

export interface LoginFormProps extends Omit<HTMLAttributes<HTMLDivElement>, "onSubmit"> {
  fields?: LoginFormFields;
  forgotPasswordHref?: string;
  submitLabel: string;
  loading?: boolean;
  fieldErrors?: LoginFormFieldErrors;
  formError?: string;
  consent?: ReactNode;
  workspaceHint?: LoginWorkspaceHint | null;
  onLoginChange?: ChangeEventHandler<HTMLInputElement>;
  onSubmit?: FormEventHandler<HTMLFormElement>;
}

const defaultFields: Required<LoginFormFields> = {
  loginLabel: "Корпоративная почта",
  loginPlaceholder: "operator@vrk.local…",
  passwordLabel: "Пароль",
  passwordPlaceholder: "Введите пароль…",
  rememberLabel: "Запомнить вход",
  forgotPasswordLabel: "Сбросить пароль",
};

export function LoginForm({
  className,
  consent,
  fieldErrors,
  fields,
  formError,
  forgotPasswordHref = "/password-reset",
  loading = false,
  onLoginChange,
  onSubmit,
  submitLabel,
  workspaceHint,
  ...props
}: LoginFormProps) {
  const copy = { ...defaultFields, ...fields };

  return (
    <Card className={cn("gap-5", className)} padding="lg" {...props}>
      <div className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-[0.16em] text-muted-foreground">Доступ в VRK</p>
        <div className="space-y-2">
          <h2 className="text-balance text-2xl font-bold tracking-tight text-foreground">Вход в систему</h2>
          <p className="text-sm leading-6 text-muted-foreground">
            Введите корпоративную почту и пароль, чтобы продолжить работу.
          </p>
        </div>
      </div>

      <form aria-busy={loading} className="grid gap-5" onSubmit={onSubmit}>
        <div className="grid gap-4">
          <InputField
            autoComplete="username"
            disabled={loading}
            error={fieldErrors?.login}
            label={copy.loginLabel}
            leftIcon={<Mail className="size-4" />}
            name="username"
            onChange={onLoginChange}
            placeholder={copy.loginPlaceholder}
            spellCheck={false}
            type="email"
          />
          <InputField
            autoComplete="current-password"
            disabled={loading}
            error={fieldErrors?.password}
            label={copy.passwordLabel}
            leftIcon={<LockKeyhole className="size-4" />}
            name="password"
            placeholder={copy.passwordPlaceholder}
            type="password"
          />
        </div>

        {workspaceHint ? (
          <div
            aria-live="polite"
            className="rounded-[var(--radius-lg)] border border-border bg-muted/65 px-4 py-3"
            data-testid="last-workspace-hint"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Последнее рабочее место
            </p>
            <p className="mt-1 break-words text-sm font-semibold text-foreground">{workspaceHint.scopeName}</p>
            <p className="mt-1 break-words text-sm text-muted-foreground">{workspaceHint.organizationName}</p>
            <p className="mt-2 text-xs text-muted-foreground">После входа система повторно проверит доступ.</p>
          </div>
        ) : null}

        <div className="flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <label className={cn("inline-flex items-center gap-2.5", loading && "cursor-not-allowed opacity-70")}>
            <span className="relative flex size-5 items-center justify-center">
              <input
                className="peer absolute inset-0 m-0 h-full w-full cursor-pointer opacity-0"
                defaultChecked
                disabled={loading}
                name="remember-session"
                type="checkbox"
              />
              <span className="flex size-5 items-center justify-center rounded-[0.45rem] border border-border bg-card text-transparent shadow-xs transition-colors peer-checked:border-accent peer-checked:bg-accent peer-checked:text-accent-foreground peer-focus-visible:ring-2 peer-focus-visible:ring-ring/25 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background">
                <Check aria-hidden="true" className="size-3" />
              </span>
            </span>
            <span>{copy.rememberLabel}</span>
          </label>
          <a
            aria-disabled={loading || undefined}
            className={cn(
              "font-medium text-accent transition-colors hover:text-accent/80",
              loading && "pointer-events-none text-text-disabled",
            )}
            href={forgotPasswordHref}
            tabIndex={loading ? -1 : undefined}
          >
            {copy.forgotPasswordLabel}
          </a>
        </div>

        {consent ? <div className="rounded-[var(--radius-lg)] bg-muted/70 px-4 py-3">{consent}</div> : null}

        {formError ? (
          <div
            aria-live="polite"
            className="rounded-[var(--radius-lg)] border border-destructive/20 bg-destructive-soft px-4 py-3 text-sm text-destructive"
          >
            {formError}
          </div>
        ) : null}

        <div className="grid gap-3">
          <Button fullWidth loading={loading} rightIcon={<ArrowRight className="size-4" />} type="submit">
            {submitLabel}
          </Button>
        </div>
      </form>
    </Card>
  );
}
