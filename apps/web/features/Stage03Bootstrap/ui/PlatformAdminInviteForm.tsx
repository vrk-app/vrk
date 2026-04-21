"use client";

import Link from "next/link";
import { useState, useTransition, type FormEventHandler } from "react";
import { ArrowUpRight, Building2, Mail, ShieldCheck, UserRound } from "lucide-react";
import { Button, Card, InputField, buttonVariants } from "@/shared/ui";
import { parseApiResponse, type OrganizationShellResponse } from "@/shared/api";

const roleOptions = [
  { label: "Заказчик", value: "customer" },
  { label: "Подрядчик", value: "contractor" },
] as const;

export function PlatformAdminInviteForm() {
  const [organizationName, setOrganizationName] = useState("");
  const [firstAdminName, setFirstAdminName] = useState("");
  const [firstAdminEmail, setFirstAdminEmail] = useState("");
  const [organizationRole, setOrganizationRole] = useState<(typeof roleOptions)[number]["value"]>("customer");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<OrganizationShellResponse | null>(null);
  const [isPending, startTransition] = useTransition();

  const invitePath = success ? `/register/${success.inviteToken}` : null;

  const handleSubmit: FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    const formData = new FormData(event.currentTarget);

    const payload = {
      organizationName: String(formData.get("organizationName") ?? ""),
      organizationRole: String(formData.get("organizationRole") ?? "customer"),
      firstAdminName: String(formData.get("firstAdminName") ?? ""),
      firstAdminEmail: String(formData.get("firstAdminEmail") ?? ""),
    };

    try {
      const response = await fetch("/api/platform/organization-shells", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const shell = await parseApiResponse<OrganizationShellResponse>(
        response,
        "Не удалось создать shell и приглашение.",
      );

      setSuccess(shell);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Не удалось создать shell и приглашение.");
    }
  };

  return (
    <Card className="gap-5" padding="lg">
      <div className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-[0.16em] text-muted-foreground">
          Platform admin bootstrap
        </p>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Создать organization shell и first-admin invite
          </h2>
          <p className="text-sm leading-6 text-muted-foreground">
            В этом Stage 03 срезе платформенный админ заводит только оболочку организации и одноразовое приглашение.
            Полные реквизиты и оргструктура появятся у приглашенного администратора в launch wizard.
          </p>
        </div>
      </div>

      <form
        className="grid gap-5"
        onSubmit={(event) => {
          startTransition(() => {
            void handleSubmit(event);
          });
        }}
      >
        <div className="grid gap-4">
          <InputField
            autoComplete="off"
            label="Название организации"
            leftIcon={<Building2 className="size-4" />}
            name="organizationName"
            onChange={(event) => setOrganizationName(event.target.value)}
            placeholder="Например, ООО ВРК Север…"
            value={organizationName}
          />
          <label className="grid gap-2.5">
            <span className="text-sm font-medium text-foreground">Роль организации</span>
            <select
              className="h-10 rounded-[var(--radius-md)] border border-input bg-card px-3.5 text-sm text-foreground shadow-xs outline-none transition-colors hover:border-border-strong focus:border-accent focus:ring-2 focus:ring-ring/15"
              name="organizationRole"
              onChange={(event) => setOrganizationRole(event.target.value as (typeof roleOptions)[number]["value"])}
              value={organizationRole}
            >
              {roleOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <div className="grid gap-4 md:grid-cols-2">
            <InputField
              autoComplete="off"
              label="Первый администратор"
              leftIcon={<UserRound className="size-4" />}
              name="firstAdminName"
              onChange={(event) => setFirstAdminName(event.target.value)}
              placeholder="Например, Анна Волкова…"
              value={firstAdminName}
            />
            <InputField
              autoComplete="off"
              label="Email приглашения"
              leftIcon={<Mail className="size-4" />}
              name="firstAdminEmail"
              onChange={(event) => setFirstAdminEmail(event.target.value)}
              placeholder="Например, admin@vrk.local…"
              spellCheck={false}
              type="email"
              value={firstAdminEmail}
            />
          </div>
        </div>

        <div className="rounded-[var(--radius-lg)] bg-muted/70 px-4 py-3 text-sm leading-6 text-muted-foreground">
          <div className="flex items-start gap-2">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-accent" />
            <p>
              Invite создается как одноразовый. Повторная активация тем же токеном будет отклонена backend-контрактом,
              а после acceptance пользователь попадет в launch wizard, а не в пустой runtime shell.
            </p>
          </div>
        </div>

        {error ? (
          <div
            aria-live="polite"
            className="rounded-[var(--radius-lg)] border border-destructive/20 bg-destructive-soft px-4 py-3 text-sm text-destructive"
          >
            {error}
          </div>
        ) : null}

        {success && invitePath ? (
          <div
            aria-atomic="true"
            aria-live="polite"
            className="grid gap-3 rounded-[var(--radius-xl)] border border-border bg-muted/60 p-4"
          >
            <p className="text-sm font-semibold text-foreground">Приглашение выпущено</p>
            <p className="text-sm leading-6 text-muted-foreground">
              Organization shell создана. Первый администратор должен открыть одноразовую ссылку ниже и задать пароль.
            </p>
            <div
              className="rounded-[var(--radius-lg)] border border-border bg-card px-4 py-3 font-mono text-sm text-foreground"
              data-testid="first-admin-invite-path"
            >
              {invitePath}
            </div>
            <div className="flex flex-wrap gap-3">
              <Link className={buttonVariants({ variant: "primary" })} href={invitePath}>
                <span>Открыть invite link</span>
                <span aria-hidden="true">
                  <ArrowUpRight className="size-4" />
                </span>
              </Link>
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigator.clipboard.writeText(window.location.origin + invitePath)}
              >
                Скопировать абсолютную ссылку
              </Button>
            </div>
          </div>
        ) : null}

        <Button fullWidth loading={isPending} type="submit">
          Создать shell и выдать приглашение
        </Button>
      </form>
    </Card>
  );
}
