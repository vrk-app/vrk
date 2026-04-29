import type { FormEventHandler, HTMLAttributes, ReactNode } from "react";
import { ArrowRight, Building2, Mail, Phone, UserRound } from "lucide-react";
import { Button, Card, InputField } from "@/shared/ui";
import { cn } from "@/shared/lib/cn";

export interface RegisterFormProps extends Omit<HTMLAttributes<HTMLDivElement>, "onSubmit"> {
  consent?: ReactNode;
  loading?: boolean;
  formError?: string;
  onSubmit?: FormEventHandler<HTMLFormElement>;
}

export function RegisterForm({
  className,
  consent,
  formError,
  loading = false,
  onSubmit,
  ...props
}: RegisterFormProps) {
  return (
    <Card className={cn("gap-5", className)} padding="lg" {...props}>
      <div className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-[0.16em] text-muted-foreground">
          Старт кабинета администратора заказчика
        </p>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Зарегистрировать компанию
          </h2>
          <p className="text-sm leading-6 text-muted-foreground">
            Укажите контактное лицо, компанию и рабочие контакты.
          </p>
        </div>
      </div>

      <form className="grid gap-5" onSubmit={onSubmit}>
        <div className="grid gap-4 md:grid-cols-2">
          <InputField
            autoComplete="name"
            label="Контактное лицо"
            leftIcon={<UserRound className="size-4" />}
            name="contact-name"
            placeholder="Анна Волкова…"
          />
          <InputField
            autoComplete="organization"
            label="Компания"
            leftIcon={<Building2 className="size-4" />}
            name="company-name"
            placeholder="ВРК Север…"
            spellCheck={false}
          />
          <InputField
            autoComplete="email"
            label="Рабочая почта"
            leftIcon={<Mail className="size-4" />}
            name="email"
            placeholder="admin@vrk.local…"
            spellCheck={false}
            type="email"
          />
          <InputField
            autoComplete="tel"
            label="Телефон"
            leftIcon={<Phone className="size-4" />}
            name="phone"
            placeholder="+7 (999) 123-45-67…"
            type="tel"
          />
        </div>

        {consent ? <div className="rounded-[var(--radius-lg)] bg-muted/70 px-4 py-3">{consent}</div> : null}

        {formError ? (
          <div
            aria-live="polite"
            className="rounded-[var(--radius-lg)] border border-warning/30 bg-warning-soft px-4 py-3 text-sm text-warning-strong"
          >
            {formError}
          </div>
        ) : null}

        <div className="grid gap-3">
          <Button fullWidth loading={loading} rightIcon={<ArrowRight className="size-4" />} type="submit">
            Зарегистрировать компанию
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            После регистрации откроется раздел компании.
          </p>
        </div>
      </form>
    </Card>
  );
}
