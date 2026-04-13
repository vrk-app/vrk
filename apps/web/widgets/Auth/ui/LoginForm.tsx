import type { FormEventHandler, HTMLAttributes, ReactNode } from "react";
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

export interface LoginFormProps extends Omit<HTMLAttributes<HTMLDivElement>, "onSubmit"> {
  fields?: LoginFormFields;
  submitLabel: string;
  loading?: boolean;
  fieldErrors?: LoginFormFieldErrors;
  formError?: string;
  consent?: ReactNode;
  onSubmit?: FormEventHandler<HTMLFormElement>;
}

const defaultFields: Required<LoginFormFields> = {
  loginLabel: "Корпоративная почта",
  loginPlaceholder: "operator@vrk.local…",
  passwordLabel: "Пароль",
  passwordPlaceholder: "Введите пароль…",
  rememberLabel: "Запомнить рабочее место",
  forgotPasswordLabel: "Сбросить пароль",
};

export function LoginForm({
  className,
  consent,
  fieldErrors,
  fields,
  formError,
  loading = false,
  onSubmit,
  submitLabel,
  ...props
}: LoginFormProps) {
  const copy = { ...defaultFields, ...fields };

  return (
    <Card className={cn("gap-5", className)} padding="lg" {...props}>
      <div className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-[0.16em] text-muted-foreground">
          Доступ в контур
        </p>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Войти в рабочую смену</h2>
          <p className="text-sm leading-6 text-muted-foreground">
            Авторизация остаётся лёгкой по форме, но прозрачной по статусам и проверкам.
          </p>
        </div>
      </div>

      <form className="grid gap-5" onSubmit={onSubmit}>
        <div className="grid gap-4">
          <InputField
            autoComplete="username"
            error={fieldErrors?.login}
            label={copy.loginLabel}
            leftIcon={<Mail className="size-4" />}
            name="username"
            placeholder={copy.loginPlaceholder}
            spellCheck={false}
          />
          <InputField
            autoComplete="current-password"
            error={fieldErrors?.password}
            label={copy.passwordLabel}
            leftIcon={<LockKeyhole className="size-4" />}
            name="password"
            placeholder={copy.passwordPlaceholder}
            type="password"
          />
        </div>

        <div className="flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <label className="inline-flex items-center gap-2.5">
            <span className="relative flex size-5 items-center justify-center">
              <input
                className="peer absolute inset-0 m-0 h-full w-full cursor-pointer opacity-0"
                defaultChecked
                name="remember-session"
                type="checkbox"
              />
              <span className="flex size-5 items-center justify-center rounded-[0.45rem] border border-border bg-card text-transparent shadow-xs transition-colors peer-checked:border-accent peer-checked:bg-accent peer-checked:text-accent-foreground peer-focus-visible:ring-2 peer-focus-visible:ring-ring/25 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background">
                <Check aria-hidden="true" className="size-3" />
              </span>
            </span>
            <span>{copy.rememberLabel}</span>
          </label>
          <a className="font-medium text-accent transition-colors hover:text-accent/80" href="#forgot">
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
          <p className="text-center text-sm text-muted-foreground">
            Сессия подтверждает роль, маршрут и историю действий без отдельного подключения Stage 02.
          </p>
        </div>
      </form>
    </Card>
  );
}
